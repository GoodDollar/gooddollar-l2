# GoodDollar L2 — OP Stack Configuration

<!-- GOODCHAIN_STATUS:START -->
> **Public testnet checkpoint (2026-05-24 16:47 UTC):** `main@6e329ad3` is deployed to `goodswap.goodclaw.org`. Public health gate and lane-7 internal smoke are **GREEN-with-warnings** with `0` blockers. Explorer/RPC were repaired without wiping Blockscout DB; final verification showed RPC/explorer at block `13777`, and a live follow-up probe saw the explorer advancing past `14029`. Remaining warnings are accepted/excluded health-only services or optional `LANE7_RPC` freshness config. See root `README.md` and `docs/ARCHITECTURE.md`.
<!-- GOODCHAIN_STATUS:END -->


## Overview

Full OP Stack rollup replacing the single Anvil devnet. This gives GoodDollar L2 a proper
L1 ↔ L2 architecture with batch submission, output proposals, and withdrawal proofs.

**Components:**
- **op-geth**: L2 execution engine (modified go-ethereum)
- **op-node**: L2 consensus/derivation (reads L1, drives op-geth)
- **op-batcher**: Batches L2 transactions and posts to L1
- **op-proposer**: Posts L2 output roots to L1 for withdrawals

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  L1 (Anvil/Sepolia)              │
│  OptimismPortal · L2OutputOracle · SystemConfig  │
│  L1StandardBridge (33bps UBI fee on deposits)    │
└─────────────┬───────────────────────┬───────────┘
              │ derivation            │ batch posting
         ┌────▼────┐           ┌─────▼─────┐
         │ op-node │           │ op-batcher │
         └────┬────┘           └───────────┘
              │ engine API
         ┌────▼────┐
         │ op-geth │ ← L2 execution (chain ID 42069)
         └─────────┘
              │
         ┌────▼────────┐
         │ op-proposer  │ ← Posts output roots to L2OutputOracle
         └──────────────┘
```

## Quick Start

```bash
# First run (initializes everything)
./init-and-start.sh

# Subsequent starts
docker compose up -d

# Check health
./healthcheck.sh

# Reset everything
./init-and-start.sh --reset
```

## Migration from Anvil

### Phase 1: Docker Compose (local) ← CURRENT
- L1 Anvil + OP Stack components in Docker
- Chain ID 42069 preserved, same deployer keys
- All GoodDollar contracts redeployed via `migrate.sh`
- Blockscout repointed to L2 RPC

### Phase 2: Testnet
- L1 → Sepolia
- Public RPC endpoint

### Phase 3: Mainnet
- L1 → Ethereum mainnet
- Decentralized sequencer set

## Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Full OP Stack local devnet (5 services) |
| `genesis.json` | L2 genesis with UBI fee vaults + chain 42069 |
| `rollup.json` | Rollup derivation config (2s L2 blocks, 12s L1) |
| `.env` | Environment config (keys, addresses, RPCs) |
| `jwt-secret.txt` | Shared secret for op-geth ↔ op-node auth |
| `deploy-l1.sh` | Deploy L1 bridge contracts to Anvil |
| `migrate.sh` | Redeploy all GoodDollar protocol contracts |
| `init-and-start.sh` | One-command setup: init + deploy + start |
| `healthcheck.sh` | Verify all components are healthy |
| `deployments.json` | L1 contract addresses + tx hashes |

## UBI Integration

Every layer of the stack routes fees to UBI:
- **L1StandardBridge**: 33bps on all ETH deposits
- **OptimismPortal**: 33bps on withdrawal finalization
- **SystemConfig**: Configurable UBI fee (default 33%)
- **SequencerFeeVault**: L2 sequencer fees → UBI pool
- **BaseFeeVault**: L2 base fees → 33% to UBI

## Port Map

| Port | Service | Purpose |
|------|---------|---------|
| 8545 | l1-anvil | L1 RPC |
| 9545 | op-geth | L2 RPC (HTTP) |
| 9546 | op-geth | L2 RPC (WebSocket) |
| 9551 | op-geth | Engine API (auth) |
| 7545 | op-node | Rollup node RPC |
| 6545 | op-batcher | Batcher RPC |
| 5545 | op-proposer | Proposer RPC |

## Troubleshooting

```bash
# Check logs for specific service
docker compose logs -f op-geth

# op-geth not producing blocks? Check op-node connection:
docker compose logs op-node | tail -50

# L2 not advancing? Batcher might be stuck:
docker compose logs op-batcher | tail -20

# Full reset:
./init-and-start.sh --reset
```
