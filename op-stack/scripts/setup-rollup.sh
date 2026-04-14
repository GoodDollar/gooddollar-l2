#!/bin/bash

# ============================================================
# GoodDollar L2 — OP Stack Rollup Setup Script
# ============================================================
# Automates: L1 contract deployment → genesis generation →
#            service configuration for all OP Stack components
# ============================================================

set -e

# Prevent running inside Docker
if [ -f "/.dockerenv" ]; then
    echo "ERROR: Run this script on the host, not inside Docker."
    exit 1
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✅]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[⚠️]${NC} $1"; }
log_error()   { echo -e "${RED}[❌]${NC} $1"; }

# ──────────────────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────────────────
L1_MODE=${L1_MODE:-local}
# Always use Sepolia chain ID — local Anvil mimics Sepolia so op-deployer
# can find the OPCM impl address in its registry
L1_CHAIN_ID=${L1_CHAIN_ID:-11155111}
L2_CHAIN_ID_DECIMAL=${L2_CHAIN_ID:-42069}  # GoodDollar L2
L2_CHAIN_ID=$(printf "0x%064x" "$L2_CHAIN_ID_DECIMAL")
P2P_ADVERTISE_IP=${P2P_ADVERTISE_IP:-127.0.0.1}

WORKSPACE_DIR="$(pwd)"
ROLLUP_DIR="$WORKSPACE_DIR"
DEPLOYER_DIR="$ROLLUP_DIR/deployer"
SEQUENCER_DIR="$ROLLUP_DIR/sequencer"
BATCHER_DIR="$ROLLUP_DIR/batcher"
PROPOSER_DIR="$ROLLUP_DIR/proposer"
CHALLENGER_DIR="$ROLLUP_DIR/challenger"
DISPUTE_MON_DIR="$ROLLUP_DIR/dispute-mon"

# Add op-deployer to PATH if local
if [ -f "$(dirname "$0")/../op-deployer" ]; then
    OP_DEPLOYER_PATH="$(cd "$(dirname "$0")/.." && pwd)/op-deployer"
    export PATH="$(dirname "$OP_DEPLOYER_PATH"):$PATH"
    log_info "Using local op-deployer: $OP_DEPLOYER_PATH"
fi

# ──────────────────────────────────────────────────────────
# Validate .env
# ──────────────────────────────────────────────────────────
validate_env() {
    log_info "Validating .env..."

    USER_ENV_FILE="$(dirname "$0")/../.env"
    if [ ! -f "$USER_ENV_FILE" ]; then
        log_error ".env not found. Run 'make init' first."
        exit 1
    fi

    # Save any env vars passed from Makefile (they take priority over .env)
    local SAVED_L1_RPC_URL="${L1_RPC_URL:-}"
    local SAVED_L1_MODE="${L1_MODE:-}"
    local SAVED_L1_CHAIN_ID="${L1_CHAIN_ID:-}"
    local SAVED_L1_BEACON_URL="${L1_BEACON_URL:-}"

    set -a; source "$USER_ENV_FILE"; set +a

    # Restore env vars that were explicitly passed (override .env)
    [ -n "$SAVED_L1_RPC_URL" ] && L1_RPC_URL="$SAVED_L1_RPC_URL"
    [ -n "$SAVED_L1_MODE" ] && L1_MODE="$SAVED_L1_MODE"
    [ -n "$SAVED_L1_CHAIN_ID" ] && L1_CHAIN_ID="$SAVED_L1_CHAIN_ID"
    [ -n "$SAVED_L1_BEACON_URL" ] || L1_BEACON_URL="$SAVED_L1_BEACON_URL"

    # In local mode, we auto-generate a private key if not set
    if [ "$L1_MODE" = "local" ]; then
        if [ -z "$PRIVATE_KEY" ] || [ "$PRIVATE_KEY" = "YOUR_PRIVATE_KEY_WITHOUT_0X_PREFIX" ]; then
            PRIVATE_KEY=$(openssl rand -hex 32)
            log_info "Generated random deployer key for local mode"
            # Write it back to .env so other steps can use it
            sed -i "s|PRIVATE_KEY=.*|PRIVATE_KEY=\"$PRIVATE_KEY\"|" "$USER_ENV_FILE"
        fi
        for var in L1_RPC_URL PRIVATE_KEY L2_CHAIN_ID; do
            if [ -z "${!var}" ]; then
                log_error "$var is not set in .env"
                exit 1
            fi
        done
    else
        for var in L1_RPC_URL L1_BEACON_URL PRIVATE_KEY L2_CHAIN_ID; do
            if [ -z "${!var}" ]; then
                log_error "$var is not set in .env"
                exit 1
            fi
        done
        if [ "$PRIVATE_KEY" = "YOUR_PRIVATE_KEY_WITHOUT_0X_PREFIX" ]; then
            log_error "PRIVATE_KEY is still the placeholder. Edit .env with your real key."
            exit 1
        fi
    fi

    log_success ".env validated"
}

