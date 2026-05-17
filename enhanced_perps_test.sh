#!/bin/bash

# Enhanced GoodPerps functionality test with detailed diagnostics
# Tests each component systematically to identify exact failure points

set -e

echo "🔍 Enhanced GoodPerps Diagnostic Test"
echo "====================================="

# Load environment
source .autobuilder/addresses.env
FOUNDRY_INSTALL_DIR="$HOME/.foundry"
PATH="$FOUNDRY_INSTALL_DIR/bin:$PATH"

WALLET=$(cast wallet address --private-key $TESTER_KEY)
echo "🏦 Test Wallet: $WALLET"
echo "📡 RPC: $RPC"
echo ""

# Function to handle errors and continue testing
handle_error() {
    echo "  ❌ ERROR: $1"
    echo "  💡 This helps identify the specific issue"
    echo ""
}

# Step 0: Basic connectivity and contract verification
echo "📋 Step 0: Contract Verification"
echo "PERP Engine: $PERP"
echo "Margin Vault: $VAULT"
echo "GDT Token: $GDT"
echo "Oracle: $PERP_ORACLE"

# Verify contracts exist
echo "🔍 Verifying contract deployments..."
if cast code $PERP --rpc-url $RPC | grep -q "0x"; then
    echo "  ✅ PerpEngine contract deployed"
else
    handle_error "PerpEngine not deployed at $PERP"
fi

if cast code $VAULT --rpc-url $RPC | grep -q "0x"; then
    echo "  ✅ MarginVault contract deployed"
else
    handle_error "MarginVault not deployed at $VAULT"
fi

if cast code $GDT --rpc-url $RPC | grep -q "0x"; then
    echo "  ✅ GDT contract deployed"
else
    handle_error "GDT not deployed at $GDT"
fi

# Step 1: Check contract states
echo ""
echo "⚙️  Step 1: Contract State Verification"

# Check if PerpEngine is paused
if PAUSED=$(cast call $PERP 'paused()(bool)' --rpc-url $RPC 2>/dev/null); then
    if [ "$PAUSED" = "true" ]; then
        handle_error "PerpEngine is paused"
    else
        echo "  ✅ PerpEngine not paused"
    fi
else
    handle_error "Could not check PerpEngine pause state"
fi

# Check market 0 (BTC) configuration
echo "🏪 Checking BTC market (ID=0) configuration..."
if MARKET_DATA=$(cast call $PERP 'markets(uint256)(bytes32,bytes32,uint256,bool,uint256,uint256)' 0 --rpc-url $RPC 2>/dev/null); then
    echo "  📊 Market 0 data: $MARKET_DATA"
    # Parse market active status (4th field)
    ACTIVE=$(echo $MARKET_DATA | cut -d' ' -f4)
    if [ "$ACTIVE" = "true" ]; then
        echo "  ✅ BTC market is active"
    else
        handle_error "BTC market is not active"
    fi
else
    handle_error "Could not read BTC market data - market may not exist"
fi

# Step 2: Oracle price verification
echo ""
echo "📊 Step 2: Oracle Price Verification"
BTC_KEY=$(cast keccak "BTC")
echo "🔑 BTC market key: $BTC_KEY"

if MARK_PRICE=$(cast call $PERP_ORACLE 'getMarkPrice(bytes32)(uint256)' $BTC_KEY --rpc-url $RPC 2>/dev/null); then
    echo "  💰 BTC mark price: $MARK_PRICE (8 decimals)"
    if [ "$MARK_PRICE" = "0" ]; then
        handle_error "BTC mark price is zero"
    else
        echo "  ✅ BTC mark price available"
    fi
else
    handle_error "Could not get BTC mark price from oracle"
fi

# Step 3: Test wallet balance and approval
echo ""
echo "💰 Step 3: Wallet Balance and Approval Check"

if GDT_BALANCE=$(cast call $GDT 'balanceOf(address)(uint256)' $WALLET --rpc-url $RPC 2>/dev/null); then
    echo "  💵 GDT Balance: $GDT_BALANCE"
    if [ "$GDT_BALANCE" = "0" ]; then
        handle_error "Test wallet has zero GDT balance"
    else
        echo "  ✅ Wallet has GDT tokens"
    fi
else
    handle_error "Could not check GDT balance"
fi

if ALLOWANCE=$(cast call $GDT 'allowance(address,address)(uint256)' $WALLET $VAULT --rpc-url $RPC 2>/dev/null); then
    echo "  🔓 Current allowance to vault: $ALLOWANCE"
    REQUIRED_ALLOWANCE="10100000000000000000"  # 10.1 GDT (10 margin + 0.1 fee)
    if [ "$ALLOWANCE" -lt "$REQUIRED_ALLOWANCE" ]; then
        echo "  ⚠️  Insufficient allowance, approving vault..."
        if cast send $GDT 'approve(address,uint256)' $VAULT "10000000000000000000000" --rpc-url $RPC --private-key $TESTER_KEY --confirmations 1 2>/dev/null; then
            echo "  ✅ Vault approval successful"
        else
            handle_error "Failed to approve vault"
        fi
    else
        echo "  ✅ Sufficient allowance already exists"
    fi
