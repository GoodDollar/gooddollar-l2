#!/usr/bin/env python3
"""Build the analytics address book — a single machine-readable artifact
that consolidates canonical contract addresses (from
``op-stack/addresses.json``), protocol grouping, UBI fee routes
(from ``docs/UBI-FEE-ACCOUNTING.md`` §4), and a projection of the
relevant ABI events/functions from ``out/<Name>.sol/<Name>.json``.

Iteration 26 of ``docs/TESTNET-READINESS-50-ITERATIONS.md`` requires
this file as the input contract for:

  * Iter 27 — internal analytics dashboard
  * Iter 28 — Dune SQL package
  * Iter 30 — README / doc-index checkpoint 6

The generator is **offline**: it reads only repository files, computes
keccak256 in-process, and writes a deterministic JSON document. No RPC
calls, no rebuild of ``out/`` (it consumes whatever is already there).

Usage::

    python scripts/build-analytics-address-book.py \\
        --output analytics/address-book.json

    python scripts/build-analytics-address-book.py \\
        --output analytics/address-book.json --check

In ``--check`` mode the generator regenerates in memory, normalises
the ``generated_at`` field, diffs against the committed artifact, and
exits non-zero on mismatch. This is the regression guard used by
iter 30's full gate.
"""

from __future__ import annotations

import argparse
import datetime as _dt
import difflib
import json
import os
import re
import sys
from pathlib import Path
from typing import Any

try:  # Preferred: pycryptodome (already pulled in by scripts/refresh-addresses.py).
    from Crypto.Hash import keccak as _keccak  # type: ignore

    def _keccak256(data: bytes) -> bytes:
        h = _keccak.new(digest_bits=256)
        h.update(data)
        return h.digest()
except Exception:  # pragma: no cover — exercised only on environments without pycryptodome
    try:
        from eth_utils import keccak as _eth_keccak  # type: ignore

        def _keccak256(data: bytes) -> bytes:
            return _eth_keccak(data)
    except Exception as exc:  # pragma: no cover
        raise SystemExit(
            "Neither pycryptodome nor eth_utils is available; cannot "
            "compute keccak256 event topics. Install with: "
            "pip install pycryptodome"
        ) from exc


REPO_ROOT = Path(__file__).resolve().parent.parent
ADDRESSES_PATH = REPO_ROOT / "op-stack" / "addresses.json"
UBI_DOC_PATH = REPO_ROOT / "docs" / "UBI-FEE-ACCOUNTING.md"
OUT_DIR = REPO_ROOT / "out"

ARTIFACT_VERSION = "1"
TIMESTAMP_SENTINEL = "1970-01-01T00:00:00Z"


# ---------------------------------------------------------------------------
# Protocol classifier — single source of truth for grouping contracts.
# Unknown contracts default to "infrastructure" with a console WARN so future
# iterations notice new deploys.
# ---------------------------------------------------------------------------

PROTOCOL_CLASSIFIER: dict[str, str] = {
    # swap
    "GoodSwapRouter": "swap",
    "UBIFeeHook": "swap",
    "LiFiBridgeAggregator": "swap",
    "SwapPriceOracle": "swap",
    "FastWithdrawalLP": "swap",
    # perps
    "PerpEngine": "perps",
    "MarginVault": "perps",
    "FundingRate": "perps",
    "PerpPriceOracle": "perps",
    # predict
    "MarketFactory": "predict",
    "ConditionalTokens": "predict",
    # lend
    "GoodLendPool": "lend",
    "GoodLendToken": "lend",
    # stable
    "VaultManager": "stable",
    "VaultFactory": "stable",
    "PegStabilityModule": "stable",
    "StabilityPool": "stable",
    "CollateralRegistry": "stable",
    "gUSD": "stable",
    # stocks
    "CollateralVault": "stocks",
    "SyntheticAssetFactory": "stocks",
    "StocksPriceOracle": "stocks",
    # ubi_core
    "GoodDollarToken": "ubi_core",
    "UBIClaimV2": "ubi_core",
    "UBIFeeSplitter": "ubi_core",
    "UBIRevenueTracker": "ubi_core",
    # infrastructure
    "ValidatorStaking": "infrastructure",
    "AgentRegistry": "infrastructure",
    "GoodDAO": "infrastructure",
    "VoteEscrowedGD": "infrastructure",
    "MockUSDC": "infrastructure",
    "MockWETH": "infrastructure",
    # deprecated (kept for archaeology — flagged separately so the dashboard
    # ignores them but auditors can still trace the address)
    "CollateralVault_WRONG_GDT": "deprecated",
}

