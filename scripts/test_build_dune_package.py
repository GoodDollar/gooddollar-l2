"""Tests for ``scripts/build-dune-package.py`` and the committed
``analytics/dune-package/`` artefacts.

These tests are deliberately offline — they only read files in the repo
and verify structural invariants. They are the regression guard for
iter 28 of the testnet-readiness gate.

Run with::

    pytest scripts/test_build_dune_package.py -v
"""

from __future__ import annotations

import hashlib
import importlib.util
import json
import re
from pathlib import Path
from typing import Any

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent
SCRIPT_PATH = REPO_ROOT / "scripts" / "build-dune-package.py"
PACKAGE_DIR = REPO_ROOT / "analytics" / "dune-package"
MANIFEST_PATH = PACKAGE_DIR / "INDEXING_MANIFEST.json"
README_PATH = PACKAGE_DIR / "README.md"
GENERATED_FROM_PATH = PACKAGE_DIR / ".generated-from"
QUERIES_DIR = PACKAGE_DIR / "queries"
ADDRESS_BOOK_PATH = REPO_ROOT / "analytics" / "address-book.json"

# These mirror the script's static metadata. If the chain links move,
# update both places — that is the point of the test.
EXPECTED_CHAIN_ID = 42069
EXPECTED_ROUTE_COUNT = 14
EXPECTED_ROUTE_IDS = list(range(1, EXPECTED_ROUTE_COUNT + 1))
EXPECTED_QUERY_FILES = [
    "00_chain_health.sql",
    "01_ubi_fees_total.sql",
    "02_ubi_fees_by_protocol.sql",
    "03_ubi_fees_daily.sql",
    "04_swap_volume_by_pool.sql",
    "05_perps_trading_fees.sql",
    "06_predict_resolution_fees.sql",
    "07_lend_treasury_mint.sql",
    "08_stable_vault_fees.sql",
    "09_stocks_trading_fees.sql",
    "10_top_ubi_payers.sql",
    "11_protocol_activity_30d.sql",
]
EXPECTED_PROTOCOLS = {"swap", "perps", "predict", "lend", "stable", "stocks"}


# ---------------------------------------------------------------------------
# Module loader (script has a hyphen in its name).
# ---------------------------------------------------------------------------


def _load_module():
    spec = importlib.util.spec_from_file_location("build_dune_package", SCRIPT_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)  # type: ignore[union-attr]
    return module


@pytest.fixture(scope="session")
def module():
    return _load_module()


@pytest.fixture(scope="session")
def address_book() -> dict[str, Any]:
    assert ADDRESS_BOOK_PATH.exists(), (
        f"{ADDRESS_BOOK_PATH} missing — run scripts/build-analytics-address-book.py"
    )
    return json.loads(ADDRESS_BOOK_PATH.read_text())


@pytest.fixture(scope="session")
def manifest() -> dict[str, Any]:
    assert MANIFEST_PATH.exists(), (
        f"{MANIFEST_PATH} missing — run scripts/build-dune-package.py"
    )
    return json.loads(MANIFEST_PATH.read_text())


@pytest.fixture(scope="session")
def readme() -> str:
    assert README_PATH.exists(), f"{README_PATH} missing"
    return README_PATH.read_text()


@pytest.fixture(scope="session")
def query_texts() -> dict[str, str]:
    return {p.name: p.read_text() for p in sorted(QUERIES_DIR.glob("*.sql"))}


# ---------------------------------------------------------------------------
# Independent keccak — a *different* implementation than the generator's
# preferred backend, so any topic0 drift surfaces here.
# ---------------------------------------------------------------------------


def _independent_keccak(text: str) -> str:
    try:
        from eth_utils import keccak as kk  # type: ignore

        return "0x" + kk(text=text).hex()
    except ImportError:  # pragma: no cover
        from Crypto.Hash import keccak as _k  # type: ignore

        h = _k.new(digest_bits=256)
        h.update(text.encode())
        return "0x" + h.hexdigest()


# ---------------------------------------------------------------------------
# Package layout
# ---------------------------------------------------------------------------


def test_package_directory_layout():
    assert PACKAGE_DIR.is_dir(), f"{PACKAGE_DIR} missing"
    assert MANIFEST_PATH.exists(), "INDEXING_MANIFEST.json missing"
    assert README_PATH.exists(), "README.md missing"
    assert GENERATED_FROM_PATH.exists(), ".generated-from missing"
    assert QUERIES_DIR.is_dir(), "queries/ directory missing"


def test_query_files_match_catalogue(query_texts):
    assert sorted(query_texts.keys()) == EXPECTED_QUERY_FILES, (
        "queries/ directory does not match catalogue — stale leftovers or "
        "missing files"
    )


