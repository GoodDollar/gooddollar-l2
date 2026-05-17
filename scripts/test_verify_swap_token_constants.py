#!/usr/bin/env python3
"""Tests for ``scripts/verify_swap_token_constants.py``.

These exercise the pure parser / resolver / driver helpers in
isolation — no RPC calls, no network — so they are safe to run in CI
even when no chain is up.

Run with: python3 scripts/test_verify_swap_token_constants.py
"""

from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
SCRIPT = HERE / "verify_swap_token_constants.py"

_spec = importlib.util.spec_from_file_location("verify_swap_token_constants", SCRIPT)
assert _spec and _spec.loader, "could not build module spec for verify_swap_token_constants.py"
verify = importlib.util.module_from_spec(_spec)
sys.modules["verify_swap_token_constants"] = verify
_spec.loader.exec_module(verify)


# Canonical fixture — matches op-stack/addresses.json shape.
CANONICAL = {
    "GoodDollarToken": "0x8f86403a4de0bb5791fa46b8e795c547942fe4cf",
    "MockWETH": "0xcd8a1c3ba11cf5ecfa6267617243239504a98d90",
    "MockUSDC": "0xb7278a61aa25c888815afc32ad3cc52ff24fe575",
}


# Stale literals that historically sat in devnet.ts (no code on-chain).
STALE = {
    "SwapGD": "0x547382c0d1b23f707918d3c83a77317b71aa8470",
    "SwapWETH": "0x7c8baafa542c57ff9b2b90612bf8ab9e86e22c09",
    "SwapUSDC": "0x0a17fabea4633ce714f1fa4a2dca62c3bac4758d",
}


# Pool addresses currently in devnet.ts.
POOLS = {
    "SwapPoolGdWeth": "0xd6096fbed8bcc461d06b0c468c8b1cf7d45dc92d",
    "SwapPoolGdUsdc": "0x0ad6371dd7e9923d9968d63eb8b9858c700abd9d",
    "SwapPoolWethUsdc": "0xaa5c5496e2586f81d8d2d0b970eb85ab088639c2",
}


def _make_devnet_text(
    swap_gd: str,
    swap_weth: str,
    swap_usdc: str,
    *,
    canonical_aliased: tuple[str, ...] = (),
) -> str:
    """Build a minimal devnet.ts fixture containing the relevant constants."""
    lines = ["import rawAddresses from '../../../op-stack/addresses.json'"]
    lines.append("export const CONTRACTS = {")
    for name, addr in POOLS.items():
        lines.append(f"  {name}: '{addr}' as `0x${{string}}`,")

    def emit(name: str, value: str) -> str:
        if name in canonical_aliased:
            # Aliased shape: SwapGD: rawAddresses.contracts.GoodDollarToken as ...
            return f"  {name}: rawAddresses.contracts.{value} as `0x${{string}}`,"
        return f"  {name}: '{value}' as `0x${{string}}`,"

    lines.append(emit("SwapGD", swap_gd))
    lines.append(emit("SwapWETH", swap_weth))
    lines.append(emit("SwapUSDC", swap_usdc))
    lines.append("} as const")
    return "\n".join(lines) + "\n"


class ParseDevnetConstantTests(unittest.TestCase):
    def test_alias_form_resolves_to_canonical(self) -> None:
        text = _make_devnet_text(
            "GoodDollarToken",
            "MockWETH",
            "MockUSDC",
            canonical_aliased=("SwapGD", "SwapWETH", "SwapUSDC"),
        )
        for name, canonical in (
            ("SwapGD", "GoodDollarToken"),
            ("SwapWETH", "MockWETH"),
            ("SwapUSDC", "MockUSDC"),
        ):
            res = verify.parse_devnet_constant(text, name)
            self.assertEqual(res.via_canonical, canonical)
            self.assertIsNone(res.literal_address)
            resolved = verify.resolve_token_address(res, CANONICAL)
            self.assertEqual(resolved, CANONICAL[canonical])

    def test_literal_form_returns_lowercase_hex(self) -> None:
        text = _make_devnet_text(
            STALE["SwapGD"], STALE["SwapWETH"], STALE["SwapUSDC"]
        )
        res = verify.parse_devnet_constant(text, "SwapGD")
        self.assertIsNone(res.via_canonical)
        self.assertEqual(res.literal_address, STALE["SwapGD"])
        resolved = verify.resolve_token_address(res, CANONICAL)
        self.assertEqual(resolved, STALE["SwapGD"])

    def test_missing_name_raises(self) -> None:
        text = "export const CONTRACTS = { Foo: '0x' + 'a' * 40 }"
        with self.assertRaises(ValueError):
            verify.parse_devnet_constant(text, "SwapGD")

    def test_alias_referencing_unknown_canonical_raises(self) -> None:
        text = (
            "export const CONTRACTS = {\n"
            "  SwapGD: rawAddresses.contracts.NotARealName as `0x${string}`,\n"
            "} as const"
        )
        res = verify.parse_devnet_constant(text, "SwapGD")
        with self.assertRaises(ValueError):
            verify.resolve_token_address(res, CANONICAL)