else
    handle_error "Could not check vault allowance"
fi

# Step 4: Margin deposit test
echo ""
echo "🏦 Step 4: Margin Deposit Test"
DEPOSIT_AMOUNT="1000000000000000000000"  # 1,000 GDT

if MARGIN_BALANCE_BEFORE=$(cast call $VAULT 'balances(address)(uint256)' $WALLET --rpc-url $RPC 2>/dev/null); then
    echo "  📊 Margin balance before: $MARGIN_BALANCE_BEFORE"
else
    handle_error "Could not read margin balance"
fi

echo "  💳 Attempting to deposit $DEPOSIT_AMOUNT..."
if cast send $VAULT 'deposit(uint256)' $DEPOSIT_AMOUNT --rpc-url $RPC --private-key $TESTER_KEY --confirmations 1 2>/dev/null; then
    echo "  ✅ Margin deposit successful"

    if MARGIN_BALANCE_AFTER=$(cast call $VAULT 'balances(address)(uint256)' $WALLET --rpc-url $RPC 2>/dev/null); then
        echo "  📊 Margin balance after: $MARGIN_BALANCE_AFTER"
    fi
else
    handle_error "Margin deposit failed - check GDT balance and approval"
fi

# Step 5: Position opening test with detailed error handling
echo ""
echo "📈 Step 5: Position Opening Test"
POSITION_SIZE="100000000000000000000"    # 100 GDT position
MARGIN_AMOUNT="10000000000000000000"     # 10 GDT margin
MARKET_ID="0"                            # BTC market
IS_LONG="true"                           # Long position

echo "  📋 Position parameters:"
echo "     Market ID: $MARKET_ID (BTC)"
echo "     Position Size: $POSITION_SIZE (100 GDT)"
echo "     Margin: $MARGIN_AMOUNT (10 GDT)"
echo "     Direction: Long"
echo "     Expected Leverage: 10x (within 50x limit)"

# Check if user already has a position
if EXISTING_POS=$(cast call $PERP 'positions(address,uint256)(bool,bool,uint256,uint256,uint256,int256,uint256)' $WALLET $MARKET_ID --rpc-url $RPC 2>/dev/null); then
    IS_OPEN=$(echo $EXISTING_POS | cut -d' ' -f1)
    if [ "$IS_OPEN" = "true" ]; then
        handle_error "User already has open position on market $MARKET_ID"
    else
        echo "  ✅ No existing position conflicts"
    fi
else
    handle_error "Could not check existing positions"
fi

echo "  🎯 Attempting to open position..."
if cast send $PERP 'openPosition(uint256,uint256,bool,uint256)' $MARKET_ID $POSITION_SIZE $IS_LONG $MARGIN_AMOUNT --rpc-url $RPC --private-key $TESTER_KEY --confirmations 1 2>/dev/null; then
    echo "  🎉 Position opened successfully!"

    # Verify position was created
    if NEW_POS=$(cast call $PERP 'positions(address,uint256)(bool,bool,uint256,uint256,uint256,int256,uint256)' $WALLET $MARKET_ID --rpc-url $RPC 2>/dev/null); then
        echo "  📊 New position: $NEW_POS"
    fi

    # Step 6: Position closing test
    echo ""
    echo "📉 Step 6: Position Closing Test"
    echo "  🎯 Attempting to close position..."
    if cast send $PERP 'closePosition(uint256)' $MARKET_ID --rpc-url $RPC --private-key $TESTER_KEY --confirmations 1 2>/dev/null; then
        echo "  ✅ Position closed successfully!"
    else
        handle_error "Position closing failed - may need oracle price update"
    fi

else
    handle_error "Position opening failed"
    echo ""
    echo "🔍 Debugging Information:"
    echo "  - Check if sufficient margin deposited"
    echo "  - Verify oracle prices are current"
    echo "  - Confirm market is active and not paused"
    echo "  - Check leverage calculation: size/margin = $(($POSITION_SIZE/$MARGIN_AMOUNT))x <= 50x"
fi

# Step 7: Margin withdrawal test
echo ""
echo "💸 Step 7: Margin Withdrawal Test"
WITHDRAW_AMOUNT="500000000000000000000"  # 500 GDT

echo "  🎯 Attempting to withdraw $WITHDRAW_AMOUNT..."
if cast send $VAULT 'withdraw(uint256)' $WITHDRAW_AMOUNT --rpc-url $RPC --private-key $TESTER_KEY --confirmations 1 2>/dev/null; then
    echo "  ✅ Margin withdrawal successful"

    if FINAL_MARGIN=$(cast call $VAULT 'balances(address)(uint256)' $WALLET --rpc-url $RPC 2>/dev/null); then
        echo "  📊 Final margin balance: $FINAL_MARGIN"
    fi
else
    handle_error "Margin withdrawal failed - may have open position or insufficient balance"
fi

echo ""
echo "🎉 Enhanced GoodPerps Test Complete!"
echo ""
echo "📋 Summary of Findings:"
echo "This enhanced test provides detailed error reporting at each step"
echo "Any failures above pinpoint the exact issue in the margin→position flow"
echo "Use the error messages and debugging info to implement targeted fixes"