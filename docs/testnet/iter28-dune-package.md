# Iter 28 — Dune / indexing request package

**Status:** ✅ shipped
**Date:** 2026-05-18
**Plan row:** [Iter 28 of the 50-iteration testnet readiness plan](../TESTNET-READINESS-50-ITERATIONS.md)

> **Plan row 28 — Dune package**
> Dune/indexing request package ready even if chain indexing pending.
> **Proof:** SQL/query pack + docs.

## What shipped

The "please index us" package that a third-party indexing team (Dune Analytics,
Allium, Goldsky, Subsquid, etc.) needs to onboard the Good Chain — built today,
ahead of any actual vendor relationship, so we can hand it over as a single
PR-ready directory the moment a partner is available.

The package is generated from a single source of truth
([`analytics/address-book.json`](../../analytics/address-book.json), iter 26),
is byte-deterministic, and is gated by a 30-test pytest suite plus an offline
`--check` mode that detects drift between the address book and the committed
artefacts.

### Files added

| Path | Role |
| --- | --- |
| [`analytics/dune-package/INDEXING_MANIFEST.json`](../../analytics/dune-package/INDEXING_MANIFEST.json) | Machine-readable inventory: chain config, 15 contracts, 14 fee routes, 12 query references |
| [`analytics/dune-package/README.md`](../../analytics/dune-package/README.md) | Operator-facing brief: quickstart, decoding cookbook, UBI fee accounting, query catalogue |
| [`analytics/dune-package/queries/00_chain_health.sql`](../../analytics/dune-package/queries/00_chain_health.sql) | Block production + tx throughput |
| [`analytics/dune-package/queries/01_ubi_fees_total.sql`](../../analytics/dune-package/queries/01_ubi_fees_total.sql) | Aggregate UBI fee events across all routes |
| [`analytics/dune-package/queries/02_ubi_fees_by_protocol.sql`](../../analytics/dune-package/queries/02_ubi_fees_by_protocol.sql) | Per-protocol breakdown (swap, perps, predict, lend, stable, stocks) |
| [`analytics/dune-package/queries/03_ubi_fees_daily.sql`](../../analytics/dune-package/queries/03_ubi_fees_daily.sql) | Daily UBI fee event series |
| [`analytics/dune-package/queries/04_swap_volume_by_pool.sql`](../../analytics/dune-package/queries/04_swap_volume_by_pool.sql) | Swap V4 PoolManager `Swap` events grouped by pool |
| [`analytics/dune-package/queries/05_perps_trading_fees.sql`](../../analytics/dune-package/queries/05_perps_trading_fees.sql) | Perps trading/funding/liquidation fee events (routes 3–5) |
| [`analytics/dune-package/queries/06_predict_resolution_fees.sql`](../../analytics/dune-package/queries/06_predict_resolution_fees.sql) | Predict factory + resolver fees (routes 6–7) |
| [`analytics/dune-package/queries/07_lend_treasury_mint.sql`](../../analytics/dune-package/queries/07_lend_treasury_mint.sql) | Lend reserve-factor `ReserveDataUpdated` events (route 8) |
| [`analytics/dune-package/queries/08_stable_vault_fees.sql`](../../analytics/dune-package/queries/08_stable_vault_fees.sql) | Stable stability/minting/liquidation/governance (routes 9–12) |
| [`analytics/dune-package/queries/09_stocks_trading_fees.sql`](../../analytics/dune-package/queries/09_stocks_trading_fees.sql) | Stocks trading + liquidation remnant (routes 13–14) |
| [`analytics/dune-package/queries/10_top_ubi_payers.sql`](../../analytics/dune-package/queries/10_top_ubi_payers.sql) | Top addresses by UBI fee event count (24 h window) |
| [`analytics/dune-package/queries/11_protocol_activity_30d.sql`](../../analytics/dune-package/queries/11_protocol_activity_30d.sql) | 30-day protocol activity by topic0 |
| [`analytics/dune-package/.generated-from`](../../analytics/dune-package/.generated-from) | `sha256  analytics/address-book.json  <hash>` — drift detector |
| [`scripts/build-dune-package.py`](../../scripts/build-dune-package.py) | Offline, deterministic generator (`--output`, `--check`, `--no-timestamp`) |
| [`scripts/test_build_dune_package.py`](../../scripts/test_build_dune_package.py) | 30-test pytest regression suite |
| [`docs/testnet/iter28-dune-package.md`](iter28-dune-package.md) | This proof doc |

### Architectural choices

1. **One generator, one source.** The script reads only
   `analytics/address-book.json` (the iter 26 truth source). It writes only
   under `analytics/dune-package/`. Both directions are enforced by the test
   suite — `test_fee_routes_field_for_field_parity_with_address_book` walks
   every projected field and asserts equality with the book.
2. **Deterministic output.** With `--no-timestamp`, two runs produce
   byte-identical files. Verified by `test_build_is_deterministic`. This is
   what lets us commit the artefacts and run `--check` in CI.