# ──────────────────────────────────────────────────────────
# Check prerequisites
# ──────────────────────────────────────────────────────────
check_prerequisites() {
    log_info "Checking prerequisites..."

    for cmd in docker jq openssl; do
        if ! command -v $cmd &>/dev/null; then
            log_error "$cmd not found. Please install it."
            exit 1
        fi
    done

    if ! command -v op-deployer &>/dev/null; then
        log_error "op-deployer not found. Run 'make init' first."
        exit 1
    fi

    log_success "Prerequisites OK"
}

# ──────────────────────────────────────────────────────────
# Generate wallet addresses for different roles
# ──────────────────────────────────────────────────────────
generate_addresses() {
    log_info "Generating wallet addresses..."

    mkdir -p "$DEPLOYER_DIR/addresses"
    cd "$DEPLOYER_DIR/addresses"

    for role in admin base_fee_vault_recipient l1_fee_vault_recipient \
                sequencer_fee_vault_recipient system_config unsafe_block_signer \
                operator_fee_vault_recipient chain_fees_fee_recipient \
                batcher proposer challenger; do
        local private_key=""
        while [ -z "$private_key" ] || [ "$private_key" = "0000000000000000000000000000000000000000000000000000000000000000" ]; do
            private_key=$(openssl rand -hex 32)
        done
        local address="0x$(echo "$private_key" | head -c 40)"
        echo "$address" > "${role}_address.txt"
        log_info "  $role: $address"
    done

    log_success "Wallet addresses generated"
}

# ──────────────────────────────────────────────────────────
# Initialize op-deployer
# ──────────────────────────────────────────────────────────
init_deployer() {
    log_info "Initializing op-deployer..."

    cd "$DEPLOYER_DIR"
    cat > .env << EOF
L1_RPC_URL=$L1_RPC_URL
PRIVATE_KEY=$PRIVATE_KEY
EOF

    rm -rf .deployer

    op-deployer init \
        --l1-chain-id $L1_CHAIN_ID \
        --l2-chain-ids "$L2_CHAIN_ID_DECIMAL" \
        --workdir .deployer \
        --intent-type standard-overrides

    log_success "op-deployer initialized"
}