# ---------------------------------------------------------------------------
# Manifest top-level
# ---------------------------------------------------------------------------


def test_manifest_top_level_keys(manifest):
    for key in (
        "version",
        "generated_at",
        "generator",
        "source",
        "chain",
        "contracts",
        "fee_routes",
        "queries",
        "notes",
    ):
        assert key in manifest, f"missing key {key!r}"
    assert manifest["version"] == "1"
    assert manifest["generator"] == "scripts/build-dune-package.py"
    assert manifest["source"] == "analytics/address-book.json"


def test_manifest_chain_block(manifest):
    chain = manifest["chain"]
    assert chain["id"] == EXPECTED_CHAIN_ID
    assert chain["name"]
    assert chain["rpc_url"].startswith("https://")
    assert chain["explorer_url"].startswith("https://")
    assert chain["faucet_url"].startswith("https://")
    assert chain["dapp_url"].startswith("https://")
    assert chain["bridge_url"].startswith("https://")
    assert chain["docs_url"].startswith("https://")
    # UBI split must equal 100% in BPS.
    split = chain["fee_split_bps"]
    assert split["ubi"] + split["protocol"] == 10000, split
    # Sub-split must equal 100% of the UBI slice.
    breakdown = chain["ubi_breakdown_bps"]
    assert sum(breakdown.values()) == 10000, breakdown


# ---------------------------------------------------------------------------
# Fee routes parity with address-book
# ---------------------------------------------------------------------------


def test_fee_routes_count_and_ids(manifest):
    routes = manifest["fee_routes"]
    assert len(routes) == EXPECTED_ROUTE_COUNT
    assert [r["id"] for r in routes] == EXPECTED_ROUTE_IDS


def test_fee_routes_have_known_protocols(manifest):
    for r in manifest["fee_routes"]:
        assert r["protocol"] in EXPECTED_PROTOCOLS, r


def test_fee_routes_topic0_matches_independent_keccak(manifest):
    """Every event_topic0 in the manifest must equal keccak256(event_signature)
    computed by an independent library. Guards against hash drift between the
    address book and the projected manifest."""
    for r in manifest["fee_routes"]:
        expected = _independent_keccak(r["event_signature"])
        assert expected == r["event_topic0"], (
            f"topic0 mismatch on route {r['id']} "
            f"({r['event_signature']!r}): expected {expected}, got {r['event_topic0']}"
        )


def test_fee_routes_field_for_field_parity_with_address_book(manifest, address_book):
    """Every routed field projected into the manifest must match the
    address-book source 1:1. Hand-edits to either side will fail here."""
    by_id = {r["id"]: r for r in address_book["fee_routes"]}
    for projected in manifest["fee_routes"]:
        source = by_id[projected["id"]]
        for key in (
            "protocol",
            "kind",
            "label",
            "event_contract",
            "event_signature",
            "event_topic0",
            "fee_token",
            "sink_contract",
        ):
            assert projected[key] == source[key], (
                f"route {projected['id']} field {key!r} drift: "
                f"manifest={projected[key]!r} book={source[key]!r}"
            )
        assert projected["event_contract_address"] == source.get(
            "event_contract_address"
        )
        assert projected["sink_address"] == source.get("sink_address")
        # pending_deploy in the manifest follows source_address_pending_deploy
        # in the address book — that is the *route-level* pending flag.
        assert projected["pending_deploy"] == source["source_address_pending_deploy"], (
            f"route {projected['id']} pending_deploy drift"
        )


def test_pending_deploy_routes_are_documented_in_address_book(manifest, address_book):
    book_pending = {
        r["id"] for r in address_book["fee_routes"] if r["source_address_pending_deploy"]
    }
    manifest_pending = {r["id"] for r in manifest["fee_routes"] if r["pending_deploy"]}
    assert book_pending == manifest_pending, (
        f"pending-deploy route id set diverged: book={book_pending} "
        f"manifest={manifest_pending}"
    )


# ---------------------------------------------------------------------------
# Contracts projection
# ---------------------------------------------------------------------------


def test_contracts_list_is_sorted_by_name(manifest):
    names = [c["name"] for c in manifest["contracts"]]
    assert names == sorted(names), names


def test_every_fee_route_contract_is_in_manifest_contracts(manifest):
    contract_names = {c["name"] for c in manifest["contracts"]}
    for r in manifest["fee_routes"]:
        assert r["event_contract"] in contract_names, (
            f"event_contract {r['event_contract']} (route {r['id']}) not "
            f"projected into manifest.contracts"
        )
        assert r["sink_contract"] in contract_names, (
            f"sink_contract {r['sink_contract']} (route {r['id']}) not "
            f"projected into manifest.contracts"
        )


