# ============================================================
# GoodDollar L2 — OP Stack Makefile
# ============================================================
# Chain ID: 42069 | Chain Name: GoodDollar L2
# ============================================================

.PHONY: help init setup up down logs status restart test-l1 test-l2 clean \
        kurtosis-up kurtosis-down kurtosis-status kurtosis-logs kurtosis-ports kurtosis-info \
        kurtosis-deploy kurtosis-deploy-check

# Default target
help: ## Show this help message
	@echo ""
	@echo "  GoodDollar L2 — OP Stack Commands"
	@echo "  Chain ID: 42069"
	@echo ""
	@echo "  ── Kurtosis (Local Dev) ──"
	@grep -E '^kurtosis-[a-zA-Z0-9_-]+:.*?## .*' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "  ── Sepolia (Testnet) ──"
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*' $(MAKEFILE_LIST) | grep -v '^kurtosis-' | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

# ──────────────────────────────────────────────────────────
# Kurtosis — Local OP Stack (recommended for development)
# ──────────────────────────────────────────────────────────

kurtosis-up: ## Start local OP Stack via Kurtosis (L1 + L2, everything included)
	@echo "🚀 Starting GoodDollar L2 via Kurtosis..."
	@echo "   This downloads OP Stack images and sets up L1 + L2 automatically."
	@echo ""
	kurtosis run github.com/ethpandaops/optimism-package --args-file kurtosis-params.yaml
	@echo ""
	@echo "🟢 GoodDollar L2 is running!"
	@echo "   Run 'make kurtosis-info' to see RPC endpoints."

# Helper to find the running enclave name
KURTOSIS_ENCLAVE = $(shell kurtosis enclave ls 2>/dev/null | grep -i RUNNING | awk '{print $$1}' | head -1)

kurtosis-down: ## Stop and remove the Kurtosis enclave
	@echo "🔴 Stopping GoodDollar L2 Kurtosis enclave..."
	@ENCLAVE=$$(kurtosis enclave ls 2>/dev/null | grep -i RUNNING | awk '{print $$1}' | head -1); \
	if [ -n "$$ENCLAVE" ]; then \
		kurtosis enclave rm -f "$$ENCLAVE"; \
		echo "✅ Enclave '$$ENCLAVE' removed"; \
	else \
		echo "No running enclave to remove"; \
	fi

kurtosis-status: ## Show Kurtosis enclave status
	@echo ""
	@echo "  GoodDollar L2 — Kurtosis Status"
	@echo "  ─────────────────────────────────"
	@ENCLAVE=$$(kurtosis enclave ls 2>/dev/null | grep -i RUNNING | awk '{print $$1}' | head -1); \
	if [ -n "$$ENCLAVE" ]; then \
		kurtosis enclave inspect "$$ENCLAVE"; \
	else \
		echo "  No running enclave found. Run 'make kurtosis-up' first."; \
	fi
	@echo ""

kurtosis-logs: ## Show logs from Kurtosis services
	@echo "Fetching logs from Kurtosis enclave..."
	@ENCLAVE=$$(kurtosis enclave ls 2>/dev/null | grep -i RUNNING | awk '{print $$1}' | head -1); \
	if [ -n "$$ENCLAVE" ]; then \
		echo "(Tip: use 'kurtosis service logs $$ENCLAVE <service-name>' for a specific service)"; \
		kurtosis enclave dump "$$ENCLAVE" /tmp/kurtosis-dump && echo "Logs dumped to /tmp/kurtosis-dump"; \
	else \
		echo "No running enclave found. Run 'make kurtosis-up' first."; \
	fi

kurtosis-ports: ## Show port mappings for all Kurtosis services
	@echo ""
	@echo "  GoodDollar L2 — Kurtosis Port Mappings"
	@echo "  ────────────────────────────────────────"
	@ENCLAVE=$$(kurtosis enclave ls 2>/dev/null | grep -i RUNNING | awk '{print $$1}' | head -1); \
	if [ -n "$$ENCLAVE" ]; then \
		kurtosis enclave inspect "$$ENCLAVE" | grep -E '(127\.0\.0\.1|0\.0\.0\.0):[0-9]+'; \
	else \
		echo "  No running enclave found. Run 'make kurtosis-up' first."; \
	fi
	@echo ""

kurtosis-info: ## Show L1/L2 RPC URLs and connection info
	@./scripts/kurtosis-info.sh

kurtosis-deploy: ## Deploy all GoodDollar contracts to the local Kurtosis L2
	@./scripts/kurtosis-deploy.sh $(if $(ONLY),--only $(ONLY),)

kurtosis-deploy-check: ## Verify deployed contracts on Kurtosis L2
	@echo "🔍 Checking deployed contract state..."
	@ENCLAVE=$$(kurtosis enclave ls 2>/dev/null | grep -i RUNNING | awk '{print $$1}' | head -1); \
	L2_RPC=$$(kurtosis enclave inspect "$$ENCLAVE" 2>&1 | grep -A5 "op-el-1-op-geth" | grep "rpc: 8545/tcp" | grep -oE '127\.0\.0\.1:[0-9]+' | head -1); \
	if [ -n "$$L2_RPC" ]; then \
		cd .. && forge script script/CheckDevnetState.s.sol --rpc-url "http://$$L2_RPC"; \
	else \
		echo "Could not detect L2 RPC. Is the enclave running?"; \
	fi

# ──────────────────────────────────────────────────────────
# Sepolia — Testnet Deployment
# ──────────────────────────────────────────────────────────

