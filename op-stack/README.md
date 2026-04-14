# GoodDollar L2 — OP Stack Deployment

> Run GoodDollar L2 (Chain ID: 42069) as a real Optimism rollup on Sepolia.

Based on the [official Optimism rollup example](https://github.com/ethereum-optimism/optimism/tree/develop/docs/public-docs/create-l2-rollup-example), customized for GoodDollar.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    GoodDollar L2                         │
│                    Chain ID: 42069                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  op-geth (execution)  ◄──► op-node (consensus)          │
│       :8545 RPC              :8547 RPC                  │
│       :8546 WS               :9222 P2P                  │
│       :8551 Auth                                        │
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
            Sepolia L1 (11155111)
```

## What This Deploys

| Service | Image | Purpose |
|---------|-------|---------|
| **op-geth** | `us-docker.pkg.dev/oplabs-tools-artifacts/images/op-geth` | Execution client — processes L2 transactions |
| **op-node** | `us-docker.pkg.dev/oplabs-tools-artifacts/images/op-node` | Consensus client — manages rollup state |
| **op-batcher** | `us-docker.pkg.dev/oplabs-tools-artifacts/images/op-batcher` | Publishes L2 transaction batches to L1 |
| **op-proposer** | `us-docker.pkg.dev/oplabs-tools-artifacts/images/op-proposer` | Submits state root proposals to L1 |
| **op-challenger** | `us-docker.pkg.dev/oplabs-tools-artifacts/images/op-challenger` | Monitors and challenges invalid proposals |
| **dispute-mon** | `us-docker.pkg.dev/oplabs-tools-artifacts/images/op-dispute-mon` | Dispute game monitoring + Prometheus metrics |

## Prerequisites

- **Docker** ≥ 24 + Docker Compose
- **jq** — JSON processing (`apt install jq`)
- **git** — for prestate generation
- **Sepolia ETH** — ≥2 ETH in your deployment wallet
- **Sepolia RPC** — from [Alchemy](https://alchemy.com), [Infura](https://infura.io), or public endpoints

## Quick Start

```bash
# 1. Configure
cp .example.env .env
# Edit .env — set PRIVATE_KEY and optionally L1_RPC_URL

# 2. Initialize (downloads op-deployer)
make init

# 3. Deploy L1 contracts and configure services
make setup

# 4. Start everything
make up

# 5. Verify
make status
make test-l1
make test-l2
```

## Available Commands

| Command | Description |
|---------|-------------|
| `make help` | Show all commands |
| `make init` | Download op-deployer + create .env |
| `make setup` | Deploy L1 contracts + configure services |
| `make up` | Start all Docker services |
| `make down` | Stop all services |
| `make logs` | Follow all service logs |
| `make logs-op-geth` | Follow specific service logs |
| `make status` | Show service health |
| `make test-l1` | Test Sepolia connectivity |
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
  --rpc-url http://localhost:8545 \
  --broadcast
```

The contracts in `/contracts/` include UBI distribution, governance, token mechanics, and more. They should be deployed **after** the L2 chain is operational.

## Native Token Note

OP Stack uses **ETH as the native gas token** by default. GoodDollar (G$) is deployed as an ERC-20 token on L2, not as the native gas token. Custom native gas token support is on the OP Stack roadmap — when available, G$ could potentially become the native token.

## Ports

| Port | Service | Protocol |
|------|---------|----------|
| 8545 | op-geth | HTTP RPC |
| 8546 | op-geth | WebSocket RPC |
| 8551 | op-geth | Auth RPC (internal) |
| 8547 | op-node | HTTP RPC |
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

# Generated after `make setup`:
├── deployer/                 # op-deployer artifacts
│   ├── .deployer/            # genesis.json, rollup.json, state.json
│   └── addresses/            # Generated wallet addresses
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

**Port conflicts:**
```bash
# Check what's using the ports
lsof -i :8545 -i :8546 -i :8547 -i :8551 -i :9222
```

**Container issues:**
```bash
make logs              # Check all logs
docker-compose logs -f op-node   # Check specific service
make clean && make setup && make up   # Nuclear option
```

**Insufficient ETH:**
Fund your deployment wallet with ≥2 Sepolia ETH from a [faucet](https://sepoliafaucet.com).

**L1 connection timeouts:**
Try a different RPC provider or use the public endpoints in `.example.env`.

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