class ParsePoolAddressesTests(unittest.TestCase):
    def test_extracts_three_pools(self) -> None:
        text = _make_devnet_text(
            STALE["SwapGD"], STALE["SwapWETH"], STALE["SwapUSDC"]
        )
        pools = verify.parse_pool_addresses(text)
        self.assertEqual(pools, POOLS)

    def test_missing_pool_raises(self) -> None:
        # Drop SwapPoolGdWeth from a generated fixture.
        text = _make_devnet_text(
            STALE["SwapGD"], STALE["SwapWETH"], STALE["SwapUSDC"]
        ).replace(
            f"SwapPoolGdWeth: '{POOLS['SwapPoolGdWeth']}'",
            "// SwapPoolGdWeth removed for test",
        )
        with self.assertRaises(ValueError):
            verify.parse_pool_addresses(text)


class RunChecksOfflineTests(unittest.TestCase):
    """Drive ``run_checks`` end-to-end with --skip-onchain so we never touch RPC."""

    def _write_inputs(self, addresses: dict[str, str], devnet_text: str) -> tuple[Path, Path]:
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        root = Path(tmp.name)
        addr = root / "addresses.json"
        addr.write_text(
            json.dumps(
                {
                    "chain_id": 42069,
                    "rpc_url": "https://rpc.example.local",
                    "explorer_url": "https://explorer.example.local",
                    "contracts": addresses,
                },
                indent=2,
            )
        )
        dev = root / "devnet.ts"
        dev.write_text(devnet_text)
        return addr, dev

    def test_stale_literals_fail_offline(self) -> None:
        addr, dev = self._write_inputs(
            CANONICAL,
            _make_devnet_text(
                STALE["SwapGD"], STALE["SwapWETH"], STALE["SwapUSDC"]
            ),
        )
        code, report = verify.run_checks(
            rpc="http://invalid.local",
            addresses_json=addr,
            devnet_ts=dev,
            skip_onchain=True,
        )
        self.assertEqual(code, 1)
        for name in verify.SWAP_TOKEN_NAMES:
            self.assertIn(name, report["tokens"])
            self.assertFalse(report["tokens"][name]["matches_canonical"])
        # Pool addresses should still parse even when token check fails.
        self.assertEqual(set(report["pools"].keys()), set(verify.POOL_NAMES))
        # Errors should mention each stale token.
        joined = "\n".join(report["errors"])
        for name in verify.SWAP_TOKEN_NAMES:
            self.assertIn(name, joined)

    def test_canonical_aliases_pass_offline(self) -> None:
        addr, dev = self._write_inputs(
            CANONICAL,
            _make_devnet_text(
                "GoodDollarToken",
                "MockWETH",
                "MockUSDC",
                canonical_aliased=("SwapGD", "SwapWETH", "SwapUSDC"),
            ),
        )
        code, report = verify.run_checks(
            rpc="http://invalid.local",
            addresses_json=addr,
            devnet_ts=dev,
            skip_onchain=True,
        )
        self.assertEqual(code, 0, msg=f"unexpected errors: {report['errors']}")
        for name in verify.SWAP_TOKEN_NAMES:
            self.assertTrue(report["tokens"][name]["matches_canonical"])
        self.assertEqual(report["errors"], [])

    def test_missing_canonical_returns_two(self) -> None:
        # Drop GoodDollarToken from the canonical set.
        incomplete = {k: v for k, v in CANONICAL.items() if k != "GoodDollarToken"}
        addr, dev = self._write_inputs(
            incomplete,
            _make_devnet_text(
                STALE["SwapGD"], STALE["SwapWETH"], STALE["SwapUSDC"]
            ),
        )
        code, report = verify.run_checks(
            rpc="http://invalid.local",
            addresses_json=addr,
            devnet_ts=dev,
            skip_onchain=True,
        )
        self.assertEqual(code, 2)
        self.assertTrue(
            any("GoodDollarToken" in e for e in report["errors"]),
            report["errors"],
        )

    def test_missing_devnet_returns_two(self) -> None:
        addr, dev = self._write_inputs(
            CANONICAL,
            _make_devnet_text(
                STALE["SwapGD"], STALE["SwapWETH"], STALE["SwapUSDC"]
            ),
        )
        dev.unlink()
        code, report = verify.run_checks(
            rpc="http://invalid.local",
            addresses_json=addr,
            devnet_ts=dev,
            skip_onchain=True,
        )
        self.assertEqual(code, 2)


if __name__ == "__main__":
    unittest.main()
