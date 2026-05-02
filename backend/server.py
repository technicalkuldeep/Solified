from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta

from solana_service import (
    is_valid_solana_address,
    get_signatures_for_address,
    get_account_info,
    get_balance,
    get_token_supply,
    get_token_largest_accounts,
)
from dex_service import get_token_liquidity
from graph_engine import build_counterparty_graph, compute_network_risk
from tx_analyzer import analyze_serialized_transaction
from scoring import (
    score_wallet,
    score_token,
    TRUSTED_PROGRAMS,
    VERIFIED_TOKENS,
    WHITELIST_WALLETS,
    KNOWN_SCAM_WALLETS,
    build_flags_from_reasons,
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="Solified API — Verify Before You Trust")
api_router = APIRouter(prefix="/api")

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

CACHE_TTL_SECONDS = 300  # 5 minutes


# ---------- Models ----------
class AnalyzeRequest(BaseModel):
    address: str


class AnalyzeResponse(BaseModel):
    id: str
    type: Literal["wallet", "token"]
    address: str
    score: int
    riskLevel: str
    riskColor: str
    reasons: list
    insights: dict
    flags: list = []
    isWhitelisted: bool = False
    cached: bool = False
    analyzedAt: str
    lastAnalyzedAt: str
    tagline: str = "Solified — Verify Before You Trust"


# ---------- Helpers ----------
async def _cache_get(address: str) -> Optional[dict]:
    cutoff = (datetime.now(timezone.utc) - timedelta(seconds=CACHE_TTL_SECONDS)).isoformat()
    doc = await db.analyses.find_one(
        {"address": address, "analyzedAt": {"$gte": cutoff}},
        {"_id": 0},
        sort=[("analyzedAt", -1)],
    )
    return doc


async def _cache_set(result: dict) -> None:
    doc = dict(result)
    await db.analyses.insert_one(doc)
    # Append wallet history snapshot
    try:
        if doc.get("type") == "wallet":
            await db.wallet_history.update_one(
                {"address": doc["address"]},
                {
                    "$push": {
                        "history": {
                            "$each": [
                                {
                                    "ts": doc.get("analyzedAt"),
                                    "score": doc.get("score"),
                                    "riskLevel": doc.get("riskLevel"),
                                    "riskColor": doc.get("riskColor"),
                                }
                            ],
                            "$slice": -60,  # keep last 60 entries
                        }
                    },
                    "$set": {"lastUpdated": doc.get("analyzedAt")},
                },
                upsert=True,
            )
    except Exception as e:
        logger.warning(f"history append failed: {e}")
    # keep only last 200 entries for recent-scans feed
    count = await db.analyses.count_documents({})
    if count > 500:
        oldest = await db.analyses.find({}, {"_id": 1}).sort("analyzedAt", 1).limit(count - 500).to_list(1000)
        ids = [d["_id"] for d in oldest]
        if ids:
            await db.analyses.delete_many({"_id": {"$in": ids}})


def _is_token_mint(account_info: Optional[dict]) -> bool:
    if not account_info or not isinstance(account_info, dict):
        return False
    owner = account_info.get("owner")
    if owner not in {
        "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",  # SPL Token
        "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",   # Token-2022
    }:
        return False
    data = account_info.get("data") or {}
    if isinstance(data, dict):
        parsed = (data.get("parsed") or {})
        return parsed.get("type") == "mint"
    return False


async def _analyze_wallet_flow(address: str) -> dict:
    signatures, account_info, balance, graph = await asyncio.gather(
        get_signatures_for_address(address, limit=100),
        get_account_info(address),
        get_balance(address),
        build_counterparty_graph(address, signatures_limit=60, max_tx_to_parse=12),
        return_exceptions=True,
    )
    if isinstance(signatures, Exception):
        logger.warning(f"signatures error: {signatures}")
        signatures = []
    if isinstance(account_info, Exception):
        logger.warning(f"account_info error: {account_info}")
        account_info = None
    if isinstance(balance, Exception):
        logger.warning(f"balance error: {balance}")
        balance = 0
    if isinstance(graph, Exception):
        logger.warning(f"graph error: {graph}")
        graph = {"counterparties": [], "interactionCount": 0, "txParsed": 0}

    network_risk = compute_network_risk(
        graph,
        scam_wallets=set(KNOWN_SCAM_WALLETS),
        self_in_scam=address in KNOWN_SCAM_WALLETS,
    )
    return score_wallet(address, signatures, account_info, balance, network_risk=network_risk)


