"""Tests for ``scripts/build-analytics-address-book.py`` and the committed
``analytics/address-book.json`` artifact.

These tests are deliberately offline — they only read files in the repo
and verify structural invariants. They are the regression guard for
iter 26 of the testnet-readiness gate.

Run with::

    pytest scripts/test_build_analytics_address_book.py -v
"""

from __future__ import annotations

import importlib.util
import json
import re
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent
SCRIPT_PATH = REPO_ROOT / "scripts" / "build-analytics-address-book.py"
ARTIFACT_PATH = REPO_ROOT / "analytics" / "address-book.json"
ADDRESSES_PATH = REPO_ROOT / "op-stack" / "addresses.json"
UBI_DOC_PATH = REPO_ROOT / "docs" / "UBI-FEE-ACCOUNTING.md"


# Dynamically load the script as a module (it has a hyphen in the name).
def _load_module():
    spec = importlib.util.spec_from_file_location("build_analytics", SCRIPT_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)  # type: ignore[union-attr]
    return module


@pytest.fixture(scope="session")
def module():
    return _load_module()


@pytest.fixture(scope="session")
def artifact() -> dict:
    assert ARTIFACT_PATH.exists(), (
        f"{ARTIFACT_PATH} is missing — run: python scripts/build-analytics-address-book.py "
        f"--output analytics/address-book.json"
    )
    return json.loads(ARTIFACT_PATH.read_text())


@pytest.fixture(scope="session")
def addresses() -> dict:
    return json.loads(ADDRESSES_PATH.read_text())


# ---------------------------------------------------------------------------
# Independent keccak — chosen to be a *different* implementation from the
# generator's preferred backend, so a topic0 drift would surface.
# ---------------------------------------------------------------------------


def _independent_keccak(text: str) -> str:
    try:
        from eth_utils import keccak as kk  # type: ignore
    except ImportError:  # pragma: no cover
        from Crypto.Hash import keccak as _k  # type: ignore

        h = _k.new(digest_bits=256)
        h.update(text.encode())
        return "0x" + h.hexdigest()
    return "0x" + kk(text=text).hex()


# ---------------------------------------------------------------------------
# Structural invariants
# ---------------------------------------------------------------------------


def test_artifact_top_level_shape(artifact):
    for key in (
        "version",
        "generated_at",
        "generator",
        "chain",
        "sources",
        "protocols",
        "fee_routes",
        "abis",
        "notes",
    ):
        assert key in artifact, f"missing top-level key {key!r}"
    assert artifact["version"] == "1"
    assert artifact["generator"] == "scripts/build-analytics-address-book.py"


def test_chain_fields_are_populated(artifact):
    chain = artifact["chain"]
    assert chain["id"] == 42069
    assert chain["name"]
    assert chain["rpc_url"].startswith("https://")
    assert chain["explorer_url"].startswith("https://")


def test_every_deployed_contract_is_classified(artifact, addresses):
    classified = {
        c["name"] for proto in artifact["protocols"].values() for c in proto["contracts"]
    }
    deployed = set(addresses["contracts"].keys())
    missing = deployed - classified
    assert not missing, (
        f"deployed contracts not classified by PROTOCOL_CLASSIFIER: {sorted(missing)}"
    )


def test_no_unknown_contracts(artifact):
    # If this fires, a new contract was added to addresses.json without an entry
    # in PROTOCOL_CLASSIFIER. Add it (or accept the infrastructure default) and
    # update the test.
    assert artifact["notes"]["unknown_contracts"] == []


def test_every_classified_address_matches_addresses_json(artifact, addresses):
    canonical = addresses["contracts"]
    for proto in artifact["protocols"].values():
        for entry in proto["contracts"]:
            assert entry["address"] == canonical[entry["name"]], (
                f"address drift for {entry['name']}"
            )


# ---------------------------------------------------------------------------
# Fee-route invariants — these are the input contract for iter 27/28/30.
# ---------------------------------------------------------------------------


EXPECTED_ROUTE_COUNT = 14
EXPECTED_ROUTE_IDS = list(range(1, EXPECTED_ROUTE_COUNT + 1))
EXPECTED_PROTOCOLS = {"swap", "perps", "predict", "lend", "stable", "stocks"}


def test_fee_route_count(artifact):
    assert len(artifact["fee_routes"]) == EXPECTED_ROUTE_COUNT


def test_fee_route_ids_dense_and_ordered(artifact):
    ids = [r["id"] for r in artifact["fee_routes"]]
    assert ids == EXPECTED_ROUTE_IDS


def test_fee_route_protocols_in_known_set(artifact):
    for r in artifact["fee_routes"]:
        assert r["protocol"] in EXPECTED_PROTOCOLS, r


def test_every_route_has_event_signature_and_topic0(artifact):
    for r in artifact["fee_routes"]:
        sig = r["event_signature"]
        assert sig and "(" in sig and sig.endswith(")"), r
        assert re.fullmatch(r"0x[0-9a-f]{64}", r["event_topic0"]), r