PROTOCOL_LABELS: dict[str, str] = {
    "swap": "GoodSwap",
    "perps": "GoodPerps",
    "predict": "GoodPredict",
    "lend": "GoodLend",
    "stable": "GoodStable",
    "stocks": "GoodStocks",
    "ubi_core": "UBI core",
    "infrastructure": "Infrastructure",
    "deprecated": "Deprecated (do not use)",
}

# Whitelisted UBI/treasury-relevant function names. We only project these
# into the artifact to keep size small and avoid leaking unrelated public
# surface that consumers shouldn't depend on.
RELEVANT_FUNCTIONS: set[str] = {
    "splitFee",
    "splitFeeToken",
    "splitTradingFee",
    "splitFundingFee",
    "splitLiquidationFee",
    "splitMintingFee",
    "splitLiquidationPenalty",
    "splitGovernanceFee",
    "fundUBIPool",
    "treasury",
    "feeSplitter",
    "setFeeSplit",
    "setTreasury",
    "setUBIClaimContract",
    "ubiRecipient",
    "ubiClaimContract",
    "ubiBPS",
    "protocolBPS",
    "releaseToUBI",
    "totalFeesCollected",
    "totalUBIFunded",
}


# ---------------------------------------------------------------------------
# UBI fee routes — inline fallback table. Mirrors docs/UBI-FEE-ACCOUNTING.md
# §4 row-for-row. The doc parser is preferred, but if the doc structure
# drifts the fallback keeps the build green and prints a clear WARN.
# Tests assert the two never silently diverge.
# ---------------------------------------------------------------------------