async def _analyze_token_flow(mint: str, account_info: Optional[dict]) -> dict:
    supply_info, largest, liquidity = await asyncio.gather(
        get_token_supply(mint),
        get_token_largest_accounts(mint),
        get_token_liquidity(mint),
        return_exceptions=True,
    )
    if isinstance(supply_info, Exception):
        supply_info = None
    if isinstance(largest, Exception):
        largest = []
    if isinstance(liquidity, Exception):
        liquidity = None
    return score_token(mint, account_info, largest or [], supply_info, liquidity)


async def _build_response(result: dict, cached: bool) -> AnalyzeResponse:
    # Whitelisting / verified override
    address = result.get("address")
    verified_token = result.get("insights", {}).get("verified", False)
    verified_wallet = result.get("type") == "wallet" and address in WHITELIST_WALLETS
    is_whitelisted = bool(verified_token or verified_wallet)

    risk_level = result["riskLevel"]
    risk_color = result["riskColor"]
    score_val = result["score"]

    if is_whitelisted:
        # Escalate to "Verified" when whitelisted and score is already safe.
        if score_val >= 80:
            risk_level = "Verified"
            risk_color = "green"

    # Wallet whitelist: also surface issuer info if present
    if verified_wallet and not verified_token:
        info = WHITELIST_WALLETS.get(address, {})
        result.setdefault("insights", {})
        result["insights"].setdefault("verified", True)
        result["insights"].setdefault("verifiedIssuer", info.get("issuer"))
        result["insights"].setdefault("verifiedName", info.get("name"))

    # Compute flags from reasons + whitelist context
    flags = build_flags_from_reasons(result.get("reasons", []), verified=is_whitelisted)

    analyzed_at = result.get("analyzedAt") or datetime.now(timezone.utc).isoformat()
    return AnalyzeResponse(
        id=result.get("id") or str(uuid.uuid4()),
        type=result["type"],
        address=result["address"],
        score=score_val,
        riskLevel=risk_level,
        riskColor=risk_color,
        reasons=result["reasons"],
        insights=result["insights"],
        flags=flags,
        isWhitelisted=is_whitelisted,
        cached=cached,
        analyzedAt=analyzed_at,
        lastAnalyzedAt=analyzed_at,
    )


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {
        "service": "Solified",
        "tagline": "Solified — Verify Before You Trust",
        "status": "ok",
    }


from fastapi import Request, Response

@api_router.api_route("/health", methods=["GET", "HEAD"])
async def health(request: Request):
    if request.method == "HEAD":
        return Response(status_code=200)

    rpc_ok = bool(os.environ.get("SOLANA_RPC_URL"))
    return {
        "service": "Solified",
        "status": "ok",
        "rpcConfigured": rpc_ok,
        "tagline": "Solified — Verify Before You Trust",
    }

@api_router.get("/whitelist")
async def whitelist():
    """Exposed trusted addresses — consumed by Chrome extension."""
    tokens = [
        {"address": addr, "type": "token", **meta}
        for addr, meta in VERIFIED_TOKENS.items()
    ]
    wallets = [
        {"address": addr, "type": "wallet", **meta}
        for addr, meta in WHITELIST_WALLETS.items()
    ]
    return {"tokens": tokens, "wallets": wallets}


# ---------- Signer Firewall ----------
class AnalyzeTxRequest(BaseModel):
    transaction: str  # base64-encoded serialized solana transaction
    userWallet: Optional[str] = None
    intent: Optional[str] = None  # e.g. "swap", "send", "mint", "stake", "approve"
    intentDetail: Optional[str] = None  # raw button label if available