3. **`{{blockchain}}` placeholders, not vendor-specific tables.** Each SQL
   targets a generic `<chain>.logs` / `<chain>.transactions` schema. A vendor
   substitutes the placeholder at import time (`good_chain`, `goodchain`,
   `gd_l2`, etc.). The package does not assume Dune-only.
4. **Pending-deploy is surfaced everywhere.** Three of the 14 fee routes
   (routes 7, 11, 12 — Predict resolver + Stable minting/liquidation) and
   five contracts (`OptimisticResolver`, `PerpUBIFeeSplitter`,
   `PredictUBIFeeSplitter`, `StableUBIFeeSplitter`, `StocksUBIFeeSplitter`)
   are flagged `pending_deploy: true` because their splitter contracts have
   not been deployed to devnet yet. The README marks these with ⏳ in the
   fee-route table and `_(pending deploy)_` for null `event_contract_address`;
   every SQL file that touches a pending route carries an explicit
   `PENDING DEPLOY` comment naming the splitter. The pytest enforces this
   (`test_pending_deploy_routes_get_pending_marker_in_sql`).
5. **Two layers of integrity checking:** (a) `.generated-from` records the
   SHA-256 of the address book at generation time; the test compares it
   against a fresh `sha256sum` of the file on disk. (b) `--check` mode does a
   full regeneration in memory and diffs against the committed files.

### Manifest summary

```
contracts:        15  (10 deployed + 5 pending_deploy)
fee_routes:       14  (11 deployed + 3 pending_deploy: ids 7, 11, 12)
queries:          12
chain.id:         42069
chain.rpc_url:    https://rpc.goodclaw.org
chain.explorer:   https://explorer.goodclaw.org
chain.fee_split:  ubi=2000 bps  protocol=8000 bps
ubi_breakdown:    individuals=8000 bps  community=1500 bps  treasury=500 bps  (sum = 10000)
pending contracts: OptimisticResolver, PerpUBIFeeSplitter, PredictUBIFeeSplitter,
                   StableUBIFeeSplitter, StocksUBIFeeSplitter
```

## Proof

### 1. Generator drift check (`--check`)

```
$ python3 scripts/build-dune-package.py --check --output analytics/dune-package
OK: 15 file(s) match a fresh regeneration. No drift.
```

15 files (12 SQL + `INDEXING_MANIFEST.json` + `README.md` + `.generated-from`)
regenerate byte-identically from `analytics/address-book.json`.

### 2. Pytest — 30 passed

```
$ python3 -m pytest scripts/test_build_dune_package.py -v
...
scripts/test_build_dune_package.py::test_package_directory_layout PASSED [  3%]
scripts/test_build_dune_package.py::test_query_files_match_catalogue PASSED [  6%]
scripts/test_build_dune_package.py::test_manifest_top_level_keys PASSED  [ 10%]
scripts/test_build_dune_package.py::test_manifest_chain_block PASSED     [ 13%]
scripts/test_build_dune_package.py::test_fee_routes_count_and_ids PASSED [ 16%]
scripts/test_build_dune_package.py::test_fee_routes_have_known_protocols PASSED [ 20%]
scripts/test_build_dune_package.py::test_fee_routes_topic0_matches_independent_keccak PASSED [ 23%]
scripts/test_build_dune_package.py::test_fee_routes_field_for_field_parity_with_address_book PASSED [ 26%]
scripts/test_build_dune_package.py::test_pending_deploy_routes_are_documented_in_address_book PASSED [ 30%]
scripts/test_build_dune_package.py::test_contracts_list_is_sorted_by_name PASSED [ 33%]
scripts/test_build_dune_package.py::test_every_fee_route_contract_is_in_manifest_contracts PASSED [ 36%]
scripts/test_build_dune_package.py::test_contract_pending_deploy_flag_matches_address PASSED [ 40%]
scripts/test_build_dune_package.py::test_deployed_contract_addresses_are_lowercase_hex PASSED [ 43%]
scripts/test_build_dune_package.py::test_contract_event_topic0s_match_independent_keccak PASSED [ 46%]
scripts/test_build_dune_package.py::test_queries_catalogue_matches_files_on_disk PASSED [ 50%]
scripts/test_build_dune_package.py::test_queries_route_ids_are_known PASSED [ 53%]
scripts/test_build_dune_package.py::test_every_sql_starts_with_banner PASSED [ 56%]
scripts/test_build_dune_package.py::test_every_sql_uses_blockchain_placeholder_or_explains_why PASSED [ 60%]
scripts/test_build_dune_package.py::test_every_sql_header_lists_its_kind PASSED [ 63%]
scripts/test_build_dune_package.py::test_pending_deploy_routes_get_pending_marker_in_sql PASSED [ 66%]
scripts/test_build_dune_package.py::test_sql_filters_use_lowercase_addresses_when_known PASSED [ 70%]
scripts/test_build_dune_package.py::test_sql_topic0_values_match_manifest PASSED [ 73%]
scripts/test_build_dune_package.py::test_readme_contains_chain_metadata PASSED [ 76%]
scripts/test_build_dune_package.py::test_readme_lists_all_query_filenames PASSED [ 80%]
scripts/test_build_dune_package.py::test_readme_lists_every_route_id_and_topic0 PASSED [ 83%]
scripts/test_build_dune_package.py::test_readme_pending_deploy_markers_match_manifest PASSED [ 86%]
scripts/test_build_dune_package.py::test_generated_from_records_address_book_hash PASSED [ 90%]
scripts/test_build_dune_package.py::test_check_mode_passes_against_committed_artefacts PASSED [ 93%]
scripts/test_build_dune_package.py::test_build_is_deterministic PASSED   [ 96%]
scripts/test_build_dune_package.py::test_build_package_returns_in_memory_files_only PASSED [100%]

============================== 30 passed in 0.60s ==============================
```

