# GoodDollar L2 — OP Stack Deployment

> Run GoodDollar L2 (Chain ID: 42069) as a real Optimism rollup — locally or on Sepolia.

Based on the [official Optimism rollup example](https://github.com/ethereum-optimism/optimism/tree/develop/docs/public-docs/create-l2-rollup-example), customized for GoodDollar.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    GoodDollar L2                         │
│                    Chain ID: 42069                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  op-geth (execution)  ◄──► op-node (consensus)          │
│       :9545 RPC              :9547 RPC                  │
│       :9546 WS               :9222 P2P                  │
│       :9551 Auth                                        │
│                                                         │
│  op-batcher ──► L1          op-proposer ──► L1          │
│  (tx data)                  (state roots)               │
│                                                         │
│  op-challenger              dispute-mon                 │
│  (fraud proofs)             (metrics :7300)             │
│                                                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
    L1: Local geth --dev (:8555) or Sepolia (11155111)
```

## What This Deploys

| Service | Image | Purpose |
|---------|-------|---------|
| **l1** (local only) | `ethereum/client-go:stable` | Local L1 using `geth --dev` (chain 1337) |
| **op-geth** | `us-docker.pkg.dev/oplabs-tools-artifacts/images/op-geth` | Execution client — processes L2 transactions |
| **op-node** | `us-docker.pkg.dev/oplabs-tools-artifacts/images/op-node` | Consensus client — manages rollup state |
| **op-batcher** | `us-docker.pkg.dev/oplabs-tools-artifacts/images/op-batcher` | Publishes L2 transaction batches to L1 |
| **op-proposer** | `us-docker.pkg.dev/oplabs-tools-artifacts/images/op-proposer` | Submits state root proposals to L1 |
| **op-challenger** | `us-docker.pkg.dev/oplabs-tools-artifacts/images/op-challenger` | Monitors and challenges invalid proposals |
| **dispute-mon** | `us-docker.pkg.dev/oplabs-tools-artifacts/images/op-dispute-mon` | Dispute game monitoring + Prometheus metrics |

## Prerequisites

- **Docker** ≥ 24 + Docker Compose
- **Foundry** (forge, cast) — `curl -L https://foundry.paradigm.xyz | bash && foundryup`
- **jq** — JSON processing (`apt install jq`)
- **git** — for prestate generation

**For Sepolia mode only:**
- Sepolia ETH ≥ 2 ETH in your deployment wallet
- Sepolia RPC from [Alchemy](https://alchemy.com), [Infura](https://infura.io), or public endpoints

## Quick Start — Local Mode (Recommended)

Runs everything locally using `geth --dev` as L1. No testnet ETH needed.

The setup script bootstraps the OPCM (OP Contract Manager) contracts on the local L1 before deploying the rollup — this is required because `geth --dev` is a fresh chain with no pre-deployed contracts.

```bash
# 1. Initialize (downloads op-deployer + creates .env)
make init

# 2. (Optional) Edit .env — defaults work for local mode
#    L1_MODE is "local" by default
nano .env

# 3. Deploy OPCM bootstrap + L1 contracts on local geth --dev
make setup-local

# 4. Start the L2 (includes local L1)
make up-local

# 5. Verify
make status
make test-l2
```

### How Local Mode Works

1. **Starts `geth --dev`** as a Docker container on port 8555 (chain ID 1337)
2. **Funds the deployer** from geth's pre-funded dev account
3. **Bootstraps OPCM** — runs `op-deployer bootstrap superchain` and `bootstrap implementations` to deploy the Superchain contracts that normally exist on Sepolia/mainnet
4. **Deploys rollup contracts** via `op-deployer apply` using the bootstrapped OPCM
5. **Generates configs** — genesis.json, rollup.json for the L2

## Quick Start — Sepolia Mode

Deploys L1 contracts to Sepolia, then runs the full L2 stack locally.

**Requirements:** ~2 Sepolia ETH ([faucet](https://sepoliafaucet.com)) + a Sepolia RPC URL.

```bash
# 1. Initialize
make init

# 2. Edit .env — set L1_MODE="sepolia", PRIVATE_KEY, L1_RPC_URL, L1_BEACON_URL
nano .env

# 3. Deploy L1 contracts to Sepolia
make setup

# 4. Start the L2
make up

# 5. Verify
make status
make test-l1
make test-l2
```

L2 RPC on `:9545`, WebSocket on `:9546`, op-node on `:9547`.

## Available Commands

| Command | Description |
|---------|-------------|
| `make help` | Show all commands |
| `make init` | Download op-deployer + create .env |
| `make setup` | Deploy L1 contracts to Sepolia + configure services |
| `make setup-local` | Deploy to local geth --dev with OPCM bootstrap |
| `make up` | Start all L2 Docker services (Sepolia L1) |
| `make up-local` | Start all services including local L1 |
| `make down` | Stop all services |
| `make logs` | Follow all service logs |
| `make logs-op-geth` | Follow specific service logs |
| `make status` | Show service health |
| `make test-l1` | Test L1 connectivity |
| `make test-l2` | Test GoodDollar L2 connectivity |
| `make restart` | Restart all services |
| `make clean` | Remove containers + volumes |
| `make reset` | Full reset (removes all deployment data) |
| `make deploy-contracts` | Instructions to deploy GoodDollar contracts |

## Deploying GoodDollar Contracts

After the L2 is running, deploy the 53 GoodDollar contracts:

```bash
# From the gooddollar-l2 root directory (one level up)
cd ..
forge script script/Deploy.s.sol \
  --rpc-url http://localhost:9545 \
  --broadcast
```

The contracts in `/contracts/` include UBI distribution, governance, token mechanics, and more. They should be deployed **after** the L2 chain is operational.

## Native Token Note

OP Stack uses **ETH as the native gas token** by default. GoodDollar (G$) is deployed as an ERC-20 token on L2, not as the native gas token. Custom native gas token support is on the OP Stack roadmap — when available, G$ could potentially become the native token.

## Ports

| Port | Service | Protocol |
|------|---------|----------|
| 8555 | l1 (geth --dev) | L1 HTTP RPC (local mode only) |
| 9545 | op-geth | L2 HTTP RPC |
| 9546 | op-geth | L2 WebSocket RPC |
| 9551 | op-geth | Auth RPC (internal) |
| 9547 | op-node | op-node HTTP RPC |
| 9222 | op-node | P2P (TCP/UDP) |
| 7300 | dispute-mon | Prometheus metrics |

## P2P Networking

By default, P2P is **disabled** for local development. For production:

1. Remove `--p2p.disable` from `docker-compose.yml` (op-node command)
2. Add P2P flags:
   ```
   --p2p.listen.ip=0.0.0.0
   --p2p.listen.tcp=9222
   --p2p.listen.udp=9222
   --p2p.advertise.ip=${P2P_ADVERTISE_IP}
   --p2p.advertise.tcp=9222
   --p2p.advertise.udp=9222
   --p2p.sequencer.key=${PRIVATE_KEY}
   ```
3. Set `P2P_ADVERTISE_IP` in `.env` to your public IP
4. Open port 9222 (TCP + UDP) in your firewall

## Directory Structure

```
op-stack/
├── .example.env              # Environment template
├── .env                      # Your config (gitignored)
├── docker-compose.yml        # Service orchestration
├── Makefile                  # Automation commands
├── README.md                 # This file
└── scripts/
    ├── setup-rollup.sh       # Full deployment automation
    └── download-op-deployer.sh

# Generated after `make setup` or `make setup-local`:
├── deployer/                 # op-deployer artifacts
│   ├── .deployer/            # genesis.json, rollup.json, state.json
│   ├── addresses/            # Generated wallet addresses
│   ├── bootstrap_superchain.json      # (local mode) Superchain bootstrap output
│   └── bootstrap_implementations.json # (local mode) OPCM bootstrap output
├── sequencer/                # op-geth + op-node config
│   ├── genesis.json
│   ├── rollup.json
│   └── jwt.txt
├── batcher/                  # op-batcher config
├── proposer/                 # op-proposer config
├── challenger/               # op-challenger config + prestate
└── dispute-mon/              # Dispute monitor config
```

## Troubleshooting

**Block hash mismatch (`failed to verify block hash`):**
If using local mode, make sure you're using `geth --dev` (not Anvil). Anvil's block header encoding doesn't match real Ethereum, causing op-node hash verification to fail. The local mode setup handles this automatically.

**`unsupported chainID` or `ReadSuperchainDeployment` error:**
In local mode, the OPCM is bootstrapped locally (not looked up from a registry). Make sure `make setup-local` completed successfully and check for bootstrap output files in `deployer/`.

**`unknown field "minBaseFee"` (or similar rollup.json errors):**
op-deployer v0.6.0 generates fields that op-node v1.9.5 doesn't understand. The setup script auto-strips these. If you see this, re-run setup.

**`Insufficient funds for gas`:**
In local mode, the setup script funds the deployer from geth's dev account automatically. Make sure `cast` (Foundry) is installed: `curl -L https://foundry.paradigm.xyz | bash && foundryup`

**Port conflicts (`port is already allocated`):**
L2 uses ports 9545-9551 to avoid conflicts. Check:
```bash
lsof -i :9545 -i :9546 -i :9547 -i :8555
```

**Container issues:**
```bash
make logs                    # Check all logs
docker compose logs -f op-node   # Check specific service
make clean && make setup-local && make up-local  # Full reset (local)
```

## Security Notes

- **Never commit `.env`** to version control (it's in `.gitignore`)
- Use HSMs for production private key management
- Monitor gas costs on Sepolia
- Back up `deployer/` directory after successful deployment

## References

- [OP Stack Documentation](https://docs.optimism.io/)
- [Create L2 Rollup Tutorial](https://docs.optimism.io/chain-operators/tutorials/create-l2-rollup)
- [Official Example](https://github.com/ethereum-optimism/optimism/tree/develop/docs/public-docs/create-l2-rollup-example)
- [GoodDollar Protocol](https://www.gooddollar.org/)
