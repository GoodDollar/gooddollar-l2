# Analytics Address Book

`address-book.json` is the **single machine-readable artifact** that
downstream analytics consumers should depend on:

- Iteration 27 — internal analytics dashboard
- Iteration 28 — Dune SQL package
- Iteration 29 — public testnet TX gallery
- Iteration 30 — README / doc-index checkpoint 6

It is generated **offline** from repository files only:

| Source                              | Contents                                  |
| ----------------------------------- | ----------------------------------------- |
| `op-stack/addresses.json`           | Canonical chain ID + contract addresses   |
| `docs/UBI-FEE-ACCOUNTING.md` §4     | The 14 UBI fee routes                     |
| `out/<Name>.sol/<Name>.json`        | Forge ABIs (events + selected functions)  |

`event_topic0` for every event is computed in-process as
`keccak256(event_signature)`. No RPC calls. No `forge build`. No network.

## Regenerate

```bash
python3 scripts/build-analytics-address-book.py \
    --output analytics/address-book.json
```

## Verify (used by iter 30's gate)

```bash
python3 scripts/build-analytics-address-book.py \
    --output analytics/address-book.json --check
```

`--check` regenerates in memory, normalises the `generated_at` field, and
exits non-zero on any diff.

## Test

```bash
pytest scripts/test_build_analytics_address_book.py -v
```

20 tests covering: structural shape, address resolution against
`op-stack/addresses.json`, all 14 fee routes, `event_topic0`
recomputed by an *independent* keccak backend (`eth_utils` vs
`pycryptodome`), pending-splitter accounting, ABI event signatures,
deterministic round-trip, and doc-parser ↔ fallback parity.

## Schema (v1)

```jsonc
{
  "version": "1",
  "generated_at": "<ISO-8601 UTC>",
  "generator": "scripts/build-analytics-address-book.py",
  "chain": { "id": 42069, "name": "...", "rpc_url": "...", "explorer_url": "..." },
  "sources": { "addresses": "...", "fee_routes": "...", "abis": "..." },
  "protocols": {
    "swap"|"perps"|"predict"|"lend"|"stable"|"stocks"|"ubi_core"|"infrastructure"|"deprecated": {
      "label": "GoodSwap" /* etc */,
      "contracts": [{ "name": "...", "address": "0x..." }]
    }
  },
  "fee_routes": [
    {
      "id": 1,
      "protocol": "swap" /* | perps | predict | lend | stable | stocks */,
      "kind": "v4_hook" /* taxonomy from UBI-FEE-ACCOUNTING.md §4 */,
      "label": "Human-readable description",
      "source_contract": "UBIFeeHook",
      "source_address": "0x..." | null,
      "source_address_pending_deploy": false,
      "fee_token": "swap_output" /* free-form */,
      "sink_contract": "GoodDollarToken",
      "sink_address": "0x..." | null,
      "sink_address_fallback": null | { "contract": "UBIFeeSplitter", "address": "0x..." },
      "sink_method": "fundUBIPool",
      "event_contract": "UBIFeeHook",
      "event_contract_address": "0x..." | null,
      "event_contract_deployed": true,
      "event_signature": "UBIFeeCollected(address,uint256,uint256,address)",
      "event_topic0": "0x<32-byte hex>"
    }
  ],
  "abis": {
    "<ContractName>": {
      "path": "out/<Name>.sol/<Name>.json",
      "compiled_at": "<ISO-8601 UTC>" | null,
      "events":    [{ "name", "signature", "topic0", "anonymous", "inputs": [{name, type, indexed}] }],
      "functions": [{ "name", "inputs", "outputs", "stateMutability" }]
    }
  },
  "notes": {
    "specialised_splitters_pending": ["PerpUBIFeeSplitter", "..."],
    "unknown_contracts": [],
    "missing_abis": ["MockUSDC", "..."],
    "ubi_split_doc": "docs/UBI-FEE-ACCOUNTING.md",
    "fee_split_bps": { "ubi": 2000, "protocol": 8000 },
    "ubi_breakdown_doc": {
      "human_ubi_pool_bps": 1667,
      "g_dollar_treasury_bps": 6333,
      "validator_rewards_bps": 2000
    }
  }
}
```

## Pending state (iter 26 reality)

Five UBI fee splitters are documented in `docs/UBI-FEE-ACCOUNTING.md` but
not yet deployed in `op-stack/addresses.json`:

- `OptimisticResolver`
- `PerpUBIFeeSplitter`
- `PredictUBIFeeSplitter`
- `StableUBIFeeSplitter`
- `StocksUBIFeeSplitter`

For routes whose source or sink lands on one of these, the artifact:

1. Sets the relevant `*_address` to `null`
2. Sets `source_address_pending_deploy: true` (where applicable)
3. Sets `sink_address_fallback` to the deployed base `UBIFeeSplitter`
   so consumers can still trace the on-chain landing today
4. Lists the contract in `notes.specialised_splitters_pending`

This satisfies testnet-readiness Non-Negotiable #8 (do not hide degraded
services). Iter 30's gate is expected to read this array and surface the
deployment gap.