# ──────────────────────────────────────────────────────────
# Update intent.toml with generated addresses
# ──────────────────────────────────────────────────────────
update_intent() {
    log_info "Updating intent configuration for GoodDollar L2..."

    cd "$DEPLOYER_DIR"

    # Read generated addresses
    local vars=(
        "BASE_FEE_VAULT_ADDR:base_fee_vault_recipient"
        "L1_FEE_VAULT_ADDR:l1_fee_vault_recipient"
        "SEQUENCER_FEE_VAULT_ADDR:sequencer_fee_vault_recipient"
        "SYSTEM_CONFIG_ADDR:system_config"
        "UNSAFE_BLOCK_SIGNER_ADDR:unsafe_block_signer"
        "BATCHER_ADDR:batcher"
        "PROPOSER_ADDR:proposer"
        "CHALLENGER_ADDR:challenger"
        "OPERATOR_FEE_VAULT_ADDR:operator_fee_vault_recipient"
        "CHAIN_FEES_RECIPIENT_ADDR:chain_fees_fee_recipient"
    )

    for pair in "${vars[@]}"; do
        local varname="${pair%%:*}"
        local filename="${pair##*:}"
        eval "$varname=$(cat addresses/${filename}_address.txt)"
    done

    # Update intent.toml
    local L2_CHAIN_ID_HEX=$(printf "0x%064x" "$L2_CHAIN_ID_DECIMAL")
    sed -i.bak "s|id = .*|id = \"$L2_CHAIN_ID_HEX\"|" .deployer/intent.toml
    sed -i.bak "s|baseFeeVaultRecipient = .*|baseFeeVaultRecipient = \"$BASE_FEE_VAULT_ADDR\"|" .deployer/intent.toml
    sed -i.bak "s|l1FeeVaultRecipient = .*|l1FeeVaultRecipient = \"$L1_FEE_VAULT_ADDR\"|" .deployer/intent.toml
    sed -i.bak "s|sequencerFeeVaultRecipient = .*|sequencerFeeVaultRecipient = \"$SEQUENCER_FEE_VAULT_ADDR\"|" .deployer/intent.toml
    sed -i.bak "s|systemConfigOwner = .*|systemConfigOwner = \"$SYSTEM_CONFIG_ADDR\"|" .deployer/intent.toml
    sed -i.bak "s|unsafeBlockSigner = .*|unsafeBlockSigner = \"$UNSAFE_BLOCK_SIGNER_ADDR\"|" .deployer/intent.toml
    sed -i.bak "s|batcher = .*|batcher = \"$BATCHER_ADDR\"|" .deployer/intent.toml
    sed -i.bak "s|proposer = .*|proposer = \"$PROPOSER_ADDR\"|" .deployer/intent.toml
    sed -i.bak "s|challenger = .*|challenger = \"$CHALLENGER_ADDR\"|" .deployer/intent.toml
    sed -i.bak "s|fundDevAccounts = .*|fundDevAccounts = true|" .deployer/intent.toml
    sed -i.bak "s|operatorFeeVaultRecipient = .*|operatorFeeVaultRecipient = \"$OPERATOR_FEE_VAULT_ADDR\"|" .deployer/intent.toml
    sed -i.bak "s|chainFeesRecipient = .*|chainFeesRecipient = \"$CHAIN_FEES_RECIPIENT_ADDR\"|" .deployer/intent.toml

    # Cleanup sed backups
    find .deployer -name "*.bak" -delete

    log_success "Intent configuration updated"
}

# ──────────────────────────────────────────────────────────
# Deploy L1 contracts via op-deployer
# ──────────────────────────────────────────────────────────
deploy_contracts() {
    log_info "Deploying L1 contracts to Sepolia..."
    log_info "This may take several minutes..."

    cd "$DEPLOYER_DIR"

    op-deployer apply \
        --workdir .deployer \
        --l1-rpc-url "$L1_RPC_URL" \
        --private-key "$PRIVATE_KEY"

    log_success "L1 contracts deployed!"
}

# ──────────────────────────────────────────────────────────
# Generate genesis.json and rollup.json
# ──────────────────────────────────────────────────────────
generate_config() {
    log_info "Generating chain configuration..."

    cd "$DEPLOYER_DIR"

    op-deployer inspect genesis --workdir .deployer "$L2_CHAIN_ID_DECIMAL" > .deployer/genesis.json
    op-deployer inspect rollup --workdir .deployer "$L2_CHAIN_ID_DECIMAL" > .deployer/rollup.json

    log_success "genesis.json and rollup.json generated"
}