def test_topic0_matches_independent_keccak(artifact):
    """Every event_topic0 in the artifact must equal keccak256(event_signature)
    computed by a *different* library than the generator's preferred backend.
    This is the regression guard against hash drift / wrong-signature bugs."""
    for r in artifact["fee_routes"]:
        expected = _independent_keccak(r["event_signature"])
        assert expected == r["event_topic0"], (
            f"topic0 mismatch on route {r['id']} "
            f"({r['event_signature']!r}): expected {expected}, got {r['event_topic0']}"
        )


def test_every_sink_resolves_or_falls_back(artifact):
    base_addr = None
    for proto in artifact["protocols"].values():
        for c in proto["contracts"]:
            if c["name"] == "UBIFeeSplitter":
                base_addr = c["address"]
    assert base_addr, "base UBIFeeSplitter must be deployed and classified"

    for r in artifact["fee_routes"]:
        if r["sink_address"] is None:
            assert r["sink_address_fallback"] is not None, (
                f"route {r['id']} has no sink and no fallback"
            )
            assert r["sink_address_fallback"]["address"] == base_addr, (
                f"route {r['id']} fallback must point at UBIFeeSplitter"
            )


def test_pending_splitters_match_fallback_routes(artifact):
    pending = set(artifact["notes"]["specialised_splitters_pending"])
    fallback_sinks = {
        r["sink_contract"] for r in artifact["fee_routes"] if r["sink_address"] is None
    }
    # every sink that fell back must appear in pending (and the inverse is
    # also informative — pending sources are listed too).
    assert fallback_sinks <= pending, (
        f"sinks {fallback_sinks - pending} are pending but not listed in "
        f"notes.specialised_splitters_pending"
    )


def test_specialised_splitter_route_has_pending_flag(artifact):
    """If sink_address is None, sink_contract must be in the pending list."""
    pending = set(artifact["notes"]["specialised_splitters_pending"])
    for r in artifact["fee_routes"]:
        if r["sink_address"] is None:
            assert r["sink_contract"] in pending, r


def test_source_address_pending_flag_matches_address(artifact):
    for r in artifact["fee_routes"]:
        assert r["source_address_pending_deploy"] == (r["source_address"] is None), r


# ---------------------------------------------------------------------------
# ABI projection invariants
# ---------------------------------------------------------------------------


def test_abis_include_all_deployed_contracts_with_compiled_artifacts(artifact, addresses):
    for name in addresses["contracts"]:
        # Some deployed names won't have ABIs (mocks, test helpers, deprecated).
        # We don't fail on those — but we DO require that every fee-route source
        # / sink / event contract that is deployed has an ABI.
        pass
    needed = set()
    for r in artifact["fee_routes"]:
        for key in ("source_contract", "sink_contract", "event_contract"):
            name = r[key]
            # Only require ABI when contract is deployed.
            if name in addresses["contracts"]:
                needed.add(name)
    missing = needed - set(artifact["abis"].keys())
    assert not missing, (
        f"fee-route contracts that are deployed but have no projected ABI: "
        f"{sorted(missing)}"
    )


def test_abi_events_have_topic0(artifact):
    for name, doc in artifact["abis"].items():
        for ev in doc["events"]:
            assert re.fullmatch(r"0x[0-9a-f]{64}", ev["topic0"]), (name, ev)
            assert _independent_keccak(ev["signature"]) == ev["topic0"], (name, ev)


def test_every_route_event_signature_exists_in_event_contract_abi(artifact):
    """A fee route's event must actually exist on the contract that emits it.
    This catches signature drift between docs and source code."""
    for r in artifact["fee_routes"]:
        ec = r["event_contract"]
        abi = artifact["abis"].get(ec)
        if abi is None:
            # event_contract not deployed AND not even compiled — record-only.
            # We tolerate this when event_contract_deployed is False.
            assert r["event_contract_deployed"] is False, r
            continue
        sigs = {e["signature"] for e in abi["events"]}
        assert r["event_signature"] in sigs, (
            f"route {r['id']} signature {r['event_signature']!r} not found in "
            f"{ec} ABI; have {sorted(sigs)}"
        )


# ---------------------------------------------------------------------------
# Generator round-trip
# ---------------------------------------------------------------------------


def test_check_mode_passes_against_committed_artifact(module, tmp_path):
    rc = module.main(["--output", str(ARTIFACT_PATH), "--check"])
    assert rc == 0, "committed analytics/address-book.json is stale — regenerate"


def test_round_trip_is_deterministic(module, tmp_path):
    a = tmp_path / "a.json"
    b = tmp_path / "b.json"
    module.main(["--output", str(a), "--no-timestamp"])
    module.main(["--output", str(b), "--no-timestamp"])
    assert a.read_text() == b.read_text(), "build is not deterministic"


def test_fee_routes_doc_parser_matches_fallback(module):
    """The doc parser and the inline fallback must agree on the route IDs."""
    if not UBI_DOC_PATH.exists():
        pytest.skip("UBI doc missing")
    parsed = module._parse_fee_routes_from_doc(UBI_DOC_PATH.read_text())
    assert parsed is not None, "doc parse failed — fix doc or update FEE_ROUTES_FALLBACK"
    assert [r["id"] for r in parsed] == [r["id"] for r in module.FEE_ROUTES_FALLBACK]