@api_router.post("/analyze-transaction")
async def analyze_transaction_endpoint(req: AnalyzeTxRequest):
    if not req.transaction:
        raise HTTPException(status_code=400, detail="Missing transaction payload")
    try:
        result = await analyze_serialized_transaction(req.transaction, req.userWallet)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Could not decode transaction: {e}")
    except Exception as e:
        logger.error(f"analyze-transaction failed: {e}")
        raise HTTPException(status_code=500, detail="Transaction analysis failed")

    # Intent vs Reality detection (additive)
    intent = (req.intent or "").lower().strip() or None
    if intent:
        decoded_types = [d.get("type") for d in result.get("decoded", [])]
        action_blob = " ".join(result.get("actions", [])).lower()
        mismatch = None
        expected = None
        if intent == "swap":
            expected = "Swap (token in/out)"
            has_unlimited_approve = any(
                d.get("type") in ("TokenApprove", "TokenApproveChecked") and d.get("unlimited")
                for d in result.get("decoded", [])
            )
            if has_unlimited_approve:
                mismatch = "Swap requested, but transaction grants UNLIMITED token approval — drainer pattern."
        elif intent == "send":
            expected = "Single SOL or token transfer"
            non_transfer = [
                t for t in decoded_types
                if t and t not in ("SystemTransfer", "TokenTransfer", "TokenTransferChecked", "ComputeBudget", "Memo")
            ]
            if non_transfer:
                mismatch = f"Send requested, but transaction also performs: {', '.join(set(non_transfer))}."
        elif intent == "mint":
            expected = "NFT/Token mint call"
            if "send" in action_blob and "0.0" not in action_blob:
                # most mint flows transfer SOL for fee — only flag huge outflow
                pass
        elif intent == "approve":
            expected = "Single token approval"
            if any(t == "SystemTransfer" for t in decoded_types):
                mismatch = "Approve requested, but transaction also moves SOL out of your wallet."
        elif intent == "stake":
            expected = "Stake program interaction"
            has_stake = any(
                p.get("name") and "stake" in (p.get("name") or "").lower()
                for p in result.get("programs", [])
            )
            if not has_stake:
                mismatch = "Stake requested, but no Stake / Marinade program detected in this transaction."

        result["intent"] = {
            "raw": req.intentDetail or req.intent,
            "normalized": intent,
            "expected": expected,
            "actual": result.get("actions", []),
            "mismatch": mismatch,
        }
        if mismatch:
            result["warnings"].insert(0, {
                "level": "high",
                "label": "Intent vs Reality mismatch",
                "detail": mismatch,
            })
            # additional deduction for clear UX deception
            result["score"] = max(0, result["score"] - 20)
            if result["score"] >= 80:
                result["riskLevel"] = "Safe"; result["riskColor"] = "green"
            elif result["score"] >= 50:
                result["riskLevel"] = "Medium"; result["riskColor"] = "yellow"
            else:
                result["riskLevel"] = "High"; result["riskColor"] = "red"

    result["analyzedAt"] = datetime.now(timezone.utc).isoformat()
    result["tagline"] = "Solified Signer Firewall — Verify Before You Trust"
    return result


@api_router.get("/wallet-timeline/{address}")
async def wallet_timeline(address: str, days: int = 30):
    if not is_valid_solana_address(address):
        raise HTTPException(status_code=400, detail="Invalid Solana address")
    days = max(1, min(180, days))
    doc = await db.wallet_history.find_one({"address": address}, {"_id": 0})
    history = (doc or {}).get("history", [])
    # Optionally filter by days
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    filtered = []
    for h in history:
        try:
            ts = h.get("ts")
            t = datetime.fromisoformat(ts.replace("Z", "+00:00")) if isinstance(ts, str) else None
            if t is None or t >= cutoff:
                filtered.append(h)
        except Exception:
            filtered.append(h)
    return {
        "address": address,
        "history": filtered,
        "count": len(filtered),
        "tagline": "Solified — Verify Before You Trust",
    }


# ---------- Known dApps registry (used by extension dappDetector) ----------
@api_router.get("/known-dapps")
async def known_dapps():
    """Whitelist of legitimate Solana dApp domains used by the extension's
    Fake-dApp Detector. Frontend can also embed a static fallback."""
    return {
        "dapps": [
            {"domain": "jup.ag", "name": "Jupiter Aggregator"},
            {"domain": "raydium.io", "name": "Raydium"},
            {"domain": "orca.so", "name": "Orca"},
            {"domain": "marinade.finance", "name": "Marinade Finance"},
            {"domain": "tensor.trade", "name": "Tensor"},
            {"domain": "magiceden.io", "name": "Magic Eden"},
            {"domain": "drift.trade", "name": "Drift"},
            {"domain": "kamino.finance", "name": "Kamino"},
            {"domain": "marginfi.com", "name": "MarginFi"},
            {"domain": "phantom.app", "name": "Phantom"},
            {"domain": "solflare.com", "name": "Solflare"},
            {"domain": "backpack.app", "name": "Backpack"},
            {"domain": "solana.com", "name": "Solana Foundation"},
            {"domain": "solscan.io", "name": "Solscan"},
            {"domain": "explorer.solana.com", "name": "Solana Explorer"},
            {"domain": "meteora.ag", "name": "Meteora"},
            {"domain": "step.finance", "name": "Step Finance"},
            {"domain": "jito.network", "name": "Jito"},
        ]
    }