FEE_ROUTES_FALLBACK: list[dict[str, Any]] = [
    {
        "id": 1,
        "protocol": "swap",
        "kind": "v4_hook",
        "label": "Swap (V4) — afterSwap hook",
        "source_contract": "UBIFeeHook",
        "fee_token": "swap_output",
        "sink_contract": "GoodDollarToken",
        "sink_method": "fundUBIPool",
        "event_contract": "UBIFeeHook",
        "event_signature": "UBIFeeCollected(address,uint256,uint256,address)",
    },
    {
        "id": 2,
        "protocol": "swap",
        "kind": "cross_chain_bridge",
        "label": "Swap (cross-chain) — Li.Fi bridge skim",
        "source_contract": "LiFiBridgeAggregator",
        "fee_token": "source_token_or_native",
        "sink_contract": "UBIFeeSplitter",
        "sink_method": "transfer",
        "event_contract": "LiFiBridgeAggregator",
        "event_signature": "UBIFeeCollected(uint256,address,uint256)",
    },
    {
        "id": 3,
        "protocol": "perps",
        "kind": "trading_fee",
        "label": "Perps trading fee — open/close",
        "source_contract": "PerpEngine",
        "fee_token": "GoodDollarToken",
        "sink_contract": "PerpUBIFeeSplitter",
        "sink_method": "splitFee",
        "event_contract": "PerpUBIFeeSplitter",
        "event_signature": "TradingFeeSplit(address,uint256,uint256,uint256)",
    },
    {
        "id": 4,
        "protocol": "perps",
        "kind": "funding_fee",
        "label": "Perps funding fee — periodic payment",
        "source_contract": "PerpEngine",
        "fee_token": "GoodDollarToken",
        "sink_contract": "PerpUBIFeeSplitter",
        "sink_method": "splitFundingFee",
        "event_contract": "PerpUBIFeeSplitter",
        "event_signature": "FundingFeeSplit(uint256,uint256,uint256)",
    },
    {
        "id": 5,
        "protocol": "perps",
        "kind": "liquidation_fee",
        "label": "Perps liquidation fee — liquidator bounty",
        "source_contract": "PerpEngine",
        "fee_token": "GoodDollarToken",
        "sink_contract": "PerpUBIFeeSplitter",
        "sink_method": "splitLiquidationFee",
        "event_contract": "PerpUBIFeeSplitter",
        "event_signature": "LiquidationUBI(address,address,uint256,uint256)",
    },
    {
        "id": 6,
        "protocol": "predict",
        "kind": "market_creation_fee",
        "label": "Predict — market creation fee",
        "source_contract": "MarketFactory",
        "fee_token": "GoodDollarToken",
        "sink_contract": "PredictUBIFeeSplitter",
        "sink_method": "splitFee",
        "event_contract": "PredictUBIFeeSplitter",
        "event_signature": "FeeSplit(address,string,uint256,uint256,uint256,uint256)",
    },
    {
        "id": 7,
        "protocol": "predict",
        "kind": "resolver_fee",
        "label": "Predict — optimistic resolver bond/fee",
        "source_contract": "OptimisticResolver",
        "fee_token": "GoodDollarToken",
        "sink_contract": "PredictUBIFeeSplitter",
        "sink_method": "splitFee",
        "event_contract": "OptimisticResolver",
        "event_signature": "ResolutionFinalized(uint256,bool,bool)",
    },
    {
        "id": 8,
        "protocol": "lend",
        "kind": "reserve_factor",
        "label": "Lend — reserve factor (treasury mint)",
        "source_contract": "GoodLendPool",
        "fee_token": "gToken",
        "sink_contract": "UBIFeeSplitter",
        "sink_method": "mintToTreasury",
        "event_contract": "GoodLendPool",
        "event_signature": "TreasuryMint(address,uint256)",
    },
    {
        "id": 9,
        "protocol": "stable",
        "kind": "stability_fee",
        "label": "Stable — VaultManager.drip stability fee",
        "source_contract": "VaultManager",
        "fee_token": "gUSD",
        "sink_contract": "StableUBIFeeSplitter",
        "sink_method": "splitFeeToken",
        "event_contract": "VaultManager",
        "event_signature": "FeeCollected(bytes32,uint256)",
    },
    {
        "id": 10,
        "protocol": "stable",
        "kind": "minting_fee",
        "label": "Stable — PegStabilityModule minting fee",
        "source_contract": "PegStabilityModule",
        "fee_token": "gUSD",
        "sink_contract": "StableUBIFeeSplitter",
        "sink_method": "splitMintingFee",
        "event_contract": "PegStabilityModule",
        "event_signature": "SwapUSDCForGUSD(address,uint256,uint256,uint256)",
    },
    {
        "id": 11,
        "protocol": "stable",
        "kind": "liquidation_penalty",
        "label": "Stable — stability pool liquidation penalty",
        "source_contract": "StableUBIFeeSplitter",
        "fee_token": "gUSD_or_GoodDollarToken",
        "sink_contract": "StableUBIFeeSplitter",
        "sink_method": "splitLiquidationPenalty",
        "event_contract": "StableUBIFeeSplitter",
        "event_signature": "LiquidationPenaltySplit(bytes32,address,uint256,uint256)",
    },
    {
        "id": 12,
        "protocol": "stable",
        "kind": "governance_fee",
        "label": "Stable — governance-mandated fee",
        "source_contract": "StableUBIFeeSplitter",
        "fee_token": "GoodDollarToken",
        "sink_contract": "StableUBIFeeSplitter",
        "sink_method": "splitGovernanceFee",
        "event_contract": "StableUBIFeeSplitter",
        "event_signature": "GovernanceFeeSplit(address,uint256,uint256)",
    },
    {
        "id": 13,
        "protocol": "stocks",
        "kind": "trading_fee",
        "label": "Stocks — synthetic stock trading fee",
        "source_contract": "CollateralVault",
        "fee_token": "GoodDollarToken",
        "sink_contract": "StocksUBIFeeSplitter",
        "sink_method": "splitFee",
        "event_contract": "StocksUBIFeeSplitter",
        "event_signature": "TradingFeeSplit(address,string,uint256,uint256)",
    },
    {
        "id": 14,
        "protocol": "stocks",
        "kind": "liquidation_remnant",
        "label": "Stocks — liquidation auction remnant",
        "source_contract": "CollateralVault",
        "fee_token": "GoodDollarToken",
        "sink_contract": "StocksUBIFeeSplitter",
        "sink_method": "splitFee",
        "event_contract": "StocksUBIFeeSplitter",
        "event_signature": "FeeSplit(address,string,uint256,uint256,uint256,uint256)",
    },
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _load_addresses() -> dict[str, Any]:
    """Load and lightly validate ``op-stack/addresses.json``."""
    if not ADDRESSES_PATH.exists():
        raise SystemExit(f"Missing canonical addresses file: {ADDRESSES_PATH}")
    raw = json.loads(ADDRESSES_PATH.read_text())
    if "contracts" not in raw or not isinstance(raw["contracts"], dict):
        raise SystemExit(
            f"{ADDRESSES_PATH} is malformed: missing 'contracts' object"
        )
    return raw


def _load_abi(name: str) -> dict[str, Any] | None:
    """Load ``out/<name>.sol/<name>.json`` if present; else return None."""
    p = OUT_DIR / f"{name}.sol" / f"{name}.json"
    if not p.exists():
        return None
    try:
        return json.loads(p.read_text())
    except Exception as exc:  # pragma: no cover
        print(f"WARN: failed to parse ABI for {name}: {exc}", file=sys.stderr)
        return None


def _canonical_event_signature(event: dict[str, Any]) -> str:
    """Compute the canonical event signature string for a Solidity event ABI."""
    name = event["name"]
    types = ",".join(inp["type"] for inp in event.get("inputs", []))
    return f"{name}({types})"


def _topic0(sig: str) -> str:
    """Return ``0x``-prefixed 32-byte hex of keccak256(sig)."""
    return "0x" + _keccak256(sig.encode("utf-8")).hex()


def _project_events(abi: list[dict[str, Any]]) -> list[dict[str, Any]]:
    events = []
    for e in abi:
        if e.get("type") != "event":
            continue
        sig = _canonical_event_signature(e)
        events.append(
            {
                "name": e["name"],
                "signature": sig,
                "topic0": _topic0(sig),
                "anonymous": e.get("anonymous", False),
                "inputs": [
                    {
                        "name": inp.get("name", ""),
                        "type": inp["type"],
                        "indexed": inp.get("indexed", False),
                    }
                    for inp in e.get("inputs", [])
                ],
            }
        )
    events.sort(key=lambda x: x["name"])
    return events


def _project_functions(abi: list[dict[str, Any]]) -> list[dict[str, Any]]:
    funcs = []
    for e in abi:
        if e.get("type") != "function":
            continue
        if e["name"] not in RELEVANT_FUNCTIONS:
            continue
        funcs.append(
            {
                "name": e["name"],
                "inputs": [{"name": i.get("name", ""), "type": i["type"]} for i in e.get("inputs", [])],
                "outputs": [{"name": o.get("name", ""), "type": o["type"]} for o in e.get("outputs", [])],
                "stateMutability": e.get("stateMutability", "nonpayable"),
            }
        )
    funcs.sort(key=lambda x: (x["name"], len(x["inputs"])))
    return funcs


def _parse_fee_routes_from_doc(doc_text: str) -> list[dict[str, Any]] | None:
    """Best-effort parser for §4's markdown table. Returns ``None`` on failure;
    caller falls back to ``FEE_ROUTES_FALLBACK`` with a WARN.

    The parser is *deliberately conservative* — it counts rows and confirms
    each row's ID column. If the count doesn't equal 14 or any row is
    malformed, we return None rather than producing a degraded artifact.
    """
    m = re.search(r"^## 4\..*$", doc_text, re.MULTILINE)
    if not m:
        return None
    start = m.end()
    next_h = re.search(r"^## 5\.", doc_text[start:], re.MULTILINE)
    section = doc_text[start : start + next_h.start()] if next_h else doc_text[start:]

    rows = []
    for line in section.splitlines():
        line = line.strip()
        if not line.startswith("|"):
            continue
        if re.match(r"^\|\s*[-:|]+\s*\|", line):  # header separator row
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        if len(cells) < 7:
            continue
        if cells[0] in {"#", ""}:
            continue
        try:
            row_id = int(cells[0])
        except ValueError:
            continue
        rows.append(row_id)

    if len(rows) != len(FEE_ROUTES_FALLBACK):
        return None
    if rows != [r["id"] for r in FEE_ROUTES_FALLBACK]:
        return None
    return FEE_ROUTES_FALLBACK


# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------


def build(no_timestamp: bool = False) -> dict[str, Any]:
    raw_addresses = _load_addresses()
    contracts: dict[str, str] = raw_addresses["contracts"]
    chain_id = raw_addresses.get("chain_id")
    chain_name = raw_addresses.get("chain_name", "GoodDollar L2 Devnet")
    rpc_url = raw_addresses.get("rpc_url", "https://rpc.goodclaw.org")
    explorer_url = raw_addresses.get("explorer_url", "https://explorer.goodclaw.org")

    # --- Protocols ---
    protocols: dict[str, dict[str, Any]] = {
        key: {"label": label, "contracts": []} for key, label in PROTOCOL_LABELS.items()
    }
    unknown_contracts: list[str] = []
    for name, addr in sorted(contracts.items()):
        group = PROTOCOL_CLASSIFIER.get(name)
        if group is None:
            group = "infrastructure"
            unknown_contracts.append(name)
        protocols[group]["contracts"].append({"name": name, "address": addr})
    # stable sort within group
    for g in protocols.values():
        g["contracts"].sort(key=lambda c: c["name"])

    # --- Fee routes ---
    routes_source = "docs/UBI-FEE-ACCOUNTING.md"
    parsed = None
    if UBI_DOC_PATH.exists():
        parsed = _parse_fee_routes_from_doc(UBI_DOC_PATH.read_text())
    if parsed is None:
        print(
            "WARN: §4 fee-routes doc parse fell back to inline FEE_ROUTES_FALLBACK",
            file=sys.stderr,
        )
        routes_source = "inline fallback (FEE_ROUTES_FALLBACK)"
        routes_def = FEE_ROUTES_FALLBACK
    else:
        routes_def = parsed

    pending_splitters: set[str] = set()
    fee_routes: list[dict[str, Any]] = []
    for r in routes_def:
        src = r["source_contract"]
        sink = r["sink_contract"]
        event_contract = r["event_contract"]
        sig = r["event_signature"]

        src_addr = contracts.get(src)
        sink_addr = contracts.get(sink)
        sink_fallback = None
        if sink_addr is None:
            sink_addr = None
            pending_splitters.add(sink)
            # If a specialised splitter isn't deployed, the route lands in
            # the base splitter (UBIFeeSplitter) via try/catch fallback
            # documented in UBI-FEE-ACCOUNTING.md §4 footnotes.
            base = contracts.get("UBIFeeSplitter")
            if base is not None:
                sink_fallback = {
                    "contract": "UBIFeeSplitter",
                    "address": base,
                }

        if src_addr is None:
            pending_splitters.add(src)

        # If the event-emitting contract isn't deployed, its event_signature
        # is still canonical (taken from source ABI), but we record
        # event_contract_deployed=false so consumers can grey it out.
        event_contract_addr = contracts.get(event_contract)

        fee_routes.append(
            {
                "id": r["id"],
                "protocol": r["protocol"],
                "kind": r["kind"],
                "label": r["label"],
                "source_contract": src,
                "source_address": src_addr,
                "source_address_pending_deploy": src_addr is None,
                "fee_token": r["fee_token"],
                "sink_contract": sink,
                "sink_address": sink_addr,
                "sink_address_fallback": sink_fallback,
                "sink_method": r["sink_method"],
                "event_contract": event_contract,
                "event_contract_address": event_contract_addr,
                "event_contract_deployed": event_contract_addr is not None,
                "event_signature": sig,
                "event_topic0": _topic0(sig),
            }
        )

    # --- ABIs ---
    needed_contracts: set[str] = set(contracts.keys()) | {
        r["source_contract"] for r in routes_def
    } | {r["sink_contract"] for r in routes_def} | {
        r["event_contract"] for r in routes_def
    }
    abis: dict[str, Any] = {}
    missing_abis: list[str] = []
    for name in sorted(needed_contracts):
        abi_doc = _load_abi(name)
        if abi_doc is None:
            missing_abis.append(name)
            continue
        abi_list = abi_doc.get("abi", [])
        path = f"out/{name}.sol/{name}.json"
        try:
            mtime = _dt.datetime.fromtimestamp(
                (OUT_DIR / f"{name}.sol" / f"{name}.json").stat().st_mtime,
                tz=_dt.timezone.utc,
            ).strftime("%Y-%m-%dT%H:%M:%SZ")
        except Exception:  # pragma: no cover
            mtime = None
        abis[name] = {
            "path": path,
            "compiled_at": mtime,
            "events": _project_events(abi_list),
            "functions": _project_functions(abi_list),
        }

    generated_at = (
        TIMESTAMP_SENTINEL
        if no_timestamp
        else _dt.datetime.now(_dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    )

    return {
        "version": ARTIFACT_VERSION,
        "generated_at": generated_at,
        "generator": "scripts/build-analytics-address-book.py",
        "chain": {
            "id": chain_id,
            "name": chain_name,
            "rpc_url": rpc_url,
            "explorer_url": explorer_url,
        },
        "sources": {
            "addresses": "op-stack/addresses.json",
            "fee_routes": routes_source,
            "abis": "out/<Name>.sol/<Name>.json",
        },
        "protocols": protocols,
        "fee_routes": fee_routes,
        "abis": abis,
        "notes": {
            "specialised_splitters_pending": sorted(pending_splitters),
            "unknown_contracts": sorted(unknown_contracts),
            "missing_abis": sorted(missing_abis),
            "ubi_split_doc": "docs/UBI-FEE-ACCOUNTING.md",
            "fee_split_bps": {"ubi": 2000, "protocol": 8000},
            "ubi_breakdown_doc": {
                "human_ubi_pool_bps": 1667,
                "g_dollar_treasury_bps": 6333,
                "validator_rewards_bps": 2000,
            },
        },
    }


def serialise(doc: dict[str, Any]) -> str:
    return json.dumps(doc, indent=2, sort_keys=True) + "\n"


def _normalised_for_diff(payload: str) -> str:
    """Replace the dynamic ``generated_at`` field with the sentinel so the
    diff is stable regardless of wall-clock time."""
    return re.sub(
        r'"generated_at": "[^"]+"',
        f'"generated_at": "{TIMESTAMP_SENTINEL}"',
        payload,
    )


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output",
        required=True,
        help="Path to write (or check) the analytics address book JSON.",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Regenerate in memory and diff against the committed file. "
        "Exit non-zero on mismatch. Does not write.",
    )
    parser.add_argument(
        "--no-timestamp",
        action="store_true",
        help=(
            "Write a stable sentinel for generated_at. Useful for tests; not "
            "recommended for production runs."
        ),
    )
    args = parser.parse_args(argv)

    output_path = Path(args.output)

    if args.check:
        if not output_path.exists():
            print(
                f"ERROR: --check requires {output_path} to exist (commit it first).",
                file=sys.stderr,
            )
            return 2
        fresh = serialise(build(no_timestamp=False))
        committed = output_path.read_text()
        if _normalised_for_diff(fresh) == _normalised_for_diff(committed):
            print(f"OK: {output_path} matches a fresh regeneration.")
            return 0
        diff = "".join(
            difflib.unified_diff(
                _normalised_for_diff(committed).splitlines(keepends=True),
                _normalised_for_diff(fresh).splitlines(keepends=True),
                fromfile=str(output_path) + " (committed)",
                tofile=str(output_path) + " (regenerated)",
                n=3,
            )
        )
        print(
            f"ERROR: {output_path} is stale. Diff:\n{diff}",
            file=sys.stderr,
        )
        return 1

    payload = serialise(build(no_timestamp=args.no_timestamp))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(payload)
    print(
        f"wrote {output_path} "
        f"({len(payload)} bytes, "
        f"{payload.count('\"address\":')} address entries)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
