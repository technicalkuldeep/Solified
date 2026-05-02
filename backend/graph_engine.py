"""Solified Graph Engine — wallet network analysis for risk propagation.

Builds a 1-hop counterparty graph from a wallet's recent parsed transactions and
intersects it with the known scam list + a curated suspicious cluster (for
2-hop emulation without expensive multi-RPC fanout).
"""
from __future__ import annotations

import asyncio
from typing import Any, Dict, List, Optional, Set

from solana_service import get_signatures_for_address, get_transaction


# Curated 2-hop emulation list: addresses observed to interact with known
# scam wallets. Anyone our wallet talks to that's also in here is "2 hops".
SUSPICIOUS_CLUSTER: Set[str] = {
    # Demo placeholders — populate from threat-feed integrations.
    "5jxFwbfwHaUqgzghJrEYQrmzFu7uqezN5ihEjDKmQz3v",
    "9pZRFSibMakFG5aFrHpLBMtoXgxyL31Fwxr1c1kZGyfR",
    "EsXM5Y2ZVrM7oaayQpLzr1Zthkk9RcHmFq2yoAsJg2NX",
}


async def _safe_get_tx(sig: str) -> Optional[dict]:
    try:
        return await get_transaction(sig)
    except Exception:
        return None


async def build_counterparty_graph(
    wallet: str,
    signatures_limit: int = 60,
    max_tx_to_parse: int = 14,
) -> Dict[str, Any]:
    """Walk recent signatures, fetch parsed transactions, extract unique account
    keys (excluding self) → 1-hop counterparties + interaction count."""
    sigs = await get_signatures_for_address(wallet, limit=signatures_limit)
    if not sigs:
        return {"counterparties": [], "interactionCount": 0, "txParsed": 0}

    sample = sigs[:max_tx_to_parse]
    tasks = [_safe_get_tx(s["signature"]) for s in sample]
    txs = await asyncio.gather(*tasks)

    counterparties: Dict[str, int] = {}
    parsed = 0
    for tx in txs:
        if not tx:
            continue
        parsed += 1
        msg = ((tx.get("transaction") or {}).get("message") or {})
        keys = msg.get("accountKeys") or []
        for k in keys:
            pubkey = k.get("pubkey") if isinstance(k, dict) else k
            if not pubkey or pubkey == wallet:
                continue
            counterparties[pubkey] = counterparties.get(pubkey, 0) + 1
    # rank by interaction frequency
    ranked = sorted(counterparties.items(), key=lambda kv: kv[1], reverse=True)
    return {
        "counterparties": [{"address": a, "interactions": n} for a, n in ranked],
        "interactionCount": sum(counterparties.values()),
        "txParsed": parsed,
    }


def compute_network_risk(
    graph: Dict[str, Any],
    scam_wallets: Set[str],
    cluster_wallets: Set[str] = SUSPICIOUS_CLUSTER,
    self_in_scam: bool = False,
) -> Dict[str, Any]:
    counterparties = [c["address"] for c in graph.get("counterparties", [])]

    # Hop 0 = the wallet itself is on the scam list
    closest = None
    if self_in_scam:
        closest = 0

    direct = [c for c in counterparties if c in scam_wallets]
    cluster = [c for c in counterparties if c in cluster_wallets and c not in scam_wallets]

    if direct and (closest is None or closest > 1):
        closest = 1
    if cluster and (closest is None or closest > 2):
        closest = 2

    return {
        "closestScamDistance": closest,
        "connectedScamWallets": len(direct),
        "connectedCluster": len(cluster),
        "scamCounterparties": direct[:5],
        "clusterCounterparties": cluster[:5],
        "totalCounterparties": len(counterparties),
        "topCounterparties": graph.get("counterparties", [])[:8],
        "txParsed": graph.get("txParsed", 0),
    }