# ──────────────────────────────────────────────────────────
# Setup sequencer (op-geth + op-node config)
# ──────────────────────────────────────────────────────────
setup_sequencer() {
    log_info "Setting up sequencer..."

    mkdir -p "$SEQUENCER_DIR"
    cd "$SEQUENCER_DIR"

    cp "$DEPLOYER_DIR/.deployer/genesis.json" .
    cp "$DEPLOYER_DIR/.deployer/rollup.json" .

    # Generate JWT secret
    openssl rand -hex 32 > jwt.txt
    chmod 600 jwt.txt

    # Docker services need Docker-internal L1 URL, not host URL
    local DOCKER_L1_RPC="$L1_RPC_URL"
    if [ "$L1_MODE" = "local" ]; then
        DOCKER_L1_RPC="http://l1:8545"
    fi

    cat > .env << EOF
L1_RPC_URL=$DOCKER_L1_RPC
L1_BEACON_URL=$L1_BEACON_URL
PRIVATE_KEY=$PRIVATE_KEY
P2P_ADVERTISE_IP=$P2P_ADVERTISE_IP
L2_CHAIN_ID=$L2_CHAIN_ID_DECIMAL
EOF

    log_success "Sequencer configured"
}

# ──────────────────────────────────────────────────────────
# Setup batcher
# ──────────────────────────────────────────────────────────
setup_batcher() {
    log_info "Setting up batcher..."

    mkdir -p "$BATCHER_DIR"
    cd "$BATCHER_DIR"

    cp "$DEPLOYER_DIR/.deployer/state.json" .
    INBOX_ADDRESS=$(jq -r '.opChainDeployments[0].SystemConfigProxy' state.json)

    cat > .env << EOF
OP_BATCHER_L2_ETH_RPC=http://op-geth:8545
OP_BATCHER_ROLLUP_RPC=http://op-node:8547
OP_BATCHER_PRIVATE_KEY=$PRIVATE_KEY
OP_BATCHER_POLL_INTERVAL=1s
OP_BATCHER_SUB_SAFETY_MARGIN=6
OP_BATCHER_NUM_CONFIRMATIONS=1
OP_BATCHER_SAFE_ABORT_NONCE_TOO_LOW_COUNT=3
OP_BATCHER_INBOX_ADDRESS=$INBOX_ADDRESS
EOF

    log_success "Batcher configured"
}

# ──────────────────────────────────────────────────────────
# Setup proposer
# ──────────────────────────────────────────────────────────
setup_proposer() {
    log_info "Setting up proposer..."

    mkdir -p "$PROPOSER_DIR"
    cd "$PROPOSER_DIR"

    cp "$DEPLOYER_DIR/.deployer/state.json" .
    GAME_FACTORY_ADDR=$(jq -r '.opChainDeployments[0].DisputeGameFactoryProxy' state.json)

    cat > .env << EOF
OP_PROPOSER_GAME_FACTORY_ADDRESS=$GAME_FACTORY_ADDR
OP_PROPOSER_PRIVATE_KEY=$PRIVATE_KEY
OP_PROPOSER_POLL_INTERVAL=20s
OP_PROPOSER_GAME_TYPE=0
OP_PROPOSER_PROPOSAL_INTERVAL=3600s
EOF

    log_success "Proposer configured"
}

