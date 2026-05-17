#!/usr/bin/env python3
"""Verify GoodSwap token constants resolve to the canonical addresses and
match the on-chain pool state.

What it checks
==============

1. ``op-stack/addresses.json`` exposes canonical ``GoodDollarToken``,
   ``MockWETH``, ``MockUSDC``.
2. ``frontend/src/lib/devnet.ts`` declares ``SwapGD``, ``SwapWETH``,
   ``SwapUSDC`` as aliases to those canonical entries (either through
   ``rawAddresses.contracts.<NAME>`` references or as the exact same
   hex literal). Stale orphan addresses are rejected.
3. The same file declares pool addresses ``SwapPoolGdWeth``,
   ``SwapPoolGdUsdc``, ``SwapPoolWethUsdc``.
4. Each of the resolved swap-token addresses has non-empty bytecode on
   chain (``eth_getCode``).
5. Each pool address has non-empty bytecode on chain.
6. For each pool, ``tokenA()`` / ``tokenB()`` selectors (``0x0fc63d10`` /
   ``0x5f64b55b`` from ``IGoodPool``) return addresses that together
   cover every swap-token constant exactly twice across the three
   pools (i.e. the bipartite GD/WETH/USDC pool set is intact).

Inputs / overrides
==================

  --rpc URL          RPC endpoint (default: env ``SWAP_VERIFY_RPC`` or
                     ``https://rpc.goodclaw.org``)
  --addresses PATH   Override path to ``op-stack/addresses.json``
  --devnet PATH      Override path to ``frontend/src/lib/devnet.ts``
  --json             Emit machine-readable JSON report
  --skip-onchain     Skip every RPC call (useful for offline lint runs)

Exit codes
==========

  0  every assertion passes
  1  one or more assertions failed
  2  could not read inputs (missing addresses.json, missing devnet.ts,
     malformed JSON, …)
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

REPO_ROOT = Path(__file__).resolve().parent.parent

DEFAULT_ADDRESSES_JSON = REPO_ROOT / "op-stack" / "addresses.json"
DEFAULT_DEVNET_TS = REPO_ROOT / "frontend" / "src" / "lib" / "devnet.ts"
DEFAULT_RPC = os.environ.get("SWAP_VERIFY_RPC", "https://rpc.goodclaw.org")

# IGoodPool function selectors. Derived from
# src/swap/GoodSwapRouter.sol:
#   function tokenA() external view returns (address);  // 0x0fc63d10
#   function tokenB() external view returns (address);  // 0x5f64b55b
SELECTOR_TOKEN_A = "0x0fc63d10"
SELECTOR_TOKEN_B = "0x5f64b55b"

# Names we care about on both sides.
SWAP_TOKEN_NAMES = ("SwapGD", "SwapWETH", "SwapUSDC")
POOL_NAMES = ("SwapPoolGdWeth", "SwapPoolGdUsdc", "SwapPoolWethUsdc")

# Canonical-name mapping for each swap-token alias.
TOKEN_CANONICAL_NAME = {
    "SwapGD": "GoodDollarToken",
    "SwapWETH": "MockWETH",
    "SwapUSDC": "MockUSDC",
}

# ────────────────────────────────────────────────────────────────────────
#  Parser — devnet.ts → {SwapGD, SwapWETH, SwapUSDC, SwapPool*}
# ────────────────────────────────────────────────────────────────────────

# Match either:
#   SwapGD: rawAddresses.contracts.GoodDollarToken as ...
# or:
#   SwapGD: '0x547382C0...' as ...
#
# Note: built with str.replace() rather than str.format() to avoid clashing
# with the literal ``${string}`` substring in the TypeScript type annotation
# we want to match (`0x${string}`).
ALIAS_RE_TEMPLATE = (
    r"^\s*__NAME__\s*:\s*"
    r"rawAddresses\.contracts\.(?P<canonical>[A-Za-z_][A-Za-z0-9_]*)"
    r"\s+as\s+`?0x\$\{string\}`?"
)
LITERAL_RE_TEMPLATE = (
    r"^\s*__NAME__\s*:\s*['\"](?P<addr>0x[0-9a-fA-F]{40})['\"]"
    r"\s+as\s+`?0x\$\{string\}`?"
)


@dataclass
class TokenResolution:
    """How a `Swap*` constant was declared in devnet.ts."""

    source_line: int
    via_canonical: Optional[str]  # canonical name in addresses.json, or None
    literal_address: Optional[str]  # raw hex literal, or None
    raw_line: str


def parse_devnet_constant(text: str, name: str) -> TokenResolution:
    """Locate ``<name>: …`` in ``devnet.ts`` and classify the binding."""
    alias_re = re.compile(ALIAS_RE_TEMPLATE.replace("__NAME__", re.escape(name)))
    literal_re = re.compile(LITERAL_RE_TEMPLATE.replace("__NAME__", re.escape(name)))
    for lineno, raw_line in enumerate(text.splitlines(), start=1):
        m = alias_re.match(raw_line)
        if m:
            return TokenResolution(
                source_line=lineno,
                via_canonical=m.group("canonical"),
                literal_address=None,
                raw_line=raw_line,
            )
        m = literal_re.match(raw_line)
        if m:
            return TokenResolution(
                source_line=lineno,
                via_canonical=None,
                literal_address=m.group("addr").lower(),
                raw_line=raw_line,
            )
    raise ValueError(
        f"could not find binding for `{name}` in devnet.ts "
        f"(expected `{name}: …`)"
    )


def resolve_token_address(
    resolution: TokenResolution, canonical: dict[str, str]
) -> str:
    """Resolve a `Swap*` binding to a 0x-prefixed lower-case address."""
    if resolution.via_canonical is not None:
        addr = canonical.get(resolution.via_canonical)
        if addr is None:
            raise ValueError(
                f"binding references rawAddresses.contracts.{resolution.via_canonical} "
                f"but that key is absent from addresses.json"
            )
        return addr.lower()
    if resolution.literal_address is not None:
        return resolution.literal_address.lower()
    raise ValueError("token resolution has neither canonical nor literal source")


def parse_pool_addresses(text: str) -> dict[str, str]:
    """Extract ``SwapPool* : '0x…'`` hex literals from devnet.ts."""
    out: dict[str, str] = {}
    for name in POOL_NAMES:
        regex = re.compile(
            r"^\s*" + re.escape(name) + r"\s*:\s*"
            r"['\"](?P<addr>0x[0-9a-fA-F]{40})['\"]"
        )
        for line in text.splitlines():
            m = regex.match(line)
            if m:
                out[name] = m.group("addr").lower()
                break
        if name not in out:
            raise ValueError(
                f"could not find pool address binding for `{name}` in devnet.ts"
            )
    return out


# ────────────────────────────────────────────────────────────────────────
#  RPC layer — eth_getCode / eth_call
# ────────────────────────────────────────────────────────────────────────


def rpc_call(url: str, method: str, params: list, timeout: float = 8.0) -> dict:
    payload = json.dumps(
        {"jsonrpc": "2.0", "id": 1, "method": method, "params": params}
    ).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def eth_get_code(url: str, addr: str) -> str:
    """Return hex bytecode at ``addr`` (lowercase, no 0x trim)."""
    body = rpc_call(url, "eth_getCode", [addr, "latest"])
    if "error" in body:
        raise RuntimeError(f"eth_getCode RPC error for {addr}: {body['error']}")
    code = body.get("result", "0x")
    return code if isinstance(code, str) else "0x"


def eth_call_address(url: str, to: str, selector: str) -> str:
    """Call a 0-arg view returning ``address`` and return the 20-byte
    address (lower-case, 0x-prefixed)."""
    body = rpc_call(
        url,
        "eth_call",
        [{"to": to, "data": selector}, "latest"],
    )
    if "error" in body:
        raise RuntimeError(
            f"eth_call({selector}) RPC error for {to}: {body['error']}"
        )
    raw = body.get("result", "0x")
    if not isinstance(raw, str) or not raw.startswith("0x") or len(raw) < 66:
        raise RuntimeError(
            f"eth_call({selector}) returned malformed result for {to}: {raw!r}"
        )
    last20 = raw[-40:]
    return "0x" + last20.lower()


# ────────────────────────────────────────────────────────────────────────
#  Driver
# ────────────────────────────────────────────────────────────────────────


def load_canonical(addresses_json: Path) -> dict[str, str]:
    data = json.loads(addresses_json.read_text())
    contracts = data.get("contracts") or {}
    if not isinstance(contracts, dict):
        raise ValueError(
            f"{addresses_json}: top-level 'contracts' must be an object"
        )
    return {k: str(v).lower() for k, v in contracts.items() if isinstance(v, str)}


def run_checks(
    rpc: str,
    addresses_json: Path,
    devnet_ts: Path,
    skip_onchain: bool,
) -> tuple[int, dict]:
    """Return (exit_code, report). Exit code is 0 / 1 / 2."""
    report: dict = {
        "rpc": rpc,
        "addresses_json": str(addresses_json),
        "devnet_ts": str(devnet_ts),
        "skip_onchain": skip_onchain,
        "errors": [],
        "tokens": {},
        "pools": {},
    }

    # ── Inputs ──────────────────────────────────────────────────────────
    if not addresses_json.exists():
        report["errors"].append(f"missing addresses.json: {addresses_json}")
        return 2, report
    if not devnet_ts.exists():
        report["errors"].append(f"missing devnet.ts: {devnet_ts}")
        return 2, report

    try:
        canonical = load_canonical(addresses_json)
    except Exception as exc:  # noqa: BLE001
        report["errors"].append(f"failed to parse addresses.json: {exc}")
        return 2, report

    for required in ("GoodDollarToken", "MockWETH", "MockUSDC"):
        if required not in canonical:
            report["errors"].append(
                f"addresses.json is missing canonical contract `{required}`"
            )
    if report["errors"]:
        return 2, report

    devnet_text = devnet_ts.read_text()

    # ── Parse Swap* token bindings ──────────────────────────────────────
    resolutions: dict[str, TokenResolution] = {}
    resolved_addr: dict[str, str] = {}
    for name in SWAP_TOKEN_NAMES:
        try:
            resolutions[name] = parse_devnet_constant(devnet_text, name)
            resolved_addr[name] = resolve_token_address(
                resolutions[name], canonical
            )
        except Exception as exc:  # noqa: BLE001
            report["errors"].append(str(exc))
            report["tokens"][name] = {"status": "parse_error", "detail": str(exc)}
            continue

        canonical_expected = canonical[TOKEN_CANONICAL_NAME[name]]
        is_canonical = resolved_addr[name] == canonical_expected
        entry = {
            "source_line": resolutions[name].source_line,
            "via_canonical": resolutions[name].via_canonical,
            "literal_address": resolutions[name].literal_address,
            "resolved_address": resolved_addr[name],
            "canonical_name": TOKEN_CANONICAL_NAME[name],
            "canonical_address": canonical_expected,
            "matches_canonical": is_canonical,
        }
        report["tokens"][name] = entry
        if not is_canonical:
            report["errors"].append(
                f"{name} resolves to {resolved_addr[name]} but canonical "
                f"{TOKEN_CANONICAL_NAME[name]} is {canonical_expected}"
            )

    # ── Parse pool addresses ────────────────────────────────────────────
    try:
        pool_addrs = parse_pool_addresses(devnet_text)
    except Exception as exc:  # noqa: BLE001
        report["errors"].append(str(exc))
        return (1, report) if not report["errors"] else (1, report)

    for name, addr in pool_addrs.items():
        report["pools"][name] = {"address": addr}

    if report["errors"]:
        # If we've already failed the alias check, on-chain checks add noise
        # but no signal. Bail out cleanly.
        return 1, report

    # ── On-chain checks ─────────────────────────────────────────────────
    if skip_onchain:
        report["onchain_skipped"] = True
        return (1 if report["errors"] else 0, report)

    try:
        # 1. Bytecode at each swap-token must be non-empty.
        for name in SWAP_TOKEN_NAMES:
            addr = resolved_addr[name]
            code = eth_get_code(rpc, addr)
            report["tokens"][name]["bytecode_len"] = (
                (len(code) - 2) // 2 if code.startswith("0x") else 0
            )
            if code in ("0x", "0x0", "", None) or len(code) <= 4:
                report["errors"].append(
                    f"{name} ({addr}) has no/short bytecode on {rpc}: {code!r}"
                )

        # 2. Bytecode at each pool must be non-empty.
        for name, addr in pool_addrs.items():
            code = eth_get_code(rpc, addr)
            report["pools"][name]["bytecode_len"] = (
                (len(code) - 2) // 2 if code.startswith("0x") else 0
            )
            if code in ("0x", "0x0", "", None) or len(code) <= 4:
                report["errors"].append(
                    f"{name} ({addr}) has no/short bytecode on {rpc}: {code!r}"
                )

        # 3. tokenA / tokenB across all pools must cover every swap-token
        #    constant exactly twice.
        swap_to_name = {v: k for k, v in resolved_addr.items()}
        observed: list[str] = []
        for pool_name, pool_addr in pool_addrs.items():
            try:
                a = eth_call_address(rpc, pool_addr, SELECTOR_TOKEN_A)
                b = eth_call_address(rpc, pool_addr, SELECTOR_TOKEN_B)
            except RuntimeError as exc:
                report["errors"].append(
                    f"{pool_name}: failed to read tokenA/tokenB — {exc}"
                )
                continue
            report["pools"][pool_name]["tokenA"] = a
            report["pools"][pool_name]["tokenB"] = b
            for side, val in (("A", a), ("B", b)):
                mapped = swap_to_name.get(val)
                report["pools"][pool_name].setdefault("mapping", {})[side] = mapped
                if mapped is None:
                    report["errors"].append(
                        f"{pool_name}.token{side} = {val} does not match any "
                        f"of SwapGD/SwapWETH/SwapUSDC ({sorted(resolved_addr.values())})"
                    )
                else:
                    observed.append(mapped)

        # Each Swap* must appear exactly twice across the three pools.
        if not report["errors"]:
            counts = {name: observed.count(name) for name in SWAP_TOKEN_NAMES}
            report["pool_token_counts"] = counts
            for name, count in counts.items():
                if count != 2:
                    report["errors"].append(
                        f"pool coverage check: {name} appears {count} time(s) "
                        f"across {POOL_NAMES} (expected 2)"
                    )

    except urllib.error.URLError as exc:
        report["errors"].append(f"RPC unreachable ({rpc}): {exc}")
    except Exception as exc:  # noqa: BLE001
        report["errors"].append(f"on-chain check crashed: {exc}")

    return (1 if report["errors"] else 0), report


def _emit_human(report: dict) -> None:
    print(f"RPC:           {report['rpc']}")
    print(f"addresses.json: {report['addresses_json']}")
    print(f"devnet.ts:     {report['devnet_ts']}")
    print()
    print("Tokens:")
    for name in SWAP_TOKEN_NAMES:
        entry = report["tokens"].get(name, {})
        if not entry:
            print(f"  - {name}: <unparsed>")
            continue
        tag = "OK " if entry.get("matches_canonical") else "BAD"
        via = entry.get("via_canonical") or "literal"
        print(
            f"  [{tag}] {name:7s} @ line {entry.get('source_line'):>3} "
            f"via {via:>20} → {entry.get('resolved_address')} "
            f"(canonical {entry.get('canonical_name')} = {entry.get('canonical_address')})"
            + (
                f"  code={entry.get('bytecode_len')}B"
                if "bytecode_len" in entry
                else ""
            )
        )
    print()
    print("Pools:")
    for name in POOL_NAMES:
        entry = report["pools"].get(name, {})
        if not entry:
            print(f"  - {name}: <unparsed>")
            continue
        bits = [f"{name}: {entry.get('address')}"]
        if "bytecode_len" in entry:
            bits.append(f"code={entry['bytecode_len']}B")
        if "tokenA" in entry:
            mapping = entry.get("mapping", {})
            bits.append(
                f"tokenA={entry['tokenA']}({mapping.get('A','?')})"
            )
            bits.append(
                f"tokenB={entry['tokenB']}({mapping.get('B','?')})"
            )
        print("  - " + "  ".join(bits))
    if "pool_token_counts" in report:
        print()
        print(f"Pool token counts (expect 2 each): {report['pool_token_counts']}")
    if report["errors"]:
        print()
        print(f"FAIL — {len(report['errors'])} error(s):", file=sys.stderr)
        for err in report["errors"]:
            print(f"  - {err}", file=sys.stderr)
    else:
        print()
        print("OK — every swap-token constant is canonical and consistent with on-chain pool state.")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--rpc", default=DEFAULT_RPC, help=f"RPC URL (default: {DEFAULT_RPC})")
    ap.add_argument(
        "--addresses",
        default=str(DEFAULT_ADDRESSES_JSON),
        help=f"Path to addresses.json (default: {DEFAULT_ADDRESSES_JSON})",
    )
    ap.add_argument(
        "--devnet",
        default=str(DEFAULT_DEVNET_TS),
        help=f"Path to devnet.ts (default: {DEFAULT_DEVNET_TS})",
    )
    ap.add_argument("--json", action="store_true", help="Emit JSON report")
    ap.add_argument(
        "--skip-onchain",
        action="store_true",
        help="Skip RPC calls (useful when offline or in pre-deploy lint runs)",
    )
    args = ap.parse_args()

    code, report = run_checks(
        rpc=args.rpc,
        addresses_json=Path(args.addresses),
        devnet_ts=Path(args.devnet),
        skip_onchain=args.skip_onchain,
    )
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        _emit_human(report)
    return code


if __name__ == "__main__":
    sys.exit(main())
