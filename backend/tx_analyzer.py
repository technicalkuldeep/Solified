"""Solified Signer Firewall — transaction decoder, simulator and risk scorer.

Pure-python decoder for Solana transactions (legacy + v0). Handles the small
subset we actually care about: program IDs, System Program Transfer, and SPL
Token Transfer / Approve / Burn / MintTo (incl. *Checked variants).
"""
from __future__ import annotations

import base58
import base64
import struct
import os
import httpx
from dotenv import load_dotenv
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

load_dotenv(Path(__file__).parent / ".env")

RPC_TIMEOUT = 8.0

# ---- Known program registry -------------------------------------------------
SYSTEM_PROGRAM = "11111111111111111111111111111111"
TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
TOKEN_2022 = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
ASSOCIATED_TOKEN = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
COMPUTE_BUDGET = "ComputeBudget111111111111111111111111111111"
MEMO_PROGRAM = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"

KNOWN_PROGRAMS: Dict[str, Dict[str, str]] = {
    SYSTEM_PROGRAM: {"name": "System Program", "trusted": "true"},
    TOKEN_PROGRAM: {"name": "SPL Token", "trusted": "true"},
    TOKEN_2022: {"name": "Token-2022", "trusted": "true"},
    ASSOCIATED_TOKEN: {"name": "Associated Token", "trusted": "true"},
    COMPUTE_BUDGET: {"name": "Compute Budget", "trusted": "true"},
    MEMO_PROGRAM: {"name": "Memo Program", "trusted": "true"},
    "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4": {"name": "Jupiter Aggregator v6", "trusted": "true"},
    "JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB": {"name": "Jupiter Aggregator v3", "trusted": "true"},
    "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8": {"name": "Raydium AMM v4", "trusted": "true"},
    "9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP": {"name": "Orca Whirlpools", "trusted": "true"},
    "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc": {"name": "Orca Whirlpool", "trusted": "true"},
    "MarBmsSgKXdrN1egZf5sqe1TMThczhMLJhidtgXZLCDS": {"name": "Marinade Finance", "trusted": "true"},
    "Stake11111111111111111111111111111111111111": {"name": "Stake Program", "trusted": "true"},
    "BPFLoader2111111111111111111111111111111111": {"name": "BPF Loader v2", "trusted": "true"},
    "BPFLoaderUpgradeab1e11111111111111111111111": {"name": "BPF Loader Upgradeable", "trusted": "true"},
}

U64_MAX = 0xFFFFFFFFFFFFFFFF


# ---- Decoder primitives ----------------------------------------------------
def _read_compact_u16(buf: bytes, idx: int) -> Tuple[int, int]:
    """Compact-u16 (short-vec length) decoding."""
    val = 0
    for shift in (0, 7, 14):
        if idx >= len(buf):
            raise ValueError("compact-u16 out of bounds")
        b = buf[idx]
        idx += 1
        val |= (b & 0x7F) << shift
        if not (b & 0x80):
            return val, idx
    return val, idx


def _b58(b: bytes) -> str:
    return base58.b58encode(b).decode("ascii")


class DecodedInstruction:
    def __init__(self, program_id: str, accounts: List[str], data: bytes):
        self.program_id = program_id
        self.accounts = accounts
        self.data = data


class DecodedTx:
    def __init__(
        self,
        version: str,
        header: Tuple[int, int, int],
        accounts: List[str],
        instructions: List[DecodedInstruction],
    ):
        self.version = version
        self.header = header
        self.accounts = accounts
        self.instructions = instructions


