# GoodDollar L2 — Dune / Indexing Request Package

<!-- GOODCHAIN_STATUS:START -->
> **Public testnet checkpoint (2026-05-24 16:47 UTC):** `main@6e329ad3` is deployed to `goodswap.goodclaw.org`. Public health gate and lane-7 internal smoke are **GREEN-with-warnings** with `0` blockers. Explorer/RPC were repaired without wiping Blockscout DB; final verification showed RPC/explorer at block `13777`, and a live follow-up probe saw the explorer advancing past `14029`. Remaining warnings are accepted/excluded health-only services or optional `LANE7_RPC` freshness config. See root `README.md` and `docs/ARCHITECTURE.md`.
<!-- GOODCHAIN_STATUS:END -->


> **Iter 28 of `docs/TESTNET-READINESS-50-ITERATIONS.md`** — the artifact a
> third-party indexer (Dune Analytics, Allium, Goldsky, Subsquid, etc.)
> needs to onboard GoodDollar L2 even though chain indexing is still
> being provisioned.

This directory is **machine-generated** from
[`analytics/address-book.json`](../address-book.json) — do not hand-edit.
Regenerate any time the address book changes:

```bash
python scripts/build-dune-package.py --output analytics/dune-package
```

A pytest companion at `scripts/test_build_dune_package.py` guards drift.

## 1. Chain quickstart

```jsonc
{
  "chain_id":      42069,
  "name":          "GoodDollar L2 Devnet",
  "rpc_url":       "https://rpc.goodclaw.org",
  "explorer_url":  "https://explorer.goodclaw.org",
  "faucet_url":    "https://goodswap.goodclaw.org/faucet",
  "bridge_url":    "https://goodswap.goodclaw.org/portfolio",
  "docs_url":      "https://goodswap.goodclaw.org/testnet-guide",
  "dapp_url":      "https://goodswap.goodclaw.org",
  "fee_split_bps": { "ubi": 2000, "protocol": 8000 }
}
```

## 2. Decode this chain

The package's [`INDEXING_MANIFEST.json`](./INDEXING_MANIFEST.json) lists
every contract that emits a UBI fee event, with the **full ABI event
projection** (signature, `topic0`, indexed input names) and the
protocol it belongs to. Generic-indexer import recipes:

- **Dune V2 (Spellbook)** — submit the manifest as the contract+ABI bundle
  for `gooddollar_l2`. Each `contracts[].events[]` row becomes a
  `decoded_evt_*` view; `topic0` doubles as the lookup key in raw
  `gooddollar_l2.logs`.
- **Allium** — paste each `(address, abi)` pair into
  `event_logs_decoded.<protocol>_<event>` setup; the manifest is already
  normalised to that shape.
- **Goldsky / Subsquid** — feed `contracts[]` into an `evmLog` mapping;
  every `pending_deploy: true` contract is intentionally left without an
  address so the mapping is staged but inactive.

## 3. UBI fee accounting

Every protocol on GoodDollar L2 routes a fixed slice of its fees to a
UBI pool. The canonical specification is
[`docs/UBI-FEE-ACCOUNTING.md`](../../docs/UBI-FEE-ACCOUNTING.md);
this package operationalises §4 (the 14 fee routes table) for
indexing vendors.

Default split: **20% UBI / 80% protocol**.
Inside the UBI slice the on-chain breakdown is:

- `human_ubi_pool_bps`   : 1667
- `g_dollar_treasury_bps`: 6333
- `validator_rewards_bps`: 2000

### 3.1 All 14 fee routes