@api_router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest):
    """Auto-detect whether input is a token mint or wallet, then score."""
    address = (req.address or "").strip()
    if not is_valid_solana_address(address):
        raise HTTPException(status_code=400, detail="Invalid Solana address")

    # cache hit?
    cached = await _cache_get(address)
    if cached:
        return await _build_response(cached, cached=True)

    try:
        acc = await get_account_info(address)
    except Exception as e:
        logger.error(f"account info failed: {e}")
        raise HTTPException(status_code=502, detail="Solana RPC unavailable")

    if _is_token_mint(acc):
        result = await _analyze_token_flow(address, acc)
    else:
        result = await _analyze_wallet_flow(address)

    result["id"] = str(uuid.uuid4())
    result["analyzedAt"] = datetime.now(timezone.utc).isoformat()
    await _cache_set(result)
    return await _build_response(result, cached=False)


@api_router.post("/analyze-wallet", response_model=AnalyzeResponse)
async def analyze_wallet(req: AnalyzeRequest):
    address = (req.address or "").strip()
    if not is_valid_solana_address(address):
        raise HTTPException(status_code=400, detail="Invalid Solana address")
    cached = await _cache_get(address)
    if cached and cached.get("type") == "wallet":
        return await _build_response(cached, cached=True)
    result = await _analyze_wallet_flow(address)
    result["id"] = str(uuid.uuid4())
    result["analyzedAt"] = datetime.now(timezone.utc).isoformat()
    await _cache_set(result)
    return await _build_response(result, cached=False)


@api_router.post("/analyze-token", response_model=AnalyzeResponse)
async def analyze_token(req: AnalyzeRequest):
    mint = (req.address or "").strip()
    if not is_valid_solana_address(mint):
        raise HTTPException(status_code=400, detail="Invalid Solana address")
    cached = await _cache_get(mint)
    if cached and cached.get("type") == "token":
        return await _build_response(cached, cached=True)
    try:
        acc = await get_account_info(mint)
    except Exception as e:
        logger.error(f"account info failed: {e}")
        raise HTTPException(status_code=502, detail="Solana RPC unavailable")
    if not _is_token_mint(acc):
        raise HTTPException(status_code=400, detail="Address is not a valid SPL token mint")
    result = await _analyze_token_flow(mint, acc)
    result["id"] = str(uuid.uuid4())
    result["analyzedAt"] = datetime.now(timezone.utc).isoformat()
    await _cache_set(result)
    return await _build_response(result, cached=False)


@api_router.get("/recent-scans")
async def recent_scans(limit: int = 10):
    limit = max(1, min(50, limit))
    docs = await db.analyses.find({}, {"_id": 0}).sort("analyzedAt", -1).limit(limit).to_list(limit)
    out = []
    for d in docs:
        addr = d["address"]
        is_verified_token = d.get("insights", {}).get("verified", False)
        is_whitelisted = bool(is_verified_token or (d.get("type") == "wallet" and addr in WHITELIST_WALLETS))
        risk_level = d["riskLevel"]
        risk_color = d["riskColor"]
        if is_whitelisted and d["score"] >= 80:
            risk_level = "Verified"
            risk_color = "green"
        out.append({
            "address": addr,
            "type": d["type"],
            "score": d["score"],
            "riskLevel": risk_level,
            "riskColor": risk_color,
            "isWhitelisted": is_whitelisted,
            "analyzedAt": d["analyzedAt"],
        })
    return out


@api_router.get("/trusted-programs")
async def trusted_programs():
    return [{"programId": pid, "name": name} for pid, name in TRUSTED_PROGRAMS.items()]


# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
