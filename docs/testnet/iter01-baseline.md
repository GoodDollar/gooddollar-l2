# Iter 1 — Testnet Readiness Baseline Inventory

- Timestamp (UTC): 2026-05-17T13:39:25Z
- Commit SHA: `1e29254`
- Public base: https://goodswap.goodclaw.org
- Public RPC: https://rpc.goodclaw.org

> Pure inventory iteration. No services or addresses were changed.

## 1. GIT STATUS

```text
$ git -C /home/goodclaw/gooddollar-l2 status --short
 M .autobuilder/initiatives/0004-testnet-readiness-gate/tasks/0001-testnet-readiness-gate-root.md
 M docs/TESTNET-READINESS-50-ITERATIONS.md
?? docs/testnet/
?? scripts/testnet/
(exit 0)
```

```text
$ git -C /home/goodclaw/gooddollar-l2 branch --show-current
main
(exit 0)
```

```text
$ git -C /home/goodclaw/gooddollar-l2 log -3 --oneline
1e29254 chore: seed testnet readiness gate
ffc6eae chore: iteration #28 surface-sweep — E2E gate green, no new issues
a4f2f31 Update task plans and skills
(exit 0)
```

## 2. PM2 STATUS

| name | pid | status | restarts | uptime_s |
|---|---:|---|---:|---:|
| harvest-keeper | 2117169 | waiting restart | 1418827 | 4 |
| swap-oracle | 1463989 | online | 1215427 | 20614 |
| revenue-tracker | 2117217 | waiting restart | 1191599 | 2 |
| bridge-keeper | 1463914 | online | 7412 | 20614 |
| goodswap | 2067770 | online | 4406 | 1876 |
| activity-reporter | 2117091 | waiting restart | 1383 | 9 |
| goodagent-tori-prototype | 1176106 | online | 8 | 29920 |
| monitor | 1463965 | online | 6 | 20614 |
| liquidator | 1463945 | online | 5 | 20614 |
| stocks-keeper | 1463913 | online | 5 | 20614 |
| indexer | 1463939 | online | 4 | 20614 |
| rpc-balancer | 1463971 | online | 4 | 20614 |
| status-aggregator | 1474411 | online | 4 | 20315 |
| goodagent-prototype | 1176107 | online | 1 | 29920 |
| goodwallet-v2 | 1176118 | online | 1 | 29920 |
| antseed-buyer | 459837 | online | 0 | 53997 |
| audit-dashboard | 1642 | online | 0 | 564092 |
| goodperps | 1466633 | online | 0 | 20543 |
| goodpredict | 1600 | online | 0 | 564092 |
| paperclip | 1639 | online | 0 | 564092 |
| pm2-logrotate | 1541 | online | 0 | 564093 |

## 3. PORT 3100 OWNERSHIP

```text
$ bash -c ss -ltnp 2>/dev/null | awk 'NR==1 || /:3100 /'
State  Recv-Q Send-Q Local Address:Port  Peer Address:PortProcess                                       
LISTEN 0      511                *:3100             *:*    users:(("next-server (v1",pid=2067784,fd=21))
(exit 0)
```

## 4. PUBLIC PAGES

| Path | HTTP |
|---|---|
| `/` | 200 |
| `/faucet` | 200 |
| `/perps` | 200 |
| `/portfolio` | 200 |
| `/tests` | 200 |
| `/testnet-guide` | 200 |

## 5. /api/status HEALTH

