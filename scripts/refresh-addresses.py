#!/usr/bin/env python3
"""Regenerate .autobuilder/addresses.env AND op-stack/addresses.json from
broadcast/ artifacts + on-chain bytecode.

Walks every broadcast/*.s.sol/<chain_id>/run-latest.json, keeps the most-recent
deployment per contract name (by run timestamp), verifies the address has
bytecode via eth_getCode, then writes:

  1. `.autobuilder/addresses.env` — the canonical env-var truth used by
     deploy/test scripts.
  2. `op-stack/addresses.json` — the frontend's view of the same data
     (`frontend/src/lib/devnet.ts` imports this file via Next's JSON loader).

Both files are derived from the same SYMBOL_MAP so they cannot drift.

Special case — derived getters: some contracts are deployed as CREATE-children
of another contract and therefore never appear as top-level `contractName`
rows in any broadcast file. We read those back off-chain via a getter on the
parent. Today the only such pair is:

  ConditionalTokens ← MarketFactory.tokens()

See `derive_conditional_tokens_from_market_factory` for the implementation
and `scripts/test_refresh_addresses.py` for the contract.

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


# 4-byte selector for `tokens()` on MarketFactory. Verified with
# `cast sig "tokens()"` → 0x9d63848a. MarketFactory deploys its
# own ConditionalTokens in its constructor, so the CT address is
# never emitted as a top-level row in any Foundry broadcast file
# — we have to read it back off-chain via this getter.
_TOKENS_SELECTOR = "0x9d63848a"


def derive_conditional_tokens_from_market_factory(rpc: str, mf_addr: str) -> str | None:
    """Read `MarketFactory.tokens()` off-chain and return the ConditionalTokens address.

    Returns ``None`` (never raises) when:
      * the RPC call fails or times out
      * the JSON-RPC response is an error (e.g. execution reverted)
      * the returned word is malformed (not 32 bytes)
      * the returned address is the zero address
      * the returned address has no bytecode on the chain

    On success returns a checksum-less, lowercased ``0x...`` address string.

    This is intentionally narrowly scoped to ConditionalTokens. There is
    exactly one such derived-getter relationship in the codebase today;
    generalising the mechanism would obscure rather than clarify.
    """
    try:
        r = rpc_call(rpc, "eth_call", [{"to": mf_addr, "data": _TOKENS_SELECTOR}, "latest"])
    except Exception:
        return None
    if not isinstance(r, dict) or "error" in r:
        return None
    result = r.get("result")
    if not isinstance(result, str):
        return None
    hexpart = result.removeprefix("0x")
    if len(hexpart) != 64:
        # Address-returning calls always pad to a single 32-byte word.
        return None
    # ABI-encoded address: rightmost 20 bytes (40 hex chars) of the word.
    derived = "0x" + hexpart[-40:].lower()
    if int(derived, 16) == 0:
        return None
    if not has_code(rpc, derived):
        return None
    return derived


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

    # Derived getter: MarketFactory deploys its own ConditionalTokens in its
    # constructor (src/predict/MarketFactory.sol), so the CT address never
    # appears as a top-level row in any Foundry broadcast file. Read it back
    # off-chain via `MarketFactory.tokens()` whenever MF is live and CT is
    # either unresolved or pointing at a dead address.
    if "MF" in resolved and "CONDITIONAL_TOKENS" not in resolved:
        derived = derive_conditional_tokens_from_market_factory(args.rpc, resolved["MF"])
        if derived:
            resolved["CONDITIONAL_TOKENS"] = derived
            sources["CONDITIONAL_TOKENS"] = "derived: MarketFactory.tokens()"
            print(
                f"[refresh-addresses] derived CONDITIONAL_TOKENS={derived} "
                f"from MarketFactory.tokens()",
                file=sys.stderr,
            )

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
    # NOTE on format: source provenance lives on the line *before* each
    # KEY=VALUE pair, never on the same line. PM2's dotenv parser (and many
    # others) does not strip inline `# ...` comments — it would pass the
    # comment through as part of the value, silently corrupting addresses
    # for every consumer. Keep the human-readable provenance, just on its
    # own line.
    for sym in REQUIRED:
        lines.append(f"# source: {sources[sym]}")
        lines.append(f"{sym}={resolved[sym]}")
    lines.append("")
    lines.append("# --- Auxiliary ---")
    for sym, addr in resolved.items():
        if sym in REQUIRED:
            continue
        lines.append(f"# source: {sources.get(sym, '?')}")
        lines.append(f"{sym}={addr}")
    lines.append("")

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text("\n".join(lines))
    print(f"[refresh-addresses] wrote {len(resolved)} symbols to {out_path}", file=sys.stderr)
    print(f"[refresh-addresses] required symbols resolved: {REQUIRED}", file=sys.stderr)

    # ── Mirror the same data into op-stack/addresses.json so the frontend's
    #    `rawAddresses.contracts.*` view stays in sync with addresses.env.
    json_path = REPO_ROOT / "op-stack" / "addresses.json"
    rc = update_op_stack_addresses(json_path, resolved, args.rpc, int(args.chain_id), now)
    if rc != 0:
        return rc
    return 0


# Reverse map: env-var symbol -> contract name as it appears in
# op-stack/addresses.json (== same key as in SYMBOL_MAP). Built once at module
# load. Only symbols in SYMBOL_MAP are mirrored into the JSON; addresses.env-
# only entries (e.g. POOL_*, STABLE_WETH, G_GDT) are intentionally excluded.
_SYMBOL_TO_CONTRACT_NAME: dict[str, str] = {sym: cn for cn, sym in SYMBOL_MAP.items()}


def update_op_stack_addresses(
    json_path: Path,
    resolved: dict[str, str],
    rpc: str,
    chain_id: int,
    now: str,
) -> int:
    """Sync resolved addresses into op-stack/addresses.json.

    Rules:
      * Existing keys in `contracts` are overwritten when we have a fresh
        resolved value for them.
      * Keys present in the JSON but absent from SYMBOL_MAP / resolved (e.g.
        `FastWithdrawalLP`, `CollateralVault_WRONG_GDT`, `OptimisticResolver`)
        are preserved verbatim.
      * Resolved symbols that map to a contract name not yet in the JSON are
        added (so e.g. `UBIRevenueTracker`, `CollateralRegistry`,
        `UBIClaimV2` get a JSON entry once they exist on-chain).
      * Top-level metadata (`chain_id`, `chain_name`, `rpc_url`,
        `explorer_url`, `admin`, `sequencer`, `batcher`, `proposer`) is
        preserved.
      * The `_comment` is rewritten with the new sync timestamp + source.
      * Output is idempotent: a second run against the same chain produces
        a byte-identical file.
    """
    if not json_path.exists():
        print(
            f"[refresh-addresses] WARN: {json_path} missing — skipping JSON sync",
            file=sys.stderr,
        )
        return 0

    try:
        data = json.loads(json_path.read_text())
    except Exception as exc:
        print(f"[refresh-addresses] FATAL: cannot parse {json_path}: {exc}", file=sys.stderr)
        return 3

    contracts = data.get("contracts")
    if not isinstance(contracts, dict):
        print(
            f"[refresh-addresses] FATAL: {json_path} has no `contracts` object",
            file=sys.stderr,
        )
        return 3

    # 1. Overwrite existing keys for which we have a fresh resolution.
    overwritten = 0
    added = 0
    for sym, addr in resolved.items():
        cn = _SYMBOL_TO_CONTRACT_NAME.get(sym)
        if not cn:
            continue
        # Use checksummed-style comparison via lowercase to detect changes.
        prev = contracts.get(cn)
        if prev is None:
            contracts[cn] = addr
            added += 1
        elif (prev or "").lower() != addr.lower():
            contracts[cn] = addr
            overwritten += 1
        else:
            # already matches — leave the existing casing untouched so the
            # file stays byte-identical run-to-run.
            pass

    # 2. Refresh metadata. Preserve user-set values for chain_name, rpc_url,
    #    explorer_url, etc. Only refresh `_comment` when something actually
    #    changed — otherwise the file would diff on every run purely due to
    #    the embedded timestamp, which is hostile to git history.
    if added or overwritten:
        data["_comment"] = (
            f"GoodDollar L2 contract addresses — synced {now} from "
            f"scripts/refresh-addresses.py (chain_id={chain_id}, rpc={rpc}). "
            f"DO NOT hand-edit; re-run the script after every redeploy."
        )
    data["chain_id"] = data.get("chain_id", chain_id)
    data["contracts"] = contracts

    # Preserve insertion order; keep the original `_comment` -> top-level keys
    # ordering. Output with 4-space indent + trailing newline so the file
    # matches existing style and stays diff-friendly.
    text = json.dumps(data, indent=4, ensure_ascii=True) + "\n"
    json_path.write_text(text)

    print(
        f"[refresh-addresses] op-stack/addresses.json: "
        f"{added} added, {overwritten} updated, "
        f"{len(contracts)} total contract keys",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
