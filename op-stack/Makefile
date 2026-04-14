# ============================================================
# GoodDollar L2 — OP Stack Makefile
# ============================================================
# Chain ID: 42069 | Chain Name: GoodDollar L2
# ============================================================

.PHONY: help init setup setup-local up up-local down logs status restart test-l1 test-l2 clean

# Default target
help: ## Show this help message
	@echo ""
	@echo "  GoodDollar L2 — OP Stack Commands"
	@echo "  Chain ID: 42069"
	@echo ""
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

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
	L1_MODE=sepolia ./scripts/setup-rollup.sh

setup-local: ## Deploy to local geth --dev L1 with OPCM bootstrap
	@mkdir -p deployer
	@if [ ! -f op-deployer ]; then \
		echo "❌ op-deployer not found. Run 'make init' first."; \
		exit 1; \
	fi
	@if [ ! -f .env ]; then \
		echo "❌ .env file not found. Run 'make init' first."; \
		exit 1; \
	fi
	@echo "🚀 Setting up GoodDollar L2 (Chain ID: 42069) on local geth --dev..."
	L1_MODE=local L1_CHAIN_ID=1337 ./scripts/setup-rollup.sh

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

up-local: ## Start all services with local geth --dev L1
	docker compose --profile local up -d --wait
	@echo ""
	@echo "🟢 GoodDollar L2 is starting..."
	@echo "   L1 RPC:  http://localhost:8555  (local geth --dev)"
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
