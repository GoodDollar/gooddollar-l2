#!/usr/bin/env python3
"""Tests for the canonical address pipeline.

Covers two scripts:

  * ``scripts/refresh-addresses.py`` — broadcast → addresses.env / addresses.json.
    We test the helper for deriving ConditionalTokens from MarketFactory,
    plus the new pure serializers (``serialize_addresses_env``,
    ``serialize_op_stack_addresses``) and the ``--check`` diff guard.

  * ``scripts/check_no_stale_addresses.py`` — repository scanner that
    fails when source files reference hex addresses outside the canonical
    registry without a STALE/allowlist marker.

Run with: python3 scripts/test_refresh_addresses.py
"""

from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
import urllib.error
from pathlib import Path

HERE = Path(__file__).resolve().parent
SCRIPT = HERE / "refresh-addresses.py"
CHECK_SCRIPT = HERE / "check_no_stale_addresses.py"
REPO_ROOT = HERE.parent

# Load the hyphenated script as a module so we can call its helpers.
_spec = importlib.util.spec_from_file_location("refresh_addresses", SCRIPT)
assert _spec and _spec.loader, "could not build module spec for refresh-addresses.py"
refresh = importlib.util.module_from_spec(_spec)
sys.modules["refresh_addresses"] = refresh
_spec.loader.exec_module(refresh)

# check_no_stale_addresses has no hyphen so a normal import path works
# once the directory is on sys.path.
sys.path.insert(0, str(HERE))
import check_no_stale_addresses as no_stale  # noqa: E402


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


class SerializeAddressesEnvTests(unittest.TestCase):
    """Pure-function tests for serialize_addresses_env (the .env serializer)."""

    def _resolved_and_sources(self) -> tuple[dict[str, str], dict[str, str]]:
        # serialize_addresses_env iterates over EVERY symbol in REQUIRED and
        # looks them up directly via resolved[sym] / sources[sym], so we have
        # to populate the full REQUIRED set or the function KeyErrors. We
        # also throw in one auxiliary symbol so we cover both the REQUIRED
        # block and the trailing "Auxiliary" block.
        resolved: dict[str, str] = {}
        sources: dict[str, str] = {}
        for i, sym in enumerate(refresh.REQUIRED):
            # Distinct deterministic addresses per symbol.
            resolved[sym] = "0x" + (f"{i + 1:040x}")
            sources[sym] = f"broadcast/Required{i}.s.sol/run-latest.json"
        # Auxiliary: a symbol NOT in REQUIRED, exercises the second loop.
        resolved["GOODSWAP_FACTORY"] = "0x" + ("ab" * 20)
        sources["GOODSWAP_FACTORY"] = "broadcast/Aux.s.sol/run-latest.json"
        return resolved, sources

    def test_serializer_is_pure_byte_for_byte(self) -> None:
        """Same inputs → identical bytes. No hidden state, no dict ordering surprises."""
        resolved, sources = self._resolved_and_sources()
        a = refresh.serialize_addresses_env(
            resolved, sources, "http://rpc", "42069", "2026-05-17T00:00:00Z"
        )
        b = refresh.serialize_addresses_env(
            resolved, sources, "http://rpc", "42069", "2026-05-17T00:00:00Z"
        )
        self.assertEqual(a, b)

    def test_serializer_writes_provenance_on_own_line(self) -> None:
        """`# source: ...` lives on the line BEFORE the KEY=VALUE pair so dotenv
        parsers don't pass the comment through as part of the value."""
        resolved, sources = self._resolved_and_sources()
        text = refresh.serialize_addresses_env(
            resolved, sources, "http://rpc", "42069", "2026-05-17T00:00:00Z"
        )
        for sym, addr in resolved.items():
            line = f"{sym}={addr}"
            self.assertIn(line, text)
            # No inline comment slipped onto the same line.
            self.assertNotIn(f"{line} #", text)
            self.assertNotIn(f"{line}#", text)

    def test_normaliser_strips_only_timestamp(self) -> None:
        """_normalize_env_for_diff must collapse two runs with different timestamps
        into byte-equal strings -- and ONLY the timestamp must change."""
        resolved, sources = self._resolved_and_sources()
        early = refresh.serialize_addresses_env(
            resolved, sources, "http://rpc", "42069", "2026-05-17T00:00:00Z"
        )
        late = refresh.serialize_addresses_env(
            resolved, sources, "http://rpc", "42069", "2026-05-18T12:34:56Z"
        )
        self.assertNotEqual(early, late)
        self.assertEqual(
            refresh._normalize_env_for_diff(early),
            refresh._normalize_env_for_diff(late),
        )