init: ## Download op-deployer and create .env from template
	@chmod +x scripts/*.sh
	./scripts/download-op-deployer.sh
	@if [ ! -f .env ]; then \
		cp .example.env .env; \
		echo ""; \
		echo "✅ Created .env from template"; \
		echo "👉 Edit .env with your actual values (PRIVATE_KEY, L1_RPC_URL)"; \
		echo "   Then run: make setup"; \
	else \
		echo ".env already exists, skipping copy"; \
	fi

setup: ## Deploy L1 contracts to Sepolia and configure all rollup services
	@mkdir -p deployer
	@if [ ! -f op-deployer ]; then \
		echo "❌ op-deployer not found. Run 'make init' first."; \
		exit 1; \
	fi
	@if [ ! -f .env ]; then \
		echo "❌ .env file not found. Run 'make init' first."; \
		exit 1; \
	fi
	@echo "🚀 Setting up GoodDollar L2 (Chain ID: 42069) on Sepolia..."
	./scripts/setup-rollup.sh

up: ## Start all OP Stack services (uses Sepolia L1)
	docker compose up -d --wait
	@echo ""
	@echo "🟢 GoodDollar L2 is starting..."
	@echo "   L2 RPC:  http://localhost:${L2_RPC_PORT:-9545}"
	@echo "   L2 WS:   ws://localhost:9546"
	@echo "   op-node: http://localhost:9547"
	@echo ""
	@sleep 5
	@make test-l2

down: ## Stop all services
	docker compose down
	@echo "🔴 GoodDollar L2 stopped"

logs: ## View logs from all services (follow mode)
	docker compose logs -f

logs-%: ## View logs from a specific service (e.g., make logs-op-geth)
	docker compose logs -f $*

status: ## Show status of all services
	@echo ""
	@echo "  GoodDollar L2 — Service Status"
	@echo "  ─────────────────────────────────"
	@docker compose ps
	@echo ""

restart: ## Restart all services
	docker compose restart
	@echo "🔄 All services restarted"

restart-%: ## Restart a specific service (e.g., make restart-batcher)
	docker compose restart $*

test-l1: ## Test L1 (Sepolia) connectivity
	@echo "Testing L1 RPC connection..."
	@if [ -f .env ]; then \
		set -a; source .env; set +a; \
	fi; \
	RESULT=$$(curl -s -X POST -H "Content-Type: application/json" \
		--data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
		"$$L1_RPC_URL" 2>/dev/null | jq -r '.result' 2>/dev/null); \
	if [ -n "$$RESULT" ] && [ "$$RESULT" != "null" ]; then \
		echo "✅ L1 connection successful (block: $$RESULT)"; \
	else \
		echo "❌ L1 connection failed — check L1_RPC_URL in .env"; \
	fi

test-l2: ## Test L2 (GoodDollar) connectivity
	@echo "Testing GoodDollar L2 RPC connection..."
	@RESULT=$$(curl -s -X POST -H "Content-Type: application/json" \
		--data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
		http://localhost:${L2_RPC_PORT:-9545} 2>/dev/null | jq -r '.result' 2>/dev/null); \
	if [ -n "$$RESULT" ] && [ "$$RESULT" != "null" ]; then \
		CHAIN_DEC=$$(printf "%d" "$$RESULT" 2>/dev/null || echo "unknown"); \
		echo "✅ L2 connection successful (chainId: $$CHAIN_DEC)"; \
	else \
		echo "❌ L2 connection failed — is the chain running? (make up)"; \
	fi
	@BLOCK=$$(curl -s -X POST -H "Content-Type: application/json" \
		--data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
		http://localhost:${L2_RPC_PORT:-9545} 2>/dev/null | jq -r '.result' 2>/dev/null); \
	if [ -n "$$BLOCK" ] && [ "$$BLOCK" != "null" ]; then \
		BLOCK_DEC=$$(printf "%d" "$$BLOCK" 2>/dev/null || echo "unknown"); \
		echo "   Latest block: $$BLOCK_DEC"; \
	fi

clean: ## Remove all containers, volumes, and generated configs
	@echo "🧹 Cleaning up GoodDollar L2 OP Stack..."
	@mkdir -p batcher proposer challenger sequencer dispute-mon
	@echo "# cleanup" > batcher/.env 2>/dev/null || true
	@echo "# cleanup" > proposer/.env 2>/dev/null || true
	@echo "# cleanup" > challenger/.env 2>/dev/null || true
	@echo "# cleanup" > dispute-mon/.env 2>/dev/null || true
	docker compose down -v --remove-orphans 2>/dev/null || true
	@echo "✅ Containers and volumes removed"
	@echo "   Run 'make reset' to also remove generated configs"

reset: ## Full reset — removes ALL data including deployed contracts
	@echo "⚠️  This will completely reset your GoodDollar L2 deployment!"
	@echo "   All deployed contract data will be lost."
	@read -p "Are you sure? (y/N) " confirm && [ "$$confirm" = "y" ] || exit 1
	make clean
	rm -rf deployer sequencer batcher proposer challenger dispute-mon
	@echo "✅ Full reset complete. Run 'make setup' to redeploy."

deploy-contracts: ## Deploy GoodDollar contracts to L2 (after chain is running)
	@echo "📋 To deploy GoodDollar contracts to L2:"
	@echo ""
	@echo "   1. Make sure the L2 is running: make status"
	@echo "   2. cd ../  (back to gooddollar-l2 root)"
	@echo "   3. forge script script/Deploy.s.sol --rpc-url http://localhost:${L2_RPC_PORT:-9545} --broadcast"
	@echo ""
	@echo "   The 53 GoodDollar contracts in /contracts/ will be deployed to chain 42069"
