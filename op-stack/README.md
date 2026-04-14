# GoodDollar L2 — OP Stack Deployment

> Run GoodDollar L2 (Chain ID: 42069) as a real Optimism rollup — locally via Kurtosis or on Sepolia.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    GoodDollar L2                         │
│                    Chain ID: 42069                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  op-geth (execution)  ◄──► op-node (consensus)          │
│                                                         │
│  op-batcher ──► L1          op-proposer ──► L1          │
│  (tx data)                  (state roots)               │
│                                                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
    L1: Kurtosis (local) or Sepolia (testnet)
```

## Option 1: Kurtosis Local Dev (Recommended)

[Kurtosis](https://github.com/ethpandaops/optimism-package) is Optimism's official local development tool. It spins up a complete L1 + L2 OP Stack in Docker — no testnet ETH, no manual contract deployment, no fiddling with genesis files.

### Prerequisites

- **Docker** ≥ 24 (with Docker Compose)
- **Kurtosis CLI** — install:
  ```bash
  curl -L https://install.kurtosis.com | bash
  ```
- **⚠️ Port 8081 must be free** — the Kurtosis engine runs on port 8081. If something else is using it (e.g., another service), stop it first or run on a different machine.

### Quick Start

```bash
# 1. Start the full OP Stack (L1 + L2)
make kurtosis-up

# 2. Find the L2 RPC URL (ports are dynamically assigned)
make kurtosis-info

# 3. Test the connection
cast chain-id --rpc-url http://127.0.0.1:<L2_PORT>

# 4. When done
make kurtosis-down
```

### Finding the L2 RPC Port

Kurtosis dynamically assigns ports. After `make kurtosis-up`, run:

```bash
# Quick summary with extracted URLs
make kurtosis-info

# Or see all port mappings
make kurtosis-ports

# Or inspect the full enclave
kurtosis enclave inspect optimism
```

Look for `op-el-1-op-geth` — the `rpc: 8545/tcp` mapping shows the host port for L2 RPC.

### Kurtosis Commands

| Command | Description |
|---------|-------------|
| `make kurtosis-up` | Start full local OP Stack (L1 + L2) |
| `make kurtosis-down` | Stop and remove the enclave |
| `make kurtosis-status` | Show enclave status |
| `make kurtosis-logs` | Dump logs from all services |
| `make kurtosis-ports` | Show all port mappings |
| `make kurtosis-info` | Show L1/L2 RPC URLs and test connection |

### What Kurtosis Handles

- ✅ L1 with all required contracts (including CREATE2 deployer)
- ✅ OP Stack deployment (op-geth, op-node, batcher, proposer)
- ✅ Pre-funded dev accounts
- ✅ Correct block hashing (no Anvil issues)
- ✅ Genesis and rollup config generation

### Deploying GoodDollar Contracts (Kurtosis)

After the L2 is running:

```bash
# Get the L2 RPC URL
make kurtosis-info

# From the gooddollar-l2 root directory
cd ..
forge script script/Deploy.s.sol \
  --rpc-url http://127.0.0.1:<L2_PORT> \
  --broadcast
