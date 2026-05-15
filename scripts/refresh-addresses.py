#!/usr/bin/env python3
"""Regenerate .autobuilder/addresses.env from broadcast/ artifacts + on-chain bytecode.

Walks every broadcast/*.s.sol/<chain_id>/run-latest.json, keeps the most-recent
deployment per contract name (by run timestamp), verifies the address has
bytecode via eth_getCode, then writes a fresh addresses.env using the
contract->symbol map below.

Exits non-zero if a required symbol cannot be resolved to a live address.

Usage: python3 scripts/refresh-addresses.py [--rpc URL] [--chain-id N]
"""

from __future__ import annotations

import argparse
import datetime as _dt
import glob
import json
import sys
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

# contract name (as it appears in broadcast JSON) -> env-var symbol in addresses.env
SYMBOL_MAP: dict[str, str] = {
    "GoodDollarToken": "GDT",
    "ValidatorStaking": "UBI",  # legacy alias kept for backward compat with existing scripts
    "PerpEngine": "PERP",
    "MarginVault": "VAULT",
    "MarketFactory": "MF",
    "GoodLendPool": "LEND",
    "StabilityPool": "STABLE",
    "SyntheticAssetFactory": "STOCKS",
    "GoodSwapRouter": "SWAP",
    "gUSD": "GUSD",
    "UBIFeeSplitter": "FEE_SPLITTER",
    "UBIFeeHook": "FEE_HOOK",
    "MockWETH": "WETH",
    "MockUSDC": "USDC",
    "ConditionalTokens": "CONDITIONAL_TOKENS",
    "CollateralRegistry": "COLLATERAL_REGISTRY",
    "CollateralVault": "COLLATERAL_VAULT",
    "VaultManager": "VAULT_MANAGER",
    "PegStabilityModule": "PSM",
    "AgentRegistry": "AGENT_REGISTRY",
    "UBIClaimV2": "UBI_CLAIM",
    "GoodLendToken": "GTOKEN",
    "PerpPriceOracle": "PERP_ORACLE",
    "SwapPriceOracle": "SWAP_ORACLE",
    "FundingRate": "FUNDING_RATE",
    "UBIRevenueTracker": "UBI_REVENUE_TRACKER",
    "GoodDAO": "GOOD_DAO",
    "VoteEscrowedGD": "VE_GD",
    "VaultFactory": "VAULT_FACTORY",
    "LiFiBridgeAggregator": "LIFI",
}

# Symbols that MUST resolve for the integration tests to function.
REQUIRED = ["GDT", "UBI", "PERP", "VAULT", "MF", "LEND", "STABLE", "STOCKS",
            "SWAP", "GUSD", "FEE_SPLITTER"]

TESTER_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
TESTER_WALLET = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
DEPLOYER_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"


def rpc_call(rpc: str, method: str, params: list) -> dict:
    body = json.dumps({"jsonrpc": "2.0", "method": method, "params": params, "id": 1}).encode()
    req = urllib.request.Request(rpc, data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read())


def has_code(rpc: str, addr: str) -> bool:
    try:
        r = rpc_call(rpc, "eth_getCode", [addr, "latest"])
        code = r.get("result", "0x")
        return code not in ("0x", "0x0", "", None) and len(code) > 4
    except Exception:
        return False


def collect_latest(broadcast_root: Path, chain_id: int) -> dict[str, tuple[float, str, str]]:
    """Scan every run-latest.json for the given chain_id, keep most-recent per contractName."""
    out: dict[str, tuple[float, str, str]] = {}
    pattern = str(broadcast_root / "*.s.sol" / str(chain_id) / "run-latest.json")
    for fp in sorted(glob.glob(pattern)):
        try:
            d = json.loads(Path(fp).read_text())
        except Exception:
            continue
        ts = float(d.get("timestamp", 0) or 0)
        script_name = Path(fp).parent.parent.name
        for tx in d.get("transactions", []) or []:
            cn = tx.get("contractName")
            ca = tx.get("contractAddress")
            if not cn or not ca:
                continue
            prev = out.get(cn)
            if prev is None or prev[0] < ts:
                out[cn] = (ts, ca.lower(), script_name)
    return out


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--rpc", default="http://localhost:8545")
    p.add_argument("--chain-id", default="42069")
    p.add_argument("--out", default=str(REPO_ROOT / ".autobuilder" / "addresses.env"))
    args = p.parse_args()

    broadcast_root = REPO_ROOT / "broadcast"
    if not broadcast_root.is_dir():
        print(f"FATAL: no broadcast/ directory at {broadcast_root}", file=sys.stderr)
        return 2

    latest = collect_latest(broadcast_root, int(args.chain_id))
    print(f"[refresh-addresses] scanned {len(latest)} unique contractName entries", file=sys.stderr)

    resolved: dict[str, str] = {}  # symbol -> address
    sources: dict[str, str] = {}   # symbol -> script source

    for cn, sym in SYMBOL_MAP.items():
        if cn not in latest:
            continue
        _, addr, src = latest[cn]
        if has_code(args.rpc, addr):
            resolved[sym] = addr
            sources[sym] = src
        else:
            print(f"[refresh-addresses] WARN: {cn} ({sym}) at {addr} has no bytecode — skipping",
                  file=sys.stderr)

    missing = [s for s in REQUIRED if s not in resolved]
    if missing:
        print(f"[refresh-addresses] FATAL: required symbols not resolved: {missing}", file=sys.stderr)
        for s in missing:
            cn = next((k for k, v in SYMBOL_MAP.items() if v == s), s)
            if cn in latest:
                print(f"  {s} ({cn}): broadcast addr {latest[cn][1]} has no bytecode", file=sys.stderr)
            else:
                print(f"  {s} ({cn}): no broadcast artifact found", file=sys.stderr)
        return 1

    # Write addresses.env
    now = _dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    lines = [
        f"# regenerated by scripts/refresh-addresses.py at {now}",
        f"# chain_id={args.chain_id}  rpc={args.rpc}",
        "# DO NOT hand-edit — re-run the script after any redeploy.",
        "",
        f"RPC={args.rpc}",
        f"TESTER_KEY={TESTER_KEY}",
        f"TESTER_WALLET={TESTER_WALLET}",
        f"DEPLOYER_KEY={DEPLOYER_KEY}",
        "",
        "# --- Required (integration tests depend on these) ---",
    ]
    for sym in REQUIRED:
        lines.append(f"{sym}={resolved[sym]}  # {sources[sym]}")
    lines.append("")
    lines.append("# --- Auxiliary ---")
    for sym, addr in resolved.items():
        if sym in REQUIRED:
            continue
        lines.append(f"{sym}={addr}  # {sources.get(sym, '?')}")
    lines.append("")

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text("\n".join(lines))
    print(f"[refresh-addresses] wrote {len(resolved)} symbols to {out_path}", file=sys.stderr)
    print(f"[refresh-addresses] required symbols resolved: {REQUIRED}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
