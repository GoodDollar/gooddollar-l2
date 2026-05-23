# 0007g/0003 — Health-Contract Classification Proof

_Captured by task `0003-classify-oracle-and-hedge-in-health-contract`._

## Setup

- Synthetic `/api/status` fixture:
  `.autobuilder/initiatives/0007g-testnet-setup/proof/fake-status-server.js`
  on `http://127.0.0.1:49207` with profile `oracle-hedge-health-only`
  (REQUIRED services all `ok`; iter-4 / iter-6 exclusions in their typical
  degraded states; `oracle-signer` reports `health-only`; `hedge-engine`
  reports `ok` to exercise the `EXCLUDED-but-ok` branch).
- Public RPC override: `PUBLIC_RPC=http://127.0.0.1:49208` (no listener;
  the public-RPC blocker is non-applicable in the synthetic harness — the
  per-service classification rows are the proof target).
- Gate: `scripts/testnet/health-gate.sh` (unchanged in this task).

## BEFORE — original `HEALTH-CONTRACT.md`

Run with a synthetic copy of the contract that omits `oracle-signer` and
`hedge-engine`:

```
PUBLIC_BASE=http://127.0.0.1:49207 \
PUBLIC_RPC=http://127.0.0.1:49208 \
HEALTH_CONTRACT=/tmp/HEALTH-CONTRACT-before.md \
REPORT=/tmp/iter03-before.md \
./scripts/testnet/health-gate.sh
```

Relevant per-service rows from `/tmp/iter03-before.md`:

| service          | status        | classification     |
|------------------|---------------|--------------------|
| `oracle-signer`  | `health-only` | ⚠️ UNCLASSIFIED |
| `hedge-engine`   | `ok`          | ⚠️ UNCLASSIFIED |

Gate warnings:

```
⚠️  service oracle-signer is not in REQUIRED or EXCLUDED — classify it in HEALTH-CONTRACT.md
⚠️  service hedge-engine is not in REQUIRED or EXCLUDED — classify it in HEALTH-CONTRACT.md
```

## AFTER — `HEALTH-CONTRACT.md` updated by this task

Run with the committed contract:

```
PUBLIC_BASE=http://127.0.0.1:49207 \
PUBLIC_RPC=http://127.0.0.1:49208 \
REPORT=/tmp/iter03-after.md \
./scripts/testnet/health-gate.sh
```

Relevant per-service rows from `/tmp/iter03-after.md`:

| service          | status        | classification          |
|------------------|---------------|-------------------------|
| `oracle-signer`  | `health-only` | ⚠️ EXCLUDED         |
| `hedge-engine`   | `ok`          | 🟢 EXCLUDED-but-ok      |

Gate console (relevant lines):

```
⚠️  excluded service oracle-signer is health-only
(no warning emitted for hedge-engine — EXCLUDED-but-ok)
```

The `UNCLASSIFIED` warnings disappear and both services move into the
documented-exclusions branch, matching the contract update.

## Notes

- `health-gate.sh` was **not** modified — verified by running the same
  binary against both contract states with `HEALTH_CONTRACT` env override.
- The public-RPC + addresses.json probes still emit unrelated noise in the
  synthetic harness (no listener on 49208); they are not part of the proof
  target. Both BEFORE and AFTER reports show the same RPC blocker, so the
  delta is entirely on the per-service classification rows.
- Promotion to public/shareable testnet requires moving `oracle-signer`
  and `hedge-engine` out of the exclusion table into REQUIRED — the
  contract's "Promotion to release candidate" section now spells this out
  alongside the existing iter-4 / iter-6 exclusions.