```

---

## Option 2: Sepolia Testnet

Deploys L1 contracts to Sepolia, then runs the full L2 stack locally via Docker Compose.

### Prerequisites

- **Docker** ≥ 24 + Docker Compose
- **Foundry** (forge, cast) — `curl -L https://foundry.paradigm.xyz | bash && foundryup`
- **jq** — JSON processing (`apt install jq`)
- Sepolia ETH ≥ 2 ETH in your deployment wallet
- Sepolia RPC from [Alchemy](https://alchemy.com), [Infura](https://infura.io), or public endpoints

### Quick Start

```bash
# 1. Initialize (downloads op-deployer + creates .env)
make init

# 2. Edit .env — set PRIVATE_KEY, L1_RPC_URL, L1_BEACON_URL
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

### Sepolia Commands

| Command | Description |
|---------|-------------|
| `make help` | Show all commands |
| `make init` | Download op-deployer + create .env |
| `make setup` | Deploy L1 contracts to Sepolia + configure services |
| `make up` | Start all L2 Docker services (Sepolia L1) |
| `make down` | Stop all services |
| `make logs` | Follow all service logs |
| `make status` | Show service health |
| `make test-l1` | Test L1 connectivity |
| `make test-l2` | Test L2 connectivity |
| `make restart` | Restart all services |
| `make clean` | Remove containers + volumes |
| `make reset` | Full reset (removes all deployment data) |
| `make deploy-contracts` | Instructions to deploy GoodDollar contracts |

### Deploying GoodDollar Contracts (Sepolia)

After the L2 is running:

```bash
# From the gooddollar-l2 root directory
cd ..
forge script script/Deploy.s.sol \
  --rpc-url http://localhost:9545 \
  --broadcast
```

## Native Token Note

OP Stack uses **ETH as the native gas token** by default. GoodDollar (G$) is deployed as an ERC-20 token on L2, not as the native gas token. Custom native gas token support is on the OP Stack roadmap.

## Ports (Sepolia Mode)

| Port | Service | Protocol |
|------|---------|----------|
| 9545 | op-geth | L2 HTTP RPC |
| 9546 | op-geth | L2 WebSocket RPC |
| 9551 | op-geth | Auth RPC (internal) |
| 9547 | op-node | op-node HTTP RPC |
| 9222 | op-node | P2P (TCP/UDP) |
| 7300 | dispute-mon | Prometheus metrics |

> **Kurtosis mode:** Ports are dynamically assigned. Use `make kurtosis-info` to find them.

## Directory Structure

```
op-stack/
├── kurtosis-params.yaml      # Kurtosis configuration
├── .example.env              # Sepolia environment template
├── .env                      # Your config (gitignored)
├── docker-compose.yml        # Sepolia service orchestration
├── Makefile                  # Automation commands
├── README.md                 # This file
└── scripts/
    ├── kurtosis-info.sh      # Extract Kurtosis endpoint info
    ├── setup-rollup.sh       # Sepolia deployment automation
    └── download-op-deployer.sh

# Generated after `make setup` (Sepolia):
├── deployer/                 # op-deployer artifacts
├── sequencer/                # op-geth + op-node config
├── batcher/                  # op-batcher config
├── proposer/                 # op-proposer config
├── challenger/               # op-challenger config
└── dispute-mon/              # Dispute monitor config
```

## Troubleshooting

**Kurtosis port 8081 conflict:**
The Kurtosis engine needs port 8081. If another service is using it:
```bash
lsof -i :8081
# Stop the conflicting service, then retry
kurtosis engine restart
```

**Kurtosis enclave already exists:**
```bash
make kurtosis-down
make kurtosis-up
```

**Block hash mismatch (`failed to verify block hash`):**
This happened with Anvil as L1 — Anvil's block header encoding doesn't match real Ethereum. Kurtosis uses real geth and doesn't have this issue.

**`unsupported chainID` or `ReadSuperchainDeployment` error:**
This happened with geth --dev as L1 (missing OPCM). Kurtosis handles all L1 contract deployment automatically.

**Port conflicts (Sepolia mode — `port is already allocated`):**
L2 uses ports 9545-9551 to avoid conflicts with Kurtosis:
```bash
lsof -i :9545 -i :9546 -i :9547
```

**Container issues (Sepolia mode):**
```bash
make logs                    # Check all logs
docker compose logs -f op-node   # Check specific service
make clean && make setup && make up  # Full reset
```

## Security Notes

- **Never commit `.env`** to version control (it's in `.gitignore`)
- Use HSMs for production private key management
- Back up `deployer/` directory after successful Sepolia deployment

## References

- [Kurtosis OP Stack Package](https://github.com/ethpandaops/optimism-package)
- [OP Stack Documentation](https://docs.optimism.io/)
- [Create L2 Rollup Tutorial](https://docs.optimism.io/chain-operators/tutorials/create-l2-rollup)
- [GoodDollar Protocol](https://www.gooddollar.org/)