```json
{"overall":"degraded","healthy":8,"total":12,"aggregatorUptime":20314,"timestamp":"2026-05-17T13:39:25.829Z","services":[{"name":"swap-oracle","status":"ok","latencyMs":13,"uptime":20609,"chainBlock":161694,"lastChecked":"2026-05-17T13:39:21.471Z"},{"name":"activity-reporter","status":"unreachable","latencyMs":2,"error":"fetch failed","lastChecked":"2026-05-17T13:39:21.460Z"},{"name":"harvest-keeper","status":"unreachable","latencyMs":2,"error":"fetch failed","lastChecked":"2026-05-17T13:39:21.460Z"},{"name":"liquidator","status":"ok","latencyMs":2,"uptime":20610,"lastChecked":"2026-05-17T13:39:21.461Z"},{"name":"revenue-tracker","status":"unreachable","latencyMs":2,"error":"fetch failed","lastChecked":"2026-05-17T13:39:21.460Z"},{"name":"stocks-keeper","status":"ok","latencyMs":13,"uptime":20610,"chainBlock":161694,"lastChecked":"2026-05-17T13:39:21.472Z"},{"name":"indexer","status":"error","latencyMs":3,"uptime":20610.200913519,"error":"unhealthy","lastChecked":"2026-05-17T13:39:21.462Z"},{"name":"monitor","status":"degraded","latencyMs":3,"uptime":20610.076764594,"lastChecked":"2026-05-17T13:39:21.462Z"},{"name":"rpc-balancer","status":"ok","latencyMs":3,"lastChecked":"2026-05-17T13:39:21.462Z"},{"name":"bridge-keeper","status":"ok","latencyMs":3,"lastChecked":"2026-05-17T13:39:21.462Z"},{"name":"perps","status":"ok","latencyMs":3,"uptime":20538.600537424,"lastChecked":"2026-05-17T13:39:21.462Z"},{"name":"predict","status":"ok","latencyMs":3,"uptime":564088.418064025,"lastChecked":"2026-05-17T13:39:21.463Z"}]}
```

## 6. CHAIN BLOCK

- Public RPC (`https://rpc.goodclaw.org`): `{"jsonrpc":"2.0","id":1,"result":"0x277a0"}`
- Local RPC (`http://127.0.0.1:8545`): `{"jsonrpc":"2.0","id":1,"result":"0x277a0"}`

## 7. DOC INVENTORY

| File | Lines | Exists |
|---|---:|:---:|
| `README.md` | 146 | YES |
| `docs/TESTNET_README.md` | 80 | YES |
| `docs/ARCHITECTURE.md` | 137 | YES |
| `docs/TESTNET-READINESS-50-ITERATIONS.md` | 103 | YES |
| `op-stack/addresses.json` | 46 | YES |

## 8. FINDINGS

Flagged from the probes above (verify against `pm2 jlist` and `/api/status`):

- **`activity-reporter`, `harvest-keeper`, `revenue-tracker`** — known to flap
  with >1000 restarts and `unreachable` in `/api/status`. Iter 4 owns the fix.
- **`indexer: error`, `monitor: degraded`** in `/api/status`. Iter 6 owns the fix.
- **`goodswap` PM2 entry** — high restart count observed in earlier probes.
  Iter 3 (PM2/process hygiene) must confirm PM2 owns port 3100 cleanly and
  there is no stray `next dev`.
- **`/api/status` overall = `degraded`** (8/12 healthy) — driven by the
  unreachable + error/degraded services above. Iter 2 (health contract)
  decides what should actually gate the testnet.
- **Doc gap** — `README.md` does not yet link
  `docs/TESTNET-READINESS-50-ITERATIONS.md` or this baseline. Iter 5 doc
  checkpoint owns it.

## 9. NEXT ITERATION

Concrete follow-ups for iter 2 (health contract for testnet):

1. Define the canonical green-set in `scripts/testnet-health-gate.sh`:
   - MUST be green: `goodswap`, public RPC, `/api/status` reachable, chain
     block advancing.
   - Documented exclusions until fixed: `activity-reporter`,
     `harvest-keeper`, `revenue-tracker`, `indexer`, `monitor`.
2. Gate must fail loudly on true blockers and exit 0 on documented exclusions.
3. Output of gate becomes the iter 2 proof.

Sequencing reminder (from the 50-iter plan):
iter 3 → PM2 hygiene · iter 4 → repair degraded I · iter 5 → README/doc checkpoint 1.