The suite is split across six concerns:

| Concern | Tests |
| --- | --- |
| Package layout (files exist, queries catalogue matches disk) | 2 |
| Manifest structure & chain block (UBI split sums to 10000 bps, sub-split sums to 10000 bps) | 2 |
| Fee-routes parity with address book (count, IDs, known protocols, topic0 vs independent keccak, every field, pending_deploy parity) | 6 |
| Contract projection (sort order, every event/sink contract present, pending flag matches null-address, lowercase hex, topic0 vs independent keccak) | 5 |
| Query catalogue + SQL hygiene (catalogue matches files, route IDs known, banner, `{{blockchain}}`, headers, pending markers, lowercase addresses, topic0 values present) | 8 |
| README + `.generated-from` + `--check` + determinism + in-memory build | 7 |

The `keccak256` validation uses `eth_utils.keccak` — a different
implementation than the generator's preferred backend (`Crypto.Hash.keccak`),
so any topic0 drift across the address book → manifest → SQL chain surfaces
locally rather than silently propagating.

### 3. SQL file inventory

```
$ wc -l analytics/dune-package/queries/*.sql
   38 analytics/dune-package/queries/00_chain_health.sql
  213 analytics/dune-package/queries/01_ubi_fees_total.sql
  212 analytics/dune-package/queries/02_ubi_fees_by_protocol.sql
  211 analytics/dune-package/queries/03_ubi_fees_daily.sql
   34 analytics/dune-package/queries/04_swap_volume_by_pool.sql
   73 analytics/dune-package/queries/05_perps_trading_fees.sql
   60 analytics/dune-package/queries/06_predict_resolution_fees.sql
   33 analytics/dune-package/queries/07_lend_treasury_mint.sql
   89 analytics/dune-package/queries/08_stable_vault_fees.sql
   59 analytics/dune-package/queries/09_stocks_trading_fees.sql
  219 analytics/dune-package/queries/10_top_ubi_payers.sql
  212 analytics/dune-package/queries/11_protocol_activity_30d.sql
 1453 total
```

All 12 queries are >0 lines, named per the catalogue, and start with the
`-- DO NOT EDIT BY HAND — generated by scripts/build-dune-package.py` banner.

### 4. `.generated-from` parity

```
$ cat analytics/dune-package/.generated-from
sha256  analytics/address-book.json  714749be731665f58881b49560f194047ba513dc1928298df6bc760e37dcc0f3

$ sha256sum analytics/address-book.json | awk '{print $1}'
714749be731665f58881b49560f194047ba513dc1928298df6bc760e37dcc0f3
```

Matches. `test_generated_from_records_address_book_hash` enforces this on
every run.

### 5. Doc-link checker (root README + key docs)

```
$ python3 scripts/check-doc-links.py README.md docs/TESTNET_README.md docs/ARCHITECTURE.md
...
checked=53 broken=0
```

The new analytics/dune-package link in the root `README.md` resolves, and no
prior links were broken by this iteration.

### 6. Combined analytics suite (iter 26 + iter 28)

```
$ python3 -m pytest scripts/test_build_analytics_address_book.py scripts/test_build_dune_package.py -q
..................................................                       [100%]
50 passed in 0.24s
```

The iter 26 address-book guard and the iter 28 dune-package guard are
independent and both green.

## How the next vendor should consume this

1. Read `analytics/dune-package/README.md` from the top.
2. Pull `INDEXING_MANIFEST.json` into their indexer config — contracts,
   events (with `topic0`), and fee routes are already structured.
3. Use `chain.rpc_url` / `chain.explorer_url` for archive node bootstrapping.
4. Substitute `{{blockchain}}` in every SQL with their internal chain handle.
5. The five pending splitters are flagged in `notes.specialised_splitters_pending`
   and the routes table; vendors should treat those rows as
   "deploy first, then index" rather than missing data.

## Followups (not blockers for iter 28)

* When the five pending splitter contracts deploy, regenerate the package
  (`python3 scripts/build-dune-package.py --output analytics/dune-package`)
  and the manifest will lose its `pending_deploy: true` flags automatically.
* If/when a vendor adopts the package, mirror the SQL into their UI as a
  starter dashboard and link it from `docs/TESTNET_README.md`.
* Add a single "did this break?" check to CI:
  `python3 scripts/build-dune-package.py --check --output analytics/dune-package`
  — this is the equivalent of `scripts/check-doc-links.py` for the
  analytics surface.