| #  | Protocol | Kind | Event Contract | Address | topic0 |
| -- | -------- | ---- | -------------- | ------- | ------ |
|  1 | swap | v4_hook | `UBIFeeHook` | `0xD7aCb2708f0D12efD9f02326C98FC56971dfCD9A` | `0xbc242f5093768aa93572c8496fa881527bd1bbb323867dd5f420727783b4eead` |
|  2 | swap | cross_chain_bridge | `LiFiBridgeAggregator` | `0x1291be112d480055dafd8a610b7d1e203891c274` | `0xe01bcae5c6f2b7cec9d50a7134a8ab35ac3cf8d770115e10a2662093abeb4988` |
|  3 | perps | trading_fee | `PerpUBIFeeSplitter` | `_(pending deploy)_` | `0xe51ed7f1055ec8295a7c4d3aa7e1e9c405571a96ec82a20f8bfec8c5301dae32` |
|  4 | perps | funding_fee | `PerpUBIFeeSplitter` | `_(pending deploy)_` | `0x85da25fdd17804a960fc18d208d012780f3a5be91b204774c8a1a95e0f7c04d6` |
|  5 | perps | liquidation_fee | `PerpUBIFeeSplitter` | `_(pending deploy)_` | `0x08acc47cf71c89e6c22b1d4d5f8ff4534597e3fd3ce984a7c416ffe5cad62d5b` |
|  6 | predict | market_creation_fee | `PredictUBIFeeSplitter` | `_(pending deploy)_` | `0xf8f449ed6ff79644d8e4e873d43862bed27d3d68aca8a0b36c94de61645df71f` |
|  7 | predict | resolver_fee | `OptimisticResolver` ⏳ | `_(pending deploy)_` | `0xd915a7fdfe33fe83973299cbc2c22a3b4f9f820e9922ba44a2ef4ebb2eb51390` |
|  8 | lend | reserve_factor | `GoodLendPool` | `0xcbeaf3bde82155f56486fb5a1072cb8baaf547cc` | `0x4a9f0bc4fa7e0e0d70aba96482e6e4dadf15298daff23a34b937566acd51b393` |
|  9 | stable | stability_fee | `VaultManager` | `0x3489745eff9525ccc3d8c648102fe2cf3485e228` | `0x156e588d1067ba3c8a6a7f4376ef70794f8afed114dc9d1421e054b65743e630` |
| 10 | stable | minting_fee | `PegStabilityModule` | `0x9eb52339b52e71b1efd5537947e75d23b3a7719b` | `0xc91682597e50d783bf81329b763263cef72b0cda71f5e617e0bd4b4150f84403` |
| 11 | stable | liquidation_penalty | `StableUBIFeeSplitter` ⏳ | `_(pending deploy)_` | `0x5e8b853c1e291ab51168b5ab87544a6ab0e724af5f0b9b8ecad3b5c3c4e16f1a` |
| 12 | stable | governance_fee | `StableUBIFeeSplitter` ⏳ | `_(pending deploy)_` | `0xa6a71206c08a4d3d7b84324b1bdb50b29b4e4aa6637cabafcc3b459161442b74` |
| 13 | stocks | trading_fee | `StocksUBIFeeSplitter` | `_(pending deploy)_` | `0x5503d47cba7f0b1b3a1343b3831327875fe679575c535fdad0642a7e97973f65` |
| 14 | stocks | liquidation_remnant | `StocksUBIFeeSplitter` | `_(pending deploy)_` | `0xf8f449ed6ff79644d8e4e873d43862bed27d3d68aca8a0b36c94de61645df71f` |

A ⏳ marker means the route's source contract is in
`docs/UBI-FEE-ACCOUNTING.md` §4 but not yet in
`op-stack/addresses.json` — i.e. **pending deploy**. SQL queries for
these routes are still emitted (with a `PENDING DEPLOY` banner) so
that vendors can enable them with one address edit once the splitter
ships.

### 3.2 Specialised splitters pending deploy

- `OptimisticResolver`
- `PerpUBIFeeSplitter`
- `PredictUBIFeeSplitter`
- `StableUBIFeeSplitter`
- `StocksUBIFeeSplitter`

### 3.3 Routes pending deploy (event-contract level)