def decode_transaction(tx_b64: str) -> DecodedTx:
    raw = base64.b64decode(tx_b64)
    idx = 0
    # signatures
    sig_count, idx = _read_compact_u16(raw, idx)
    idx += sig_count * 64

    if idx >= len(raw):
        raise ValueError("truncated transaction")

    # message version
    first = raw[idx]
    if first & 0x80:
        version = f"v{first & 0x7F}"
        idx += 1
    else:
        version = "legacy"

    if idx + 3 > len(raw):
        raise ValueError("missing header")
    num_required_sigs = raw[idx]
    num_readonly_signed = raw[idx + 1]
    num_readonly_unsigned = raw[idx + 2]
    idx += 3

    acc_count, idx = _read_compact_u16(raw, idx)
    if idx + acc_count * 32 > len(raw):
        raise ValueError("accounts overflow")
    accounts = []
    for _ in range(acc_count):
        accounts.append(_b58(raw[idx:idx + 32]))
        idx += 32

    # recent blockhash
    idx += 32

    instr_count, idx = _read_compact_u16(raw, idx)
    instructions: List[DecodedInstruction] = []
    for _ in range(instr_count):
        if idx >= len(raw):
            break
        prog_idx = raw[idx]
        idx += 1
        acct_len, idx = _read_compact_u16(raw, idx)
        acct_indices = list(raw[idx:idx + acct_len])
        idx += acct_len
        data_len, idx = _read_compact_u16(raw, idx)
        data = raw[idx:idx + data_len]
        idx += data_len
        program_id = accounts[prog_idx] if prog_idx < len(accounts) else "?"
        ix_accounts = [accounts[i] for i in acct_indices if i < len(accounts)]
        instructions.append(DecodedInstruction(program_id, ix_accounts, data))

    return DecodedTx(
        version=version,
        header=(num_required_sigs, num_readonly_signed, num_readonly_unsigned),
        accounts=accounts,
        instructions=instructions,
    )


# ---- Per-program decoders --------------------------------------------------
def _short(addr: str, n: int = 4, m: int = 4) -> str:
    return addr if len(addr) <= n + m + 3 else f"{addr[:n]}…{addr[-m:]}"


def decode_system_ix(ix: DecodedInstruction) -> Optional[Dict[str, Any]]:
    if len(ix.data) < 4:
        return None
    tag = struct.unpack_from("<I", ix.data, 0)[0]
    if tag == 2 and len(ix.data) >= 12 and len(ix.accounts) >= 2:
        lamports = struct.unpack_from("<Q", ix.data, 4)[0]
        return {
            "type": "SystemTransfer",
            "from": ix.accounts[0],
            "to": ix.accounts[1],
            "lamports": lamports,
            "sol": lamports / 1_000_000_000,
            "human": f"Transfer {lamports / 1_000_000_000:.6f} SOL → {_short(ix.accounts[1])}",
        }
    if tag == 0:
        return {"type": "SystemCreateAccount", "human": "Create account"}
    if tag == 8:
        return {"type": "SystemAllocate", "human": "Allocate account space"}
    return {"type": "SystemOther", "tag": tag, "human": f"System instruction (tag {tag})"}


def decode_token_ix(ix: DecodedInstruction) -> Optional[Dict[str, Any]]:
    if not ix.data:
        return None
    tag = ix.data[0]
    # SPL Token v3 / Token-2022 share most opcodes
    if tag == 3 and len(ix.data) >= 9 and len(ix.accounts) >= 3:
        amount = struct.unpack_from("<Q", ix.data, 1)[0]
        return {
            "type": "TokenTransfer",
            "amount_raw": amount,
            "source": ix.accounts[0],
            "dest": ix.accounts[1],
            "owner": ix.accounts[2],
            "human": f"Transfer {amount} token units → {_short(ix.accounts[1])}",
        }
    if tag == 12 and len(ix.data) >= 10 and len(ix.accounts) >= 4:
        amount = struct.unpack_from("<Q", ix.data, 1)[0]
        decimals = ix.data[9]
        ui = amount / (10 ** decimals) if decimals else amount
        return {
            "type": "TokenTransferChecked",
            "amount_raw": amount,
            "decimals": decimals,
            "ui_amount": ui,
            "source": ix.accounts[0],
            "mint": ix.accounts[1],
            "dest": ix.accounts[2],
            "human": f"Transfer {ui:g} tokens of {_short(ix.accounts[1])} → {_short(ix.accounts[2])}",
        }
    if tag == 4 and len(ix.data) >= 9 and len(ix.accounts) >= 3:
        amount = struct.unpack_from("<Q", ix.data, 1)[0]
        unlimited = amount == U64_MAX
        return {
            "type": "TokenApprove",
            "amount_raw": amount,
            "unlimited": unlimited,
            "source": ix.accounts[0],
            "delegate": ix.accounts[1],
            "human": f"Approve {'UNLIMITED' if unlimited else amount} token spending → {_short(ix.accounts[1])}",
        }
    if tag == 13 and len(ix.data) >= 10 and len(ix.accounts) >= 4:
        amount = struct.unpack_from("<Q", ix.data, 1)[0]
        decimals = ix.data[9]
        unlimited = amount == U64_MAX
        ui = amount / (10 ** decimals) if decimals else amount
        return {
            "type": "TokenApproveChecked",
            "amount_raw": amount,
            "decimals": decimals,
            "ui_amount": ui,
            "unlimited": unlimited,
            "source": ix.accounts[0],
            "mint": ix.accounts[1],
            "delegate": ix.accounts[2],
            "human": f"Approve {'UNLIMITED' if unlimited else f'{ui:g}'} of token {_short(ix.accounts[1])} → {_short(ix.accounts[2])}",
        }
    if tag == 5:
        return {"type": "TokenRevoke", "human": "Revoke token approval"}
    if tag == 7 and len(ix.data) >= 9:
        amount = struct.unpack_from("<Q", ix.data, 1)[0]
        return {"type": "TokenMintTo", "amount_raw": amount, "human": f"Mint {amount} tokens"}
    if tag == 8 and len(ix.data) >= 9:
        amount = struct.unpack_from("<Q", ix.data, 1)[0]
        return {"type": "TokenBurn", "amount_raw": amount, "human": f"Burn {amount} tokens"}
    if tag == 9:
        return {"type": "TokenCloseAccount", "human": "Close token account"}
    return {"type": "TokenOther", "tag": tag, "human": f"Token instruction (tag {tag})"}