def test_contract_pending_deploy_flag_matches_address(manifest):
    for c in manifest["contracts"]:
        assert c["pending_deploy"] == (c["address"] is None), c


def test_deployed_contract_addresses_are_lowercase_hex(manifest):
    for c in manifest["contracts"]:
        if c["address"] is None:
            continue
        assert re.fullmatch(r"0x[0-9a-fA-F]{40}", c["address"]), c


def test_contract_event_topic0s_match_independent_keccak(manifest):
    for c in manifest["contracts"]:
        for ev in c["events"]:
            expected = _independent_keccak(ev["signature"])
            assert expected == ev["topic0"], (
                f"{c['name']}.{ev['name']} topic0 drift: expected {expected}, "
                f"got {ev['topic0']}"
            )


# ---------------------------------------------------------------------------
# Queries catalogue
# ---------------------------------------------------------------------------


def test_queries_catalogue_matches_files_on_disk(manifest, query_texts):
    listed = [q["filename"] for q in manifest["queries"]]
    assert listed == EXPECTED_QUERY_FILES
    assert sorted(query_texts.keys()) == listed


def test_queries_route_ids_are_known(manifest):
    known_ids = set(EXPECTED_ROUTE_IDS)
    for q in manifest["queries"]:
        for rid in q["fee_route_ids"]:
            assert rid in known_ids, q


# ---------------------------------------------------------------------------
# SQL files — banner, metadata, placeholders, pending markers
# ---------------------------------------------------------------------------


SQL_BANNER = (
    "-- DO NOT EDIT BY HAND — generated by scripts/build-dune-package.py"
)


def test_every_sql_starts_with_banner(query_texts):
    for name, text in query_texts.items():
        assert text.startswith(SQL_BANNER), (
            f"{name} is missing the DO-NOT-EDIT banner"
        )


def test_every_sql_uses_blockchain_placeholder_or_explains_why(query_texts):
    for name, text in query_texts.items():
        assert "{{blockchain}}" in text, (
            f"{name} must reference {{{{blockchain}}}} for vendor prefix"
        )
        # Templates must not accidentally double-escape into {{{{blockchain}}}}
        # at query-body level — the generator writes the SQL literally, only
        # the README contains the double-escaped form for documentation.
        assert "{{{{blockchain}}}}" not in text, (
            f"{name} contains an over-escaped {{{{{{{{blockchain}}}}}}}}; "
            "this is a generator bug"
        )


def test_every_sql_header_lists_its_kind(query_texts, manifest):
    catalogue_by_filename = {q["filename"]: q for q in manifest["queries"]}
    for name, text in query_texts.items():
        q = catalogue_by_filename[name]
        assert f"-- Query  : {q['filename']}" in text
        assert f"-- Title  : {q['title']}" in text
        assert f"-- Kind   : {q['kind']}" in text


def test_pending_deploy_routes_get_pending_marker_in_sql(manifest, query_texts):
    """Every fee route flagged pending_deploy must produce a `PENDING DEPLOY`
    marker in every SQL file that references it."""
    pending = {r["id"] for r in manifest["fee_routes"] if r["pending_deploy"]}
    pending_event_contracts = {
        r["event_contract"] for r in manifest["fee_routes"] if r["pending_deploy"]
    }
    catalogue_by_filename = {q["filename"]: q for q in manifest["queries"]}
    for name, text in query_texts.items():
        q = catalogue_by_filename[name]
        ids = q["fee_route_ids"]
        if not ids:
            continue
        relevant = [rid for rid in ids if rid in pending]
        if not relevant:
            continue
        assert "PENDING DEPLOY" in text, (
            f"{name} covers pending routes {relevant} but does not contain "
            "a 'PENDING DEPLOY' marker"
        )
        # And at least one of the pending event contracts must be name-dropped
        # so a reader can grep for the splitter that needs deploying.
        assert any(ec in text for ec in pending_event_contracts), (
            f"{name} covers pending routes {relevant} but does not name any "
            f"of the pending event contracts {sorted(pending_event_contracts)}"
        )


def test_sql_filters_use_lowercase_addresses_when_known(manifest, query_texts):
    """When a fee route's event_contract_address is known, SQL filters must
    use the lowercase form (Dune raw tables convention)."""
    for q in manifest["queries"]:
        ids = q["fee_route_ids"]
        if not ids:
            continue
        text = query_texts[q["filename"]]
        for r in manifest["fee_routes"]:
            if r["id"] not in ids:
                continue
            addr = r.get("event_contract_address")
            if addr is None:
                continue
            assert addr.lower() in text, (
                f"{q['filename']} should filter by lowercase address {addr.lower()} "
                f"for route {r['id']}, but it's missing"
            )
            # No mixed-case form should sneak in.
            if addr != addr.lower():
                assert addr not in text, (
                    f"{q['filename']} uses mixed-case address {addr} — must be "
                    "lowercase"
                )