# ──────────────────────────────────────────────────────────
# Generate challenger prestate
# ──────────────────────────────────────────────────────────
generate_challenger_prestate() {
    log_info "Generating challenger prestate..."

    local CHAIN_ID
    if [ -f "$DEPLOYER_DIR/.deployer/rollup.json" ]; then
        CHAIN_ID=$(jq -r '.l2_chain_id' "$DEPLOYER_DIR/.deployer/rollup.json")
    else
        log_error "rollup.json not found"
        return 1
    fi

    log_info "Chain ID: $CHAIN_ID"

    # Clone optimism repo for prestate generation
    local OPTIMISM_DIR="$ROLLUP_DIR/optimism"
    if [ ! -d "$OPTIMISM_DIR" ]; then
        log_info "Cloning Optimism repository (this takes a while)..."
        git clone https://github.com/ethereum-optimism/optimism.git "$OPTIMISM_DIR"
        cd "$OPTIMISM_DIR"

        OP_PROGRAM_TAG=$(git tag --list "op-program/v*" | sort -V | tail -1)
        if [ -z "$OP_PROGRAM_TAG" ]; then
            log_error "Could not find any op-program tags"
            return 1
        fi
        log_info "Using op-program version: $OP_PROGRAM_TAG"

        git checkout "$OP_PROGRAM_TAG"
        git submodule update --init --recursive
    else
        cd "$OPTIMISM_DIR"
        LATEST_TAG=$(git tag --list "op-program/v*" | sort -V | tail -1)
        CURRENT_TAG=$(git describe --tags --exact-match 2>/dev/null || echo "")
        if [ "$CURRENT_TAG" != "$LATEST_TAG" ]; then
            log_info "Updating to $LATEST_TAG..."
            git checkout "$LATEST_TAG"
            git submodule update --init --recursive
        fi
    fi

    # Copy chain config and generate prestate
    mkdir -p op-program/chainconfig/configs
    cp "$DEPLOYER_DIR/.deployer/rollup.json" "op-program/chainconfig/configs/${CHAIN_ID}-rollup.json"
    cp "$DEPLOYER_DIR/.deployer/genesis.json" "op-program/chainconfig/configs/${CHAIN_ID}-genesis-l2.json"

    log_info "Generating reproducible prestate (this takes a while)..."
    make reproducible-prestate

    PRESTATE_HASH=$(jq -r '.pre' op-program/bin/prestate-proof-mt64.json)
    if [ -z "$PRESTATE_HASH" ] || [ "$PRESTATE_HASH" = "null" ]; then
        log_error "Could not extract prestate hash"
        return 1
    fi

    log_info "Prestate hash: $PRESTATE_HASH"
    mkdir -p "$CHALLENGER_DIR"
    mv "op-program/bin/prestate-mt64.bin.gz" "$CHALLENGER_DIR/${PRESTATE_HASH}.bin.gz"

    cd "$ROLLUP_DIR"
    log_success "Challenger prestate generated"
}

# ──────────────────────────────────────────────────────────
# Setup challenger
# ──────────────────────────────────────────────────────────
setup_challenger() {
    log_info "Setting up challenger..."

    mkdir -p "$CHALLENGER_DIR"
    cd "$CHALLENGER_DIR"

    cp "$DEPLOYER_DIR/.deployer/genesis.json" .
    cp "$DEPLOYER_DIR/.deployer/rollup.json" .

    GAME_FACTORY_ADDR=$(jq -r '.opChainDeployments[0].DisputeGameFactoryProxy' "$DEPLOYER_DIR/.deployer/state.json")

    # Find prestate file
    local PRESTATE_FILE
    PRESTATE_FILE=$(find "$CHALLENGER_DIR" -maxdepth 1 -name "*.bin.gz" -print -quit 2>/dev/null)

    if [ -z "$PRESTATE_FILE" ]; then
        log_warning "No prestate file found — challenger may not work correctly"
        PRESTATE_FILE="PRESTATE_NOT_GENERATED.bin.gz"
    else
        PRESTATE_FILE=$(basename "$PRESTATE_FILE")
    fi

    cat > .env << EOF
OP_CHALLENGER_GAME_FACTORY_ADDRESS=$GAME_FACTORY_ADDR
OP_CHALLENGER_PRIVATE_KEY=$PRIVATE_KEY
OP_CHALLENGER_CANNON_PRESTATE=/workspace/$PRESTATE_FILE
EOF

    log_success "Challenger configured"
}

# ──────────────────────────────────────────────────────────
# Setup dispute monitor
# ──────────────────────────────────────────────────────────
setup_dispute_monitor() {
    log_info "Setting up dispute monitor..."

    mkdir -p "$DISPUTE_MON_DIR"
    cd "$DISPUTE_MON_DIR"

    GAME_FACTORY_ADDRESS=$(jq -r '.opChainDeployments[0].DisputeGameFactoryProxy' "$DEPLOYER_DIR/.deployer/state.json")
    PROPOSER_ADDRESS=$(jq -r '.appliedIntent.chains[0].roles.proposer' "$DEPLOYER_DIR/.deployer/state.json")
    CHALLENGER_ADDRESS=$(jq -r '.appliedIntent.chains[0].roles.challenger' "$DEPLOYER_DIR/.deployer/state.json")

    cat > .env << EOF
ROLLUP_RPC=http://op-node:8547
OP_DISPUTE_MON_GAME_FACTORY_ADDRESS=$GAME_FACTORY_ADDRESS
PROPOSER_ADDRESS=$PROPOSER_ADDRESS
CHALLENGER_ADDRESS=$CHALLENGER_ADDRESS
OP_DISPUTE_MON_NETWORK=op-sepolia
OP_DISPUTE_MON_MONITOR_INTERVAL=10s
EOF

    mkdir -p logs
    log_success "Dispute monitor configured"
}

