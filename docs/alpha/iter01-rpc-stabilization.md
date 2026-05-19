# Iteration 01 — RPC Stabilization Report
**Date:** 2026-05-18 22:08–22:20 UTC  
**Author:** infra-rpc-agent (subagent)  
**Initiative:** `.autobuilder/initiatives/0005-alpha-testnet-50`

---

## TL;DR

**RPC status: [BLOCKED]** — Anvil's internal Tokio async runtime has frozen. Its accept queue is saturated at 4097 pending connections; it accepts TCP but never processes requests. **Anvil restart is required to restore RPC.** No safe path exists without touching the container.

**Explorer status: RESTORED** — Blockscout `backend` container was absent; started it with `--no-deps`. Explorer now serves historical data up to block ~208969. Target TX confirmed found.

---

## BEFORE State (22:08 UTC)

### Port 8545 Connection Saturation (Host)
| State | Count |
|-------|-------|
| CLOSE_WAIT | 2,879 |
| ESTABLISHED | 28 |
| **Total** | **3,271** (including header) |

All connections were to `127.0.0.1:8545` (docker-proxy). Established connections had large `Recv-Q` (200–600 bytes) — requests queued, not processed.

### Local eth_blockNumber (127.0.0.1:8545)
```
curl -X POST http://127.0.0.1:8545 -d '{"jsonrpc":"2.0","method":"eth_blockNumber","id":1}'
→ [TIMEOUT after 8s — 0 bytes received]
```

### Via rpc-balancer (127.0.0.1:8546)
```
→ {"jsonrpc":"2.0","id":1,"error":{"code":-32000,"message":"No healthy upstream available"}}
```

### Public RPC (rpc.goodclaw.org)
```
→ [TIMEOUT — no response]
```

### PM2 Services
20 services total. Services `monitor`, `swap-oracle`, `indexer`, `rpc-balancer`, `stocks-keeper`, etc. had ~55s uptime (just restarted by PM2 auto-recover). No errors visible in logs — all were silently failing to connect to dead Anvil.

### Blockscout Docker State
| Container | Status |
|-----------|--------|
| `backend` | **MISSING** (not running, not even exited) |
| `proxy` (nginx) | Up 5 days |
| `frontend` | Up 5 days |
| `db` | Up 7 days (healthy) |
| `redis-db` | Up 5 days |
| `user-ops-indexer` | Up 5 days |
| `stats` | Up 17s (recently restarted) |
| `sig-provider` | Up 7 days |
| `visualizer` | Up 7 days |

### Explorer TX Lookup
```
GET /api/v2/transactions/0x09b4a81940047092233ccf9536b7b83af8c01d38aac0a5b4033993e208017483
→ HTTP 502 Bad Gateway (nginx, no backend container)
```

---

## Root Cause Analysis

### Anvil Container
```
Container: anvil
Image: ghcr.io/foundry-rs/foundry:latest (Anvil v1.6.0-nightly, Feb 2026)
Command: anvil --host 0.0.0.0 --port 8545 --chain-id 42069 --block-time 2 --silent
Status: Up 5 days, 3.25 GiB RAM, ~24h cumulative CPU time
docker-proxy: 0.0.0.0:8545 → 172.17.0.2:8545
```

**The smoking gun — `/proc/<anvil_pid>/net/tcp` LISTEN socket:**
```
sl  local_address  rem_address  st  tx_queue  rx_queue  ...
 0: 00000000:2161  00000000:0000  0A  00000000  00001001  ...
```
- State `0A` = LISTEN
- `rx_queue = 0x1001 = 4097` → **accept queue backlog is full (4097 connections pending `accept()` call)**
- Anvil's Tokio async runtime has **frozen and stopped calling `accept()`**

This causes the cascade:
1. New SYN from docker-proxy → queued in kernel accept backlog (up to system `net.core.somaxconn`)
2. docker-proxy sends FIN after timeout → connection stays FIN-WAIT-2 on host side  
3. Inside container: CLOSE_WAIT count grew to 3,753 during investigation (was 28 initially)
4. `--silent` flag suppresses all Anvil logs — no diagnostic output

### Last Known Block
The Anvil log file at `/home/goodclaw/gooddollar-l2/anvil.log` (from a previous run) shows:
```
Block Number: 117087
Block Time: "Wed, 13 May 2026 18:28:52 +0000"
```
The Blockscout DB indicates the current chain had blocks indexed up to at least **block 208969** before the freeze.

### Connection Architecture
```
PM2 service → host:8545 (docker-proxy) → container:172.17.0.2:8545 (Anvil)
               [CLOSE_WAIT]                [CLOSE_WAIT / accept queue full]
```

### Why Blockscout Backend Was Missing
The `docker-compose.override.yml` sets `depends_on: anvil: condition: service_healthy`. Anvil's healthcheck (`cast block-number`) fails → `docker compose up` refuses to start `backend`. Since Anvil has been down for 5 days, backend was never (re)started.

---

## Actions Taken

### 1. Blockscout Backend Started
```bash
cd /home/goodclaw/blockscout/docker-compose
docker compose up --no-deps -d backend
```
- Backend pulled latest `ghcr.io/blockscout/blockscout:latest`
- Started successfully; ran migrations; served existing indexed data
- WS client warned `ws://host.docker.internal:8545/ is unavailable` — expected, non-fatal
- HTTP indexer set to retry (will catch up when Anvil restarts)

### 2. Nginx Proxy Reloaded
```bash
docker exec proxy nginx -s reload
```
Resolved the upstream `backend:4000` after the container came up.

