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

Usage:
  python3 scripts/refresh-addresses.py [--rpc URL] [--chain-id N]   # write mode (default)
  python3 scripts/refresh-addresses.py --check                       # diff guard, no writes

In ``--check`` mode the script computes what the canonical files
SHOULD contain and compares them against the on-disk versions. If
either differs from the freshly-computed expected output, the script
prints a unified diff and exits 1 — letting CI block stale registry
state. The timestamp comment lines are normalised before comparison
so that a clean run is a no-op even when the wall clock has moved.
"""

from __future__ import annotations

import argparse
import datetime as _dt
import difflib
import glob
import json
import re
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
    "PriceOracle": "PRICE_ORACLE_ADDRESS",
    "StockOracleV2": "STOCK_ORACLE_V2",
    "StockOracleV2Adapter": "STOCK_ORACLE_V2_ADAPTER",
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


def serialize_addresses_env(
    resolved: dict[str, str],
    sources: dict[str, str],
    rpc: str,
    chain_id: str,
    now: str,
) -> str:
    """Return the canonical text for ``.autobuilder/addresses.env``.

    Pure: no I/O. The first three lines (timestamp + chain/rpc + DO NOT
    edit banner) are diff-normalised by ``_normalize_env_for_diff`` so
    ``--check`` is stable across wall-clock changes.
    """
    lines = [
        f"# regenerated by scripts/refresh-addresses.py at {now}",
        f"# chain_id={chain_id}  rpc={rpc}",
        "# DO NOT hand-edit — re-run the script after any redeploy.",
        "",
        f"RPC={rpc}",
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

    # Add STABLE_WETH alias for integration tests (should match WETH)
    if "WETH" in resolved:
        lines.append("# source: alias for WETH (integration test compatibility)")
        lines.append(f"STABLE_WETH={resolved['WETH']}")

    lines.append("")
    return "\n".join(lines)


# ──────────────────────────────────────────────────────────────────────
# Diff-normalisers — strip volatile bits (timestamps) so a clean run
# diffs to nothing. ONLY the timestamp lines are normalised; every
# byte that affects a downstream consumer is preserved.
# ──────────────────────────────────────────────────────────────────────
_ENV_TIMESTAMP_RE = re.compile(
    r"^# regenerated by scripts/refresh-addresses\.py at .*$",
    re.MULTILINE,
)
_JSON_COMMENT_RE = re.compile(
    r'"_comment":\s*"GoodDollar L2 contract addresses — synced [^"]*"',
)


def _normalize_env_for_diff(text: str) -> str:
    return _ENV_TIMESTAMP_RE.sub(
        "# regenerated by scripts/refresh-addresses.py at <TS>", text
    )


def _normalize_json_for_diff(text: str) -> str:
    return _JSON_COMMENT_RE.sub(
        '"_comment": "GoodDollar L2 contract addresses — synced <TS>"', text
    )


def compute_resolved(
    rpc: str, chain_id: int, broadcast_root: Path
) -> tuple[dict[str, str], dict[str, str]] | None:
    """Scan broadcast/ + chain and return (resolved, sources).

    Returns ``None`` and prints a diagnostic on stderr when any
    REQUIRED symbol cannot be resolved.
    """
    if not broadcast_root.is_dir():
        print(f"FATAL: no broadcast/ directory at {broadcast_root}", file=sys.stderr)
        return None

    latest = collect_latest(broadcast_root, chain_id)
    print(
        f"[refresh-addresses] scanned {len(latest)} unique contractName entries",
        file=sys.stderr,
    )

    resolved: dict[str, str] = {}
    sources: dict[str, str] = {}

    for cn, sym in SYMBOL_MAP.items():
        if cn not in latest:
            continue
        _, addr, src = latest[cn]
        if has_code(rpc, addr):
            resolved[sym] = addr
            sources[sym] = src
        else:
            print(
                f"[refresh-addresses] WARN: {cn} ({sym}) at {addr} has no bytecode — skipping",
                file=sys.stderr,
            )

    # Derived getter: MarketFactory deploys its own ConditionalTokens in its
    # constructor (src/predict/MarketFactory.sol), so the CT address never
    # appears as a top-level row in any Foundry broadcast file. Read it back
    # off-chain via `MarketFactory.tokens()` whenever MF is live and CT is
    # either unresolved or pointing at a dead address.
    if "MF" in resolved and "CONDITIONAL_TOKENS" not in resolved:
        derived = derive_conditional_tokens_from_market_factory(rpc, resolved["MF"])
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
        print(
            f"[refresh-addresses] FATAL: required symbols not resolved: {missing}",
            file=sys.stderr,
        )
        for s in missing:
            cn = next((k for k, v in SYMBOL_MAP.items() if v == s), s)
            if cn in latest:
                print(
                    f"  {s} ({cn}): broadcast addr {latest[cn][1]} has no bytecode",
                    file=sys.stderr,
                )
            else:
                print(f"  {s} ({cn}): no broadcast artifact found", file=sys.stderr)
        return None

    return resolved, sources


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--rpc", default="http://localhost:8545")
    p.add_argument("--chain-id", default="42069")
    p.add_argument("--out", default=str(REPO_ROOT / ".autobuilder" / "addresses.env"))
    p.add_argument(
        "--check",
        action="store_true",
        help="Diff guard: compare canonical files to expected output without writing. "
        "Exit 1 (and print a unified diff) when on-disk state has drifted from "
        "broadcast+chain truth. Used by CI to enforce the registry freeze.",
    )
    args = p.parse_args()

    broadcast_root = REPO_ROOT / "broadcast"
    out = compute_resolved(args.rpc, int(args.chain_id), broadcast_root)
    if out is None:
        return 1
    resolved, sources = out

    now = _dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    expected_env = serialize_addresses_env(resolved, sources, args.rpc, args.chain_id, now)

    out_path = Path(args.out)
    json_path = REPO_ROOT / "op-stack" / "addresses.json"

    if args.check:
        rc = 0

        # ── Compare addresses.env
        if not out_path.exists():
            print(
                f"[refresh-addresses --check] FATAL: {out_path} does not exist",
                file=sys.stderr,
            )
            rc = 1
        else:
            actual_env = out_path.read_text()
            if _normalize_env_for_diff(actual_env) != _normalize_env_for_diff(expected_env):
                print(
                    f"[refresh-addresses --check] DRIFT in {out_path}:",
                    file=sys.stderr,
                )
                diff = difflib.unified_diff(
                    _normalize_env_for_diff(actual_env).splitlines(keepends=True),
                    _normalize_env_for_diff(expected_env).splitlines(keepends=True),
                    fromfile=f"{out_path} (on disk)",
                    tofile=f"{out_path} (expected from broadcast+chain)",
                )
                sys.stderr.writelines(diff)
                rc = 1

        # ── Compare op-stack/addresses.json (only the contracts/_comment we touch)
        expected_json, _added, _overwritten = serialize_op_stack_addresses(
            json_path, resolved, args.rpc, int(args.chain_id), now
        )
        if expected_json is None:
            # serialize_op_stack_addresses already printed the cause.
            rc = max(rc, 1)
        else:
            if not json_path.exists():
                print(
                    f"[refresh-addresses --check] FATAL: {json_path} does not exist",
                    file=sys.stderr,
                )
                rc = 1
            else:
                actual_json = json_path.read_text()
                if _normalize_json_for_diff(actual_json) != _normalize_json_for_diff(
                    expected_json
                ):
                    print(
                        f"[refresh-addresses --check] DRIFT in {json_path}:",
                        file=sys.stderr,
                    )
                    diff = difflib.unified_diff(
                        _normalize_json_for_diff(actual_json).splitlines(keepends=True),
                        _normalize_json_for_diff(expected_json).splitlines(keepends=True),
                        fromfile=f"{json_path} (on disk)",
                        tofile=f"{json_path} (expected from broadcast+chain)",
                    )
                    sys.stderr.writelines(diff)
                    rc = 1

        if rc == 0:
            print(
                "[refresh-addresses --check] OK — registry matches broadcast+chain truth",
                file=sys.stderr,
            )
        return rc

    # ── Write mode (default)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(expected_env)
    print(
        f"[refresh-addresses] wrote {len(resolved)} symbols to {out_path}",
        file=sys.stderr,
    )
    print(f"[refresh-addresses] required symbols resolved: {REQUIRED}", file=sys.stderr)

    # ── Mirror into op-stack/addresses.json
    rc = update_op_stack_addresses(json_path, resolved, args.rpc, int(args.chain_id), now)
    if rc != 0:
        return rc
    return 0


# Reverse map: env-var symbol -> contract name as it appears in
# op-stack/addresses.json (== same key as in SYMBOL_MAP). Built once at module
# load. Only symbols in SYMBOL_MAP are mirrored into the JSON; addresses.env-
# only entries (e.g. POOL_*, STABLE_WETH, G_GDT) are intentionally excluded.
_SYMBOL_TO_CONTRACT_NAME: dict[str, str] = {sym: cn for cn, sym in SYMBOL_MAP.items()}

# Backward-compatible JSON aliases whose historical keys differ from the
# broadcast contract name. ``DeployGoodStocks.s.sol`` emits ``PriceOracle``;
# existing backend/frontend consumers may still read ``StocksPriceOracle``.
_JSON_CONTRACT_ALIASES: dict[str, list[str]] = {
    "PriceOracle": ["StocksPriceOracle"],
}


def serialize_op_stack_addresses(
    json_path: Path,
    resolved: dict[str, str],
    rpc: str,
    chain_id: int,
    now: str,
) -> tuple[str | None, int, int]:
    """Compute the canonical text for ``op-stack/addresses.json`` without writing.

    Pure (modulo reading the existing file to preserve unrelated keys).
    Returns ``(text, added, overwritten)``. ``text`` is ``None`` when the
    file is missing or unparseable; in that case a diagnostic has already
    been printed to stderr.

    Rules:
      * Existing keys in ``contracts`` are overwritten when we have a
        fresh resolved value for them.
      * Keys present in the JSON but absent from SYMBOL_MAP / resolved
        (e.g. ``FastWithdrawalLP``) are preserved verbatim.
      * Resolved symbols that map to a contract name not yet in the JSON
        are added.
      * Top-level metadata (``chain_id``, ``chain_name``, ``rpc_url``,
        ``explorer_url``, ``admin``, ``sequencer``, ``batcher``,
        ``proposer``) is preserved.
      * ``_comment`` is rewritten with the new sync timestamp + source
        ONLY when at least one address was added or overwritten.
        Otherwise it is left untouched so a clean run is byte-identical.
    """
    if not json_path.exists():
        print(
            f"[refresh-addresses] WARN: {json_path} missing — skipping JSON sync",
            file=sys.stderr,
        )
        return None, 0, 0

    try:
        data = json.loads(json_path.read_text())
    except Exception as exc:
        print(
            f"[refresh-addresses] FATAL: cannot parse {json_path}: {exc}",
            file=sys.stderr,
        )
        return None, 0, 0

    contracts = data.get("contracts")
    if not isinstance(contracts, dict):
        print(
            f"[refresh-addresses] FATAL: {json_path} has no `contracts` object",
            file=sys.stderr,
        )
        return None, 0, 0

    overwritten = 0
    added = 0
    for sym, addr in resolved.items():
        cn = _SYMBOL_TO_CONTRACT_NAME.get(sym)
        if not cn:
            continue
        for json_key in [cn, *_JSON_CONTRACT_ALIASES.get(cn, [])]:
            prev = contracts.get(json_key)
            if prev is None:
                contracts[json_key] = addr
                added += 1
            elif (prev or "").lower() != addr.lower():
                contracts[json_key] = addr
                overwritten += 1
            # else: already matches — leave existing casing untouched so the
            # file stays byte-identical run-to-run.

    if added or overwritten:
        data["_comment"] = (
            f"GoodDollar L2 contract addresses — synced {now} from "
            f"scripts/refresh-addresses.py (chain_id={chain_id}, rpc={rpc}). "
            f"DO NOT hand-edit; re-run the script after every redeploy."
        )
    data["chain_id"] = data.get("chain_id", chain_id)
    data["contracts"] = contracts

    text = json.dumps(data, indent=4, ensure_ascii=True) + "\n"
    return text, added, overwritten


def update_op_stack_addresses(
    json_path: Path,
    resolved: dict[str, str],
    rpc: str,
    chain_id: int,
    now: str,
) -> int:
    """Sync resolved addresses into op-stack/addresses.json.

    Thin wrapper around :func:`serialize_op_stack_addresses` that performs
    the actual write. Returns 0 on success, 3 when the JSON file is
    missing or malformed (matching the pre-refactor exit codes).
    """
    text, added, overwritten = serialize_op_stack_addresses(
        json_path, resolved, rpc, chain_id, now
    )
    if text is None:
        # serialize_op_stack_addresses prints "WARN: ... missing — skipping
        # JSON sync" at the same location the legacy code did, and returned
        # 0 from there. Mirror that contract: missing-but-not-fatal for
        # write mode.
        return 0 if not json_path.exists() else 3

    json_path.write_text(text)
    print(
        f"[refresh-addresses] op-stack/addresses.json: "
        f"{added} added, {overwritten} updated, "
        f"{len(text.splitlines())} total lines written",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