# ──────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────
main() {
    echo ""
    echo "  ┌──────────────────────────────────────────┐"
    echo "  │  GoodDollar L2 — OP Stack Deployment     │"
    echo "  │  Chain ID: $L2_CHAIN_ID_DECIMAL                          │"
    if [ "$L1_MODE" = "local" ]; then
    echo "  │  L1: Local Anvil (mimics Sepolia)        │"
    else
    echo "  │  L1: Sepolia ($L1_CHAIN_ID)                  │"
    fi
    echo "  └──────────────────────────────────────────┘"
    echo ""

    # If local mode, start Anvil L1 first
    if [ "$L1_MODE" = "local" ]; then
        log_info "Starting local L1 (Anvil) on port 8555..."
        cd "$ROLLUP_DIR"
        docker-compose --profile local up -d l1
        # Wait for L1 to be ready
        log_info "Waiting for local L1 to be ready..."
        for i in $(seq 1 30); do
            if curl -s -X POST -H "Content-Type: application/json" \
                --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
                http://localhost:8555 >/dev/null 2>&1; then
                log_success "Local L1 is ready"
                break
            fi
            sleep 1
        done
        # For setup script, use host-accessible URL
        export L1_RPC_URL="http://localhost:8555"
        # Fund the deployer key on local L1
        log_info "Funding deployer on local L1..."
        DEPLOYER_ADDR=$(cast wallet address "0x$PRIVATE_KEY" 2>/dev/null || echo "")
        if [ -n "$DEPLOYER_ADDR" ]; then
            # Anvil account 0 private key (well-known)
            ANVIL_KEY="ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
            cast send --rpc-url http://localhost:8555 --private-key "$ANVIL_KEY" \
                "$DEPLOYER_ADDR" --value 100ether >/dev/null 2>&1 && \
                log_success "Funded deployer $DEPLOYER_ADDR with 100 ETH" || \
                log_warning "Could not fund deployer — you may need to fund manually"
        fi
    fi

    # Clean start
    rm -rf "$DEPLOYER_DIR"
    mkdir -p "$DEPLOYER_DIR"

    validate_env
    check_prerequisites
    generate_addresses
    init_deployer
    update_intent
    deploy_contracts
    generate_config
    setup_sequencer
    setup_batcher
    setup_proposer
    generate_challenger_prestate
    setup_challenger
    setup_dispute_monitor

    echo ""
    log_success "GoodDollar L2 deployment complete!"
    echo ""
    echo "  Next steps:"
    if [ "$L1_MODE" = "local" ]; then
    echo "    1. make up-local              — Start all services (L1 already running)"
    else
    echo "    1. make up                    — Start all services"
    fi
    echo "    2. make status                — Check service health"
    echo "    3. make test-l2               — Verify L2 is working"
    echo "    4. make deploy-contracts      — Deploy GoodDollar contracts"
    echo ""
    echo "  Endpoints:"
    echo "    L2 RPC:     http://localhost:8545"
    echo "    L2 WS:      ws://localhost:8546"
    echo "    op-node:    http://localhost:8547"
    echo "    Metrics:    http://localhost:7300/metrics"
    echo ""
}

# Allow standalone prestate generation
if [ $# -gt 0 ]; then
    case "$1" in
        "prestate"|"generate-prestate")
            SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
            ROLLUP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
            DEPLOYER_DIR="$ROLLUP_DIR/deployer"
            CHALLENGER_DIR="$ROLLUP_DIR/challenger"
            generate_challenger_prestate
            exit $?
            ;;
        *)
            log_error "Unknown command: $1 (available: prestate)"
            exit 1
            ;;
    esac
fi

main "$@"