class SerializeOpStackAddressesTests(unittest.TestCase):
    """Tests for serialize_op_stack_addresses against a temp JSON file."""

    def _write_json(self, tmp: Path, body: dict) -> Path:
        p = tmp / "addresses.json"
        p.write_text(json.dumps(body, indent=4))
        return p

    def test_returns_none_when_file_missing(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            missing = Path(td) / "does-not-exist.json"
            text, added, overwritten = refresh.serialize_op_stack_addresses(
                missing, {}, "http://rpc", 42069, "2026-05-17T00:00:00Z"
            )
            self.assertIsNone(text)
            self.assertEqual((added, overwritten), (0, 0))

    def test_returns_none_when_contracts_block_missing(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            p = self._write_json(Path(td), {"chain_id": 42069})
            text, added, overwritten = refresh.serialize_op_stack_addresses(
                p, {}, "http://rpc", 42069, "2026-05-17T00:00:00Z"
            )
            self.assertIsNone(text)
            self.assertEqual((added, overwritten), (0, 0))

    def test_overwrites_changed_address_and_bumps_counter(self) -> None:
        """Existing key with a different value → counts as overwritten."""
        sym = next(iter(refresh._SYMBOL_TO_CONTRACT_NAME))
        cn = refresh._SYMBOL_TO_CONTRACT_NAME[sym]
        old = "0xAaaaaaAAaaAaaAAaAaaAaAaAAaAAAaaAAAaaAAAa"
        new = "0xBbbBBBbbBbbbBbbBbBBBBbBBbbBBbBBbBbbBBbBb"
        with tempfile.TemporaryDirectory() as td:
            p = self._write_json(
                Path(td),
                {
                    "chain_id": 42069,
                    "contracts": {cn: old},
                },
            )
            text, added, overwritten = refresh.serialize_op_stack_addresses(
                p, {sym: new}, "http://rpc", 42069, "2026-05-17T00:00:00Z"
            )
            self.assertIsNotNone(text)
            self.assertEqual(added, 0)
            self.assertEqual(overwritten, 1)
            data = json.loads(text)
            self.assertEqual(data["contracts"][cn], new)

    def test_adds_missing_key_and_preserves_unknown_keys(self) -> None:
        """Symbols absent from the JSON are added; keys not in SYMBOL_MAP
        survive verbatim."""
        sym = next(iter(refresh._SYMBOL_TO_CONTRACT_NAME))
        cn = refresh._SYMBOL_TO_CONTRACT_NAME[sym]
        addr = "0xCCCCCCCCcccccccccccccccccccCCCCCCcccccCC"
        unknown = "0xDDddddddDDDDDDDDDDdddddDDDDDddddDDDDdddD"
        with tempfile.TemporaryDirectory() as td:
            p = self._write_json(
                Path(td),
                {
                    "chain_id": 42069,
                    "contracts": {"FastWithdrawalLP": unknown},
                },
            )
            text, added, overwritten = refresh.serialize_op_stack_addresses(
                p, {sym: addr}, "http://rpc", 42069, "2026-05-17T00:00:00Z"
            )
            self.assertIsNotNone(text)
            self.assertEqual(added, 1)
            self.assertEqual(overwritten, 0)
            data = json.loads(text)
            self.assertEqual(data["contracts"][cn], addr)
            # Unknown key untouched.
            self.assertEqual(data["contracts"]["FastWithdrawalLP"], unknown)

    def test_noop_run_does_not_rewrite_comment(self) -> None:
        """If nothing changes, _comment is NOT rewritten -- a clean run is
        byte-identical so --check stays quiet."""
        sym = next(iter(refresh._SYMBOL_TO_CONTRACT_NAME))
        cn = refresh._SYMBOL_TO_CONTRACT_NAME[sym]
        addr = "0xEeeeEEeeEEeeEEeeeEEEeeEEeeeEEEeeEeEeEeEe"
        original_comment = "GoodDollar L2 contract addresses — synced 2020-01-01 from elsewhere"
        with tempfile.TemporaryDirectory() as td:
            p = self._write_json(
                Path(td),
                {
                    "_comment": original_comment,
                    "chain_id": 42069,
                    "contracts": {cn: addr},
                },
            )
            text, added, overwritten = refresh.serialize_op_stack_addresses(
                p, {sym: addr}, "http://rpc", 42069, "2026-05-17T00:00:00Z"
            )
            self.assertEqual((added, overwritten), (0, 0))
            data = json.loads(text)
            self.assertEqual(data["_comment"], original_comment)


class CheckNoStaleAddressesTests(unittest.TestCase):
    """Tests for the pure helpers in scripts/check_no_stale_addresses.py."""

    def test_canonical_address_is_allowed(self) -> None:
        canon = {"0xfeedfacefeedfacefeedfacefeedfacefeedface"}
        self.assertTrue(
            no_stale.is_allowed_address(
                "0xfeedfacefeedfacefeedfacefeedfacefeedface", canon
            )
        )

    def test_zero_address_is_baked_in(self) -> None:
        self.assertTrue(
            no_stale.is_allowed_address(
                "0x0000000000000000000000000000000000000000", set()
            )
        )

    def test_dead_address_is_baked_in(self) -> None:
        self.assertTrue(
            no_stale.is_allowed_address(
                "0x000000000000000000000000000000000000dead", set()
            )
        )

    def test_op_predeploy_range_is_allowed(self) -> None:
        # OP Stack predeploys live in 0x4200…00 – 0x4200…FF.
        self.assertTrue(
            no_stale.is_allowed_address(
                "0x4200000000000000000000000000000000000010", set()
            )
        )
        self.assertTrue(
            no_stale.is_allowed_address(
                "0x42000000000000000000000000000000000000ff", set()
            )
        )

    def test_random_address_is_not_allowed(self) -> None:
        self.assertFalse(
            no_stale.is_allowed_address(
                "0xaabbccddeeff11223344556677889900aabbccdd", set()
            )
        )

    def test_marker_on_same_line_authorises(self) -> None:
        lines = ["const x = '0xAA...'  // STALE: redeploy pending"]
        self.assertTrue(no_stale.line_or_window_marks_stale(lines, 0))

    def test_marker_on_prior_line_within_window_authorises(self) -> None:
        lines = [
            "// STALE: this address is parked awaiting redeploy",
            "const x = '0xBB...'",
        ]
        self.assertTrue(no_stale.line_or_window_marks_stale(lines, 1))

    def test_blank_line_breaks_marker_window(self) -> None:
        """A blank line between the marker and the address resets the
        window — the address is treated as untagged."""
        lines = [
            "// STALE: stale comment in unrelated paragraph above",
            "",
            "const x = '0xCC...'",
        ]
        self.assertFalse(no_stale.line_or_window_marks_stale(lines, 2))

    def test_lookback_window_has_a_limit(self) -> None:
        """A marker more than LOOKBACK_LINES back does NOT save the line."""
        lines = ["// STALE: long ago"]
        # Pad with non-blank lines past the lookback window.
        lines += [f"const filler{i} = {i};" for i in range(no_stale.LOOKBACK_LINES + 5)]
        lines.append("const x = '0xDD...'")
        self.assertFalse(no_stale.line_or_window_marks_stale(lines, len(lines) - 1))

    def test_scan_file_respects_canonical_and_marker(self) -> None:
        """Smoke test scan_file: 1 canonical + 1 marker-tagged + 1 raw → only
        the raw one is reported."""
        canonical_addr = "0x1111111111111111111111111111111111111111"
        marker_addr = "0x2222222222222222222222222222222222222222"
        bare_addr = "0x3333333333333333333333333333333333333333"
        body = (
            f"const a = '{canonical_addr}';\n"
            f"// STALE: parked\n"
            f"const b = '{marker_addr}';\n"
            f"\n"  # paragraph break — marker no longer applies
            f"const c = '{bare_addr}';\n"
        )
        with tempfile.TemporaryDirectory() as td:
            p = Path(td) / "demo.ts"
            p.write_text(body)
            hits = no_stale.scan_file(p, {canonical_addr.lower()})
            addrs = [h[2] for h in hits]
            self.assertEqual(addrs, [bare_addr.lower()])


class CheckNoStaleAddressesCliTests(unittest.TestCase):
    """End-to-end CLI test for scripts/check_no_stale_addresses.py.

    Exercises the actual entry point the build loop will invoke. Skips
    on a non-Linux / no-python3 environment by falling back to sys.executable.
    """

    def test_cli_passes_on_real_repo_with_default_paths(self) -> None:
        """The repo is currently clean of stale untagged addresses; if a
        contributor introduces one, this test will fail in CI before they
        can land it."""
        result = subprocess.run(
            [sys.executable, str(CHECK_SCRIPT)],
            capture_output=True,
            text=True,
            cwd=str(REPO_ROOT),
        )
        self.assertEqual(
            result.returncode,
            0,
            msg=(
                "scripts/check_no_stale_addresses.py reported stale addresses:\n"
                f"---STDOUT---\n{result.stdout}\n"
                f"---STDERR---\n{result.stderr}"
            ),
        )

    def test_cli_fails_when_a_stale_address_is_present(self) -> None:
        """Synthesise a one-file scan path that contains an untagged
        non-canonical hex address and confirm the CLI exits non-zero."""
        with tempfile.TemporaryDirectory() as td:
            scan_dir = Path(td) / "fakesrc"
            scan_dir.mkdir()
            (scan_dir / "leaks.ts").write_text(
                "export const x = '0xAABBCCDDeeFF11223344556677889900AABBCCDD';\n"
            )
            result = subprocess.run(
                [
                    sys.executable,
                    str(CHECK_SCRIPT),
                    "--paths",
                    str(scan_dir.relative_to(REPO_ROOT))
                    if td.startswith(str(REPO_ROOT))
                    else str(scan_dir),
                ],
                capture_output=True,
                text=True,
                cwd=str(REPO_ROOT),
            )
            self.assertEqual(
                result.returncode,
                1,
                msg=(
                    "CLI failed to flag synthetic stale address:\n"
                    f"---STDOUT---\n{result.stdout}\n"
                    f"---STDERR---\n{result.stderr}"
                ),
            )
            self.assertIn(
                "0xaabbccddeeff11223344556677889900aabbccdd",
                result.stdout.lower(),
            )


if __name__ == "__main__":
    unittest.main(verbosity=2)
