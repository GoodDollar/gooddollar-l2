#!/usr/bin/env python3
"""Tests for scripts/refresh-addresses.py.

Loads the script as a module (despite the hyphen in its filename) and
verifies the new `derive_conditional_tokens_from_market_factory` helper.

Run with: python3 scripts/test_refresh_addresses.py
"""

from __future__ import annotations

import importlib.util
import sys
import unittest
import urllib.error
from pathlib import Path

HERE = Path(__file__).resolve().parent
SCRIPT = HERE / "refresh-addresses.py"

# Load the hyphenated script as a module so we can call its helpers.
_spec = importlib.util.spec_from_file_location("refresh_addresses", SCRIPT)
assert _spec and _spec.loader, "could not build module spec for refresh-addresses.py"
refresh = importlib.util.module_from_spec(_spec)
sys.modules["refresh_addresses"] = refresh
_spec.loader.exec_module(refresh)


# Known canonical addresses on the live devnet (chain 42069) for the integration test.
LIVE_RPC = "http://localhost:8545"
LIVE_MARKET_FACTORY = "0xfaA7b3a4b5c3f54a934a2e33D34C7bC099f96CCE"
EXPECTED_CONDITIONAL_TOKENS = "0x9f29cdb0946868a4f9f99fb0e07f71fa598569c0"


def _padded_address(addr: str) -> str:
    """Encode an address as a left-padded 32-byte hex word (ABI-encoded `address`)."""
    return "0x" + addr.lower().removeprefix("0x").rjust(64, "0")


class DeriveConditionalTokensTests(unittest.TestCase):
    """Unit tests for derive_conditional_tokens_from_market_factory."""

    def setUp(self) -> None:
        # Snapshot originals so we can restore them.
        self._orig_rpc_call = refresh.rpc_call
        self._orig_has_code = refresh.has_code

    def tearDown(self) -> None:
        refresh.rpc_call = self._orig_rpc_call
        refresh.has_code = self._orig_has_code

    def test_returns_address_when_market_factory_call_succeeds_and_has_code(self) -> None:
        """Happy path: tokens() returns a non-zero address with bytecode → that address."""
        target = "0x9f29cdb0946868a4f9f99fb0e07f71fa598569c0"

        def fake_rpc_call(rpc, method, params):
            self.assertEqual(method, "eth_call")
            self.assertEqual(len(params), 2)
            call = params[0]
            self.assertEqual(call["to"].lower(), "0xabc0000000000000000000000000000000000001")
            # Selector for tokens() == 0x9d63848a
            self.assertTrue(call["data"].startswith("0x9d63848a"))
            return {"result": _padded_address(target)}

        refresh.rpc_call = fake_rpc_call
        refresh.has_code = lambda rpc, addr: True

        got = refresh.derive_conditional_tokens_from_market_factory(
            "http://example", "0xABC0000000000000000000000000000000000001"
        )
        self.assertIsNotNone(got)
        self.assertEqual(got.lower(), target)

    def test_returns_none_when_call_reverts(self) -> None:
        """tokens() reverts (error in JSON-RPC response) → None."""

        def fake_rpc_call(rpc, method, params):
            return {"error": {"code": 3, "message": "execution reverted", "data": "0x"}}

        refresh.rpc_call = fake_rpc_call
        refresh.has_code = lambda rpc, addr: True

        got = refresh.derive_conditional_tokens_from_market_factory(
            "http://example", "0xABC0000000000000000000000000000000000001"
        )
        self.assertIsNone(got)

    def test_returns_none_when_rpc_raises(self) -> None:
        """Network/transport error → None (do not crash refresh-addresses.py)."""

        def fake_rpc_call(rpc, method, params):
            raise urllib.error.URLError("connection refused")

        refresh.rpc_call = fake_rpc_call
        refresh.has_code = lambda rpc, addr: True

        got = refresh.derive_conditional_tokens_from_market_factory(
            "http://example", "0xABC0000000000000000000000000000000000001"
        )
        self.assertIsNone(got)

    def test_returns_none_when_derived_address_has_no_code(self) -> None:
        """tokens() returns an address, but bytecode check fails → None (do not pollute addresses.json)."""

        def fake_rpc_call(rpc, method, params):
            return {
                "result": _padded_address("0x000000000000000000000000000000000000dead"),
            }

        refresh.rpc_call = fake_rpc_call
        refresh.has_code = lambda rpc, addr: False

        got = refresh.derive_conditional_tokens_from_market_factory(
            "http://example", "0xABC0000000000000000000000000000000000001"
        )
        self.assertIsNone(got)

    def test_returns_none_when_result_is_zero_address(self) -> None:
        """tokens() returns the zero address → None (uninitialised factory)."""

        def fake_rpc_call(rpc, method, params):
            return {"result": "0x" + "00" * 32}

        refresh.rpc_call = fake_rpc_call
        refresh.has_code = lambda rpc, addr: True

        got = refresh.derive_conditional_tokens_from_market_factory(
            "http://example", "0xABC0000000000000000000000000000000000001"
        )
        self.assertIsNone(got)

    def test_returns_none_when_result_is_malformed(self) -> None:
        """tokens() returns a too-short hex string → None, no crash."""

        def fake_rpc_call(rpc, method, params):
            return {"result": "0x1234"}  # malformed: not 32 bytes

        refresh.rpc_call = fake_rpc_call
        refresh.has_code = lambda rpc, addr: True

        got = refresh.derive_conditional_tokens_from_market_factory(
            "http://example", "0xABC0000000000000000000000000000000000001"
        )
        self.assertIsNone(got)


class LiveDeriveConditionalTokensTest(unittest.TestCase):
    """Integration test: hit the real devnet if it is reachable; skip otherwise."""

    def test_live_returns_expected_address(self) -> None:
        # Probe the live RPC; skip if unreachable so this test never blocks CI.
        try:
            chain = refresh.rpc_call(LIVE_RPC, "eth_chainId", [])
        except Exception as exc:  # pragma: no cover - environment-dependent
            self.skipTest(f"live RPC {LIVE_RPC} unreachable: {exc}")
        if "result" not in chain:
            self.skipTest(f"live RPC returned no chainId: {chain}")

        got = refresh.derive_conditional_tokens_from_market_factory(
            LIVE_RPC, LIVE_MARKET_FACTORY
        )
        self.assertIsNotNone(got, "MarketFactory.tokens() failed on live chain")
        self.assertEqual(got.lower(), EXPECTED_CONDITIONAL_TOKENS)


if __name__ == "__main__":
    unittest.main(verbosity=2)