- Route **7** (predict/resolver_fee) — event contract `OptimisticResolver` not yet deployed. Topic0 is canonical (`0xd915a7fdfe33fe83973299cbc2c22a3b4f9f820e9922ba44a2ef4ebb2eb51390`); enable `contract_address` filter once deployed.
- Route **11** (stable/liquidation_penalty) — event contract `StableUBIFeeSplitter` not yet deployed. Topic0 is canonical (`0x5e8b853c1e291ab51168b5ab87544a6ab0e724af5f0b9b8ecad3b5c3c4e16f1a`); enable `contract_address` filter once deployed.
- Route **12** (stable/governance_fee) — event contract `StableUBIFeeSplitter` not yet deployed. Topic0 is canonical (`0xa6a71206c08a4d3d7b84324b1bdb50b29b4e4aa6637cabafcc3b459161442b74`); enable `contract_address` filter once deployed.

## 4. Query pack

Twelve canonical Dune-style queries live under
[`queries/`](./queries/). They use `{{blockchain}}.logs`,
`{{blockchain}}.transactions`, and `{{blockchain}}.blocks`
(replace `{{blockchain}}` with the indexer's chain prefix). Each
file's header lists the fee-route ids it covers and the `topic0` it
filters on, and includes a "DO NOT EDIT BY HAND" banner.

| File | Title | Routes covered |
| ---- | ----- | -------------- |
| `00_chain_health.sql` | Chain health — block & tx volume, 7-day rolling window | _(chain-wide)_ |
| `01_ubi_fees_total.sql` | Total UBI fee events — union of all 14 routes | all 14 routes |
| `02_ubi_fees_by_protocol.sql` | UBI fee events grouped by protocol | all 14 routes |
| `03_ubi_fees_daily.sql` | Daily UBI fee event curve — 90-day rolling window | all 14 routes |
| `04_swap_volume_by_pool.sql` | Swap (V4) — UBIFeeHook events grouped by pool | 1 |
| `05_perps_trading_fees.sql` | Perps — trading + funding + liquidation fee events | 3, 4, 5 |
| `06_predict_resolution_fees.sql` | Predict — market creation + resolver fee events | 6, 7 |
| `07_lend_treasury_mint.sql` | Lend — TreasuryMint reserve-factor events | 8 |
| `08_stable_vault_fees.sql` | Stable — VaultManager + PegStabilityModule + StableUBIFeeSplitter | 9, 10, 11, 12 |
| `09_stocks_trading_fees.sql` | Stocks — synthetic-stock trading + liquidation fee events | 13, 14 |
| `10_top_ubi_payers.sql` | Top 100 wallets by count of UBI-emitting transactions | all 14 routes |
| `11_protocol_activity_30d.sql` | UBI-emitting event count per protocol, rolling 30 days | all 14 routes |

Raw-table queries always work. Decoded-amount columns are commented
out as `bytea2numeric(substr(data, ...))` until the vendor publishes
decoded tables.

## 5. Regeneration

```bash
# Rebuild from analytics/address-book.json
python scripts/build-dune-package.py --output analytics/dune-package

# Drift check (used by iter 30's gate)
python scripts/build-dune-package.py --output analytics/dune-package --check

# Stable-timestamp build (for tests / diffs)
python scripts/build-dune-package.py --output analytics/dune-package --no-timestamp
```

`.generated-from` records the SHA-256 of the address book this package
was derived from. If the file disagrees with
`shasum -a 256 analytics/address-book.json`, the package is stale.

## 6. Tests

```bash
pytest scripts/test_build_dune_package.py -v
```

Covers: manifest invariants, `topic0` ↔ address-book parity, SQL header
metadata, PENDING DEPLOY markers, `.generated-from` hash, deterministic
round-trip, and `--check` mode against the committed artefacts.

## 7. Asking us to index your indexer

- **Repo**     : <https://github.com/GoodDollar/gooddollar-l2>
- **Contact**  : <ops@gooddollar.org>
- **Docs**     : <https://goodswap.goodclaw.org/testnet-guide>
- **dApp**     : <https://goodswap.goodclaw.org>
- **Explorer** : <https://explorer.goodclaw.org>
- **RPC**      : <https://rpc.goodclaw.org>

We're happy to spin up an archive node, ship a chain-spec PR, or pair on
decoder onboarding.