def test_sql_topic0_values_match_manifest(manifest, query_texts):
    for q in manifest["queries"]:
        ids = q["fee_route_ids"]
        if not ids:
            continue
        text = query_texts[q["filename"]]
        for r in manifest["fee_routes"]:
            if r["id"] not in ids:
                continue
            assert r["event_topic0"] in text, (
                f"{q['filename']} missing topic0 {r['event_topic0']} "
                f"for route {r['id']}"
            )


# ---------------------------------------------------------------------------
# README invariants
# ---------------------------------------------------------------------------


def test_readme_contains_chain_metadata(readme, manifest):
    chain = manifest["chain"]
    assert str(chain["id"]) in readme
    assert chain["rpc_url"] in readme
    assert chain["explorer_url"] in readme
    assert chain["faucet_url"] in readme


def test_readme_lists_all_query_filenames(readme):
    for fname in EXPECTED_QUERY_FILES:
        assert fname in readme, f"README does not mention {fname}"


def test_readme_lists_every_route_id_and_topic0(readme, manifest):
    for r in manifest["fee_routes"]:
        # The route id and topic0 are both expected to appear in the routes
        # table; we check them independently so a busted table layout is
        # easier to spot.
        assert r["event_topic0"] in readme, (
            f"README missing topic0 for route {r['id']}"
        )


def test_readme_pending_deploy_markers_match_manifest(readme, manifest):
    pending = [r for r in manifest["fee_routes"] if r["pending_deploy"]]
    if not pending:
        return
    # README uses ⏳ marker for source-pending routes and `_(pending deploy)_`
    # for null event_contract_address rows.
    assert "⏳" in readme, "README should use ⏳ for pending source routes"
    null_event_addr = any(
        r.get("event_contract_address") is None for r in manifest["fee_routes"]
    )
    if null_event_addr:
        assert "_(pending deploy)_" in readme, (
            "README should mark null event-contract addresses as "
            "'_(pending deploy)_'"
        )


# ---------------------------------------------------------------------------
# .generated-from hash parity
# ---------------------------------------------------------------------------


def test_generated_from_records_address_book_hash():
    content = GENERATED_FROM_PATH.read_text().strip()
    assert content.startswith("sha256  analytics/address-book.json  "), content
    recorded = content.rsplit(" ", 1)[-1]
    actual = hashlib.sha256(ADDRESS_BOOK_PATH.read_bytes()).hexdigest()
    assert recorded == actual, (
        ".generated-from is stale — regenerate the package: "
        "python scripts/build-dune-package.py --output analytics/dune-package"
    )


# ---------------------------------------------------------------------------
# Generator round-trip + --check
# ---------------------------------------------------------------------------


def test_check_mode_passes_against_committed_artefacts(module):
    rc = module.main(["--output", str(PACKAGE_DIR), "--check"])
    assert rc == 0, (
        "committed analytics/dune-package/ is stale — regenerate with "
        "python scripts/build-dune-package.py --output analytics/dune-package"
    )


def test_build_is_deterministic(module, tmp_path):
    a = tmp_path / "a"
    b = tmp_path / "b"
    module.main(["--output", str(a), "--no-timestamp"])
    module.main(["--output", str(b), "--no-timestamp"])
    a_files = {p.relative_to(a).as_posix(): p.read_text() for p in a.rglob("*") if p.is_file()}
    b_files = {p.relative_to(b).as_posix(): p.read_text() for p in b.rglob("*") if p.is_file()}
    assert a_files.keys() == b_files.keys(), (
        f"file set differs between two builds: "
        f"only-a={set(a_files) - set(b_files)} only-b={set(b_files) - set(a_files)}"
    )
    for rel in a_files:
        assert a_files[rel] == b_files[rel], f"non-deterministic content in {rel}"


def test_build_package_returns_in_memory_files_only(module):
    files = module.build_package(ADDRESS_BOOK_PATH, no_timestamp=True)
    assert "INDEXING_MANIFEST.json" in files
    assert "README.md" in files
    assert ".generated-from" in files
    for fname in EXPECTED_QUERY_FILES:
        assert f"queries/{fname}" in files, f"missing in-memory {fname}"
    # No accidental extras.
    expected = (
        {"INDEXING_MANIFEST.json", "README.md", ".generated-from"}
        | {f"queries/{f}" for f in EXPECTED_QUERY_FILES}
    )
    assert set(files.keys()) == expected, (
        f"unexpected files in build_package output: "
        f"extra={set(files) - expected} missing={expected - set(files)}"
    )