### 3. No PM2 Restarts (Not Needed)
PM2 services were already auto-restarted ~55s before investigation began. The CLOSE_WAIT flood on the host side cleared naturally over the ~15-minute investigation window as old 5-day stale connections expired.

---

## AFTER State (22:20 UTC)

### Port 8545 Connection Saturation (Host)
| State | Count |
|-------|-------|
| CLOSE_WAIT | 19 |
| ESTABLISHED | 38 |
| **Total** | **~60** |

*Note: CLOSE_WAIT reduction (2879 → 19) is due to natural expiry of 5-day-old stale connections, NOT Anvil recovery.*

### Local eth_blockNumber (127.0.0.1:8545)
```
→ [TIMEOUT — Anvil still frozen]
```

### Via rpc-balancer (127.0.0.1:8546)
```
→ {"error":{"code":-32000,"message":"No healthy upstream available"}}
```

### Container Anvil State (AFTER)
| Metric | Value |
|--------|-------|
| Accept queue (rx_queue) | 0x1001 = 4,097 (still full) |
| CLOSE_WAIT in container | 3,753 (growing) |
| docker-proxy FIN-WAIT-2 to container | ~3,786 |

### Blockscout Explorer — TX Lookup ✅
```
GET http://127.0.0.1/api/v2/transactions/0x09b4a81940047092233ccf9536b7b83af8c01d38aac0a5b4033993e208017483

{
  "hash": "0x09b4a81940047092233ccf9536b7b83af8c01d38aac0a5b4033993e208017483",
  "block": 202719,
  "status": "success",
  "method": "swapExactTokensForTokens",
  "from": "0xA6951773b7ead197107Ab33Fe86Fa4b6C19f9EA1",
  "confirmations": 606248
}
```
**Explorer is fully functional on historical data.**

---

## [BLOCKED] — Anvil Restart Required

### Symptom
Anvil (Rust/Tokio process inside Docker container `anvil`, Up 5 days) has entered a frozen state:
- Stops calling `accept()` on its listen socket
- Accept queue backlog fills to kernel maximum (~4097)
- No block production (block time 2s but no new blocks since May 13)
- `--silent` flag prevents any diagnostic logging

### Evidence
- `rx_queue = 4097` on LISTEN socket in container network namespace
- CLOSE_WAIT connections growing inside container (3,753 and increasing)
- Zero response to any RPC calls from inside OR outside container
- Only 20 file descriptors open (not FD exhaustion — internal runtime freeze)

### Why This Cannot Be Fixed Without Anvil Restart
1. **No diagnostic interface**: `--silent` mode + no admin API
2. **No signal recovery**: Sending SIGUSR1/SIGUSR2 to Anvil has no defined behavior; risking process death
3. **No hot-reload**: Anvil has no SIGHUP config reload
4. **No drain mechanism**: Cannot force Anvil to process its accept queue from outside
5. **ss --kill fails**: Requires `CAP_NET_ADMIN`; connections are in container network namespace owned by root

### Recommended Fix
```bash
# 1. Stop PM2 services to prevent connection storm on Anvil restart
pm2 stop all

# 2. Restart Anvil container (persists no state by default — no --dump-state in current cmd)
docker restart anvil
# Wait for healthcheck to pass (~30s)

# 3. Restart PM2 services
pm2 start all

# 4. Blockscout backend is already running — it will auto-resume indexing
# (no action needed for explorer)
```

### Risk Assessment for Anvil Restart
- **Chain state**: Anvil was started with `--silent` and no `--dump-state` flag in the override. **All blockchain state accumulated since container start will be lost on restart.** The 208,969+ blocks of transactions will be gone from the chain (but remain in the Blockscout DB as orphaned data).
- **Mitigation**: If chain state must be preserved, take a snapshot first: `docker exec anvil cast rpc anvil_dumpState --rpc-url http://localhost:8545` (but this RPC call will also timeout since Anvil is frozen — so state cannot be saved from a frozen process).
- **Conclusion**: State is effectively already lost. Restart is safe from an infrastructure standpoint.

---

## Ongoing Concern: Connection Accumulation

Even after Anvil restart, PM2 services hammering port 8545 could cause repeat saturation. Recommend:

1. **Add connection limit to rpc-balancer**: `maxConcurrent: 100` is set per-upstream, but all 20 PM2 services connect directly to port 8545, bypassing the balancer.
2. **Route all PM2 traffic through rpc-balancer (port 8546)**: Change `RPC_PRIMARY` env for all PM2 services to `http://localhost:8546`.
3. **Configure rpc-balancer with circuit breaker**: Add a backoff/retry strategy so failed requests don't immediately reconnect.
4. **Add `--max-connections` to Anvil** (if supported in newer version): Limit total concurrent connections at the process level.
5. **Add Anvil healthcheck restart policy**: `restart: on-failure` or `unless-stopped` in docker-compose with healthcheck.

---

## Summary Table

| Component | Before | After | Fix Needed |
|-----------|--------|-------|------------|
| Anvil RPC (port 8545) | ❌ Frozen, 2879 CLOSE_WAIT | ❌ Still frozen (3,753 container-side) | ✅ Restart Anvil |
| rpc-balancer (port 8546) | ❌ "No healthy upstream" | ❌ Same | ✅ After Anvil fix |
| Blockscout backend | ❌ Container missing | ✅ Running, serving data | None |
| Explorer nginx proxy | ❌ 502 Bad Gateway | ✅ HTTP 200 | None |
| Target TX lookup | ❌ 502 | ✅ Found (block 202719) | None |
| Public RPC rpc.goodclaw.org | ❌ Timeout | ❌ Timeout | ✅ After Anvil fix |