def decode_instruction(ix: DecodedInstruction) -> Dict[str, Any]:
    prog = KNOWN_PROGRAMS.get(ix.program_id)
    base = {"programId": ix.program_id, "programName": prog["name"] if prog else None, "trusted": bool(prog)}
    if ix.program_id == SYSTEM_PROGRAM:
        decoded = decode_system_ix(ix)
        if decoded:
            base.update(decoded)
            return base
    if ix.program_id in (TOKEN_PROGRAM, TOKEN_2022):
        decoded = decode_token_ix(ix)
        if decoded:
            base.update(decoded)
            return base
    if ix.program_id == COMPUTE_BUDGET:
        base["type"] = "ComputeBudget"
        base["human"] = "Set compute budget"
        return base
    if ix.program_id == MEMO_PROGRAM:
        try:
            base["memo"] = ix.data.decode("utf-8", errors="replace")
        except Exception:
            base["memo"] = ""
        base["type"] = "Memo"
        base["human"] = f"Memo: {base['memo'][:60]}"
        return base
    if prog:
        base["type"] = "Known"
        base["human"] = f"Interact with {prog['name']}"
    else:
        base["type"] = "Unknown"
        base["human"] = f"Interact with unknown program {_short(ix.program_id, 6, 6)}"
    return base


# ---- Simulation ------------------------------------------------------------
async def simulate_transaction(tx_b64: str) -> Dict[str, Any]:
    rpc = os.environ.get("SOLANA_RPC_URL")
    if not rpc:
        return {"ok": False, "reason": "rpc_not_configured"}
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "simulateTransaction",
        "params": [
            tx_b64,
            {"sigVerify": False, "commitment": "processed", "encoding": "base64", "replaceRecentBlockhash": True},
        ],
    }
    try:
        async with httpx.AsyncClient(timeout=RPC_TIMEOUT) as client:
            r = await client.post(rpc, json=payload)
            data = r.json()
    except Exception as e:
        return {"ok": False, "reason": "network", "error": str(e)}
    if "error" in data:
        return {"ok": False, "reason": "rpc_error", "error": data["error"]}
    val = (data.get("result") or {}).get("value") or {}
    err = val.get("err")
    return {
        "ok": err is None,
        "err": err,
        "logs": (val.get("logs") or [])[-25:],
        "unitsConsumed": val.get("unitsConsumed"),
    }


