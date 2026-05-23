# 0007g/0004 — Cherry-Pick Batch 1 (lane1 + lane6)

_Captured by task `0004-cherry-pick-clean-lane-heads-batch1`._

## Starting state

- Lane-7 branch: `ab/0007-lane7-testnet-setup`
- Starting SHA: `198573cc` (`0007g/0003: classify oracle-signer and hedge-engine as testnet exclusions`)
- Working tree: clean.

## Lane 1 — `git cherry-pick -x 6b99f069`

### Command

```bash
git cherry-pick -x 6b99f069
```

### Conflicts

| file                                  | type             | resolution                                                                                                                                                                    |
|---------------------------------------|------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `backend/README.md`                   | content          | Lane 1's parent had `(see Lane 1 section)` suffixes on the hedge-engine and oracle-signer rows pointing at a `## Lane 1` section that does not exist on lane-7 HEAD. Resolution: keep our (lane-7) row wording, insert lane-1's new `price-service` row between them, drop the dangling section refs. Also accepted lane-1's removal of `price-service/` from the "Additional packages" line. |
| `scripts/test-lane1-backend.sh`       | modify/delete    | Script created by an earlier non-cherry-picked lane-1 commit (`49324d7f`). The head commit modifies it to invoke `scripts/check-pm2-ecosystem.js`. Resolution: accept lane-1's incoming version as a new file — it is a small lane-1 package test runner that pairs naturally with the new price-service registration. |

### Post-pick verification

`node scripts/check-pm2-ecosystem.js` (the smoke check added by the
lane-1 head commit itself):

```
[check-pm2-ecosystem] ok — lane-1 PM2 entries present: price-service, oracle-signer, hedge-engine
```

`node -e "console.log(require('./backend/ecosystem.config.js').apps.map(a=>a.name).sort())"`:

```
[ 'activity-reporter', 'bridge-keeper', 'goodswap', 'harvest-keeper',
  'hedge-engine', 'indexer', 'liquidator', 'monitor', 'oracle-signer',
  'price-service', 'revenue-tracker', 'rpc-balancer',
  'status-aggregator', 'stocks-keeper', 'swap-oracle' ]
```

`backend/price-service/`'s jest test runner (`npm test`) was **not** run
on this host — `backend/price-service/node_modules` is empty and the
task notes explicitly forbid `npm install` on the testnet host during
this iteration. The lane-1 head's PM2 smoke is the targeted verification
the cherry-picked code provides; the full jest suite is deferred to
task 0005's smoke if it runs against a host that has lane-1 deps
installed.

### Real-trading fence audit

The cherry-picked entry sets `ETORO_MODE: pick('ETORO_MODE', 'mock')`
(safer than `demo-readonly` — no eToro traffic at all) but did **not**
set `REAL_TRADING_ENABLED`. Per task acceptance #6, follow-up commit
`7546407a` adds `REAL_TRADING_ENABLED: pick('REAL_TRADING_ENABLED','false')`
on the new entry.

```
node -e "const c=require('./backend/ecosystem.config.js'); const ps=c.apps.find(a=>a.name==='price-service'); console.log('ETORO_MODE=',ps.env.ETORO_MODE,'REAL_TRADING_ENABLED=',ps.env.REAL_TRADING_ENABLED);"
ETORO_MODE= mock  REAL_TRADING_ENABLED= false
```

### Resulting SHA after lane 1 + fence follow-up

- `fe052724` — `0007g/0004: cherry-pick lane1 6b99f069 — register price-service in ecosystem.config.js`
- `7546407a` — `0007g/0004: ensure REAL_TRADING_ENABLED=false default for price-service entry`

## Lane 6 — `git cherry-pick -x de7a4b44`

### Command

```bash
git cherry-pick -x de7a4b44
```

### Conflicts

| file                                                                       | type             | resolution                                                                                                                                                                                                                                                                                                                                  |
|----------------------------------------------------------------------------|------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `frontend/src/components/proof/PipelineFlowDiagram.tsx`                    | modify/delete    | Component created by an earlier non-cherry-picked lane-6 commit. Resolution: accept lane-6 incoming version as new file.                                                                                                                                                                                                                    |
| `frontend/src/components/proof/__tests__/PipelineFlowDiagram.test.tsx`     | modify/delete    | Test created by an earlier non-cherry-picked lane-6 commit. Resolution: accept lane-6 incoming version as new file.                                                                                                                                                                                                                         |
| `frontend/src/lib/sanitiseClientError.ts` (transitive)                     | missing on HEAD  | The cherry-picked component imports `sanitiseClientError` from this file. The helper was created by lane-6 commit `f2ec1afc` and never modified afterward (39 lines, pure utility). Resolution: copied the lane-6 head blob into the cherry-pick alongside the two component files so the new code actually compiles on the lane-7 branch. |

### Post-pick verification

Frontend deps are not installed on the testnet host
(`frontend/node_modules/.bin/vitest` is missing) and the task notes
explicitly forbid `npm install` here. Targeted vitest run is therefore
deferred to a follow-up pass on a host with frontend deps:

```bash
cd frontend && npx vitest run components/proof/PipelineFlowDiagram
```

What we verified instead:
- `frontend/src/components/proof/PipelineFlowDiagram.tsx` (278 lines)
  imports resolve on lane-7 HEAD: `@/lib/chain` (CONTRACTS),
  `@/lib/abi` (PriceOracleABI), `@/lib/sanitiseClientError` (now
  pulled in), `@/lib/stockData` (getAllTickers).
- `frontend/src/components/proof/__tests__/PipelineFlowDiagram.test.tsx`
  (317 lines) imports the component above and standard vitest /
  testing-library / wagmi modules — all available in
  `frontend/package.json` `dependencies` / `devDependencies`.

### Resulting SHA after lane 6

- `04be6915` — `0007g/0004: cherry-pick lane6 de7a4b44 — cover pipeline flow diagram state colors`

## Final SHA

- Final lane-7 HEAD: `04be6915`
- Cherry-pick provenance preserved: every commit carries
  `(cherry picked from commit <sha>)`.

## Production safety

- No `pm2 reload` / `pm2 restart` / `pm2 start` was issued during this
  task — the new `price-service` entry exists in the file but is not
  applied to a running daemon by lane-7. Lane-local startup is the
  responsibility of task 0005 (lane-7 worktree only, `-lane7` PM2
  names, 49xxx port range).
- `REAL_TRADING_ENABLED=false` and `ETORO_MODE=mock` defaults are now
  in the file. Operators must explicitly opt out of both fences via the
  host environment before any real eToro execution can occur.
- `git push` was not run.

## Deferred work

- Lane-2 / lane-3 BLOCKED on dirty failing tests (see
  `integration-plan.md`).
- Lane-4 / lane-5 deferred to **batch 2** pending build-artifact cleanup
  (`frontend/.next.runtime-dev/**`) and `HedgeStatusCard.tsx` 1k-line
  decomposition.
- Full price-service jest suite + frontend vitest pass remain pending
  on a host with deps installed; those gates are appropriate for
  task 0005's smoke verification, not this cherry-pick.
