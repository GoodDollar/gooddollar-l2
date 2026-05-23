# Lane-7 Internal Smoke — Malformed-URL FATAL Proof (task 0007g/0006)

_Captured 2026-05-23. Source script:
`scripts/testnet/internal-smoke.sh`. Driver:
`.autobuilder/initiatives/0007g-testnet-setup/proof/run-malformed-url.sh`._

The smoke now validates every probe URL against
`^https?://[^:/]+(:[0-9]+)?(/.*)?$` immediately after the default
assignments. Any URL that fails the regex makes the smoke exit 2
with a `FATAL: malformed probe URL — check LANE7_BASE / *_PORT /
*_URL overrides` line on stderr plus one `FATAL: <NAME>=<value>`
line per offending URL.

Previously the script naively concatenated `$LANE7_BASE:$PORT/path`,
so any `LANE7_BASE` value that already included a port
(`http://127.0.0.1:9999`) produced a syntactically invalid
double-colon URL and emitted four bogus `BLOCKER: <svc> unreachable`
lines. The operator chased a non-existent service outage; the real
problem was the env override.

## Driver output

```
--- case: A: LANE7_BASE=http://127.0.0.1:9999 (double colon in defaults) ---
exit code: 2
stderr:
FATAL: malformed probe URL — check LANE7_BASE / *_PORT / *_URL overrides
FATAL: PRICE_SERVICE_URL=http://127.0.0.1:9999:4000/health
FATAL: ORACLE_SIGNER_URL=http://127.0.0.1:9999:9107/health
FATAL: HEDGE_ENGINE_URL=http://127.0.0.1:9999:9106/health
FATAL: STATUS_AGGREGATOR_URL=http://127.0.0.1:9999:9200/status.json
PASS

--- case: B: partial override (3 still bad) ---
exit code: 2
stderr:
FATAL: malformed probe URL — check LANE7_BASE / *_PORT / *_URL overrides
FATAL: ORACLE_SIGNER_URL=http://127.0.0.1:9999:9107/health
FATAL: HEDGE_ENGINE_URL=http://127.0.0.1:9999:9106/health
FATAL: STATUS_AGGREGATOR_URL=http://127.0.0.1:9999:9200/status.json
PASS

--- case: C: explicit *_URL envs (preflight should accept) ---
exit code: 1
PASS (preflight accepted; downstream rc=1)
```

Case A reproduces the original bug shape (exit 2 / FATAL instead of
the bogus BLOCKER lines). Case B confirms a single `*_URL` override
still triggers FATAL on the remaining defaults — partial overrides
do not paper over malformed neighbours. Case C confirms the escape
hatch: explicit `*_URL` envs that resolve to valid URLs pass
preflight and the smoke proceeds to its normal probe loop.

## No-regression check

- Default-path green proof against the `lane7-smoke-green` harness
  profile is unchanged (verdict `GREEN-with-warnings`, exit 0).
- The previous `iter05-internal-smoke-red.md` capture used
  `LANE7_BASE=http://127.0.0.1:1` — a synthetic recipe that the new
  preflight (correctly) rejects, because it is the very malformed-URL
  bug this task fixes. The artifact has been re-captured with the
  equivalent recipe `LANE7_BASE=http://127.0.0.1` +
  `*_PORT=49901..49904` (valid URLs pointing at unbound ports), which
  produces the same four `unreachable` blockers + skipped on-chain
  freshness warning. The verdict shape (RED / exit 1 / 4 blockers / 1
  warning) is preserved.

## Pointers

- Smoke script: [`scripts/testnet/internal-smoke.sh`](../../../scripts/testnet/internal-smoke.sh)
- Driver: [`proof/run-malformed-url.sh`](./proof/run-malformed-url.sh)
- Runbook section: [`docs/testnet/INTERNAL-TESTNET-RUNBOOK.md`](../../../docs/testnet/INTERNAL-TESTNET-RUNBOOK.md) (Smoke → "Smoke env contract")
- Refreshed RED capture: [`iter05-internal-smoke-red.md`](./iter05-internal-smoke-red.md)
- PRD: [`tasks/0006-smoke-malformed-url-when-lane7-base-has-port.md`](./tasks/0006-smoke-malformed-url-when-lane7-base-has-port.md)