# ---- Scoring ---------------------------------------------------------------
def analyze(tx_b64: str, decoded: DecodedTx, sim: Dict[str, Any], user_wallet: Optional[str]) -> Dict[str, Any]:
    actions: List[str] = []
    warnings: List[Dict[str, str]] = []
    programs_used: List[Dict[str, Any]] = []
    score = 100

    seen_programs: Dict[str, bool] = {}
    user = (user_wallet or "").strip() or None

    decoded_ixs = [decode_instruction(ix) for ix in decoded.instructions]

    has_unknown_program = False
    sol_outflow_lamports = 0
    has_unlimited_approve = False
    has_external_dest_token_transfer = False

    for di in decoded_ixs:
        pid = di.get("programId")
        if pid and pid not in seen_programs:
            seen_programs[pid] = True
            programs_used.append({
                "programId": pid,
                "name": di.get("programName"),
                "trusted": di.get("trusted", False),
            })
            if not di.get("trusted"):
                has_unknown_program = True

        t = di.get("type")
        human = di.get("human")
        if t == "ComputeBudget" or t == "Memo":
            # Don't add as user-visible action — it's plumbing.
            continue

        if human:
            actions.append(human)

        if t == "SystemTransfer":
            if user and di.get("from") == user:
                sol_outflow_lamports += di.get("lamports", 0)
        if t in ("TokenApprove", "TokenApproveChecked") and di.get("unlimited"):
            has_unlimited_approve = True
        if t in ("TokenTransfer", "TokenTransferChecked"):
            dest = di.get("dest")
            if user and dest and dest != user:
                has_external_dest_token_transfer = True

    # ----- warnings + score -----
    if has_unknown_program:
        score -= 25
        warnings.append({
            "level": "high",
            "label": "Unknown contract interaction",
            "detail": "Transaction calls a program that is not on the trusted registry.",
        })

    sol_out = sol_outflow_lamports / 1_000_000_000
    if sol_out >= 0.001:
        score -= 5
        if sol_out >= 1:
            score -= 10
            warnings.append({
                "level": "medium",
                "label": "Large SOL transfer",
                "detail": f"You will send {sol_out:.6f} SOL out of your wallet.",
            })

    # Hidden SOL transfer = SystemTransfer from user where there's also a Token swap call (likely DEX). Without DEX context we just flag any SystemTransfer when the main program is unknown.
    if sol_out > 0 and has_unknown_program:
        score -= 15
        warnings.append({
            "level": "high",
            "label": "Hidden SOL transfer",
            "detail": "An SOL transfer is bundled with an unknown program call.",
        })

    if has_unlimited_approve:
        score -= 30
        warnings.append({
            "level": "high",
            "label": "Unlimited token approval",
            "detail": "This transaction grants unlimited spending rights over a token. Drainer signature.",
        })

    if has_external_dest_token_transfer and has_unknown_program:
        score -= 10
        warnings.append({
            "level": "medium",
            "label": "Token transfer to external destination via unknown program",
            "detail": "Tokens are leaving your wallet through a program we can't verify.",
        })

    if not sim.get("ok"):
        score -= 10
        warnings.append({
            "level": "medium",
            "label": "Simulation failed",
            "detail": "On-chain simulation rejected the transaction. It may fail at execution.",
        })

    if not decoded_ixs:
        score = 0
        warnings.append({
            "level": "high",
            "label": "No decodable instructions",
            "detail": "We could not parse this transaction.",
        })

    score = max(0, min(100, score))
    if score >= 80:
        risk = "Safe"
        color = "green"
    elif score >= 50:
        risk = "Medium"
        color = "yellow"
    else:
        risk = "High"
        color = "red"

    return {
        "score": score,
        "riskLevel": risk,
        "riskColor": color,
        "actions": actions,
        "warnings": warnings,
        "programs": programs_used,
        "instructionCount": len(decoded_ixs),
        "version": decoded.version,
        "simulation": {
            "ok": sim.get("ok"),
            "err": sim.get("err"),
            "unitsConsumed": sim.get("unitsConsumed"),
            "logsTail": sim.get("logs", []),
        },
        "decoded": decoded_ixs,
    }


async def analyze_serialized_transaction(tx_b64: str, user_wallet: Optional[str]) -> Dict[str, Any]:
    decoded = decode_transaction(tx_b64)
    sim = await simulate_transaction(tx_b64)
    return analyze(tx_b64, decoded, sim, user_wallet)
