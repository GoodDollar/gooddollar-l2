#!/usr/bin/env node

/**
 * Test script to simulate perps position opening - CORRECTED VERSION
 * Uses the correct PerpEngine.openPosition function signature
 */

const { createPublicClient, createWalletClient, http, parseEther, formatEther } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { readFileSync } = require('fs');

// Load addresses
const addresses = JSON.parse(readFileSync('/home/goodclaw/gooddollar-l2/op-stack/addresses.json', 'utf8'));

// Use Anvil account #0 private key (same as in tests)
const TESTER_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const TESTER_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

const publicClient = createPublicClient({
  transport: http('https://rpc.goodclaw.org')
});

const walletClient = createWalletClient({
  transport: http('https://rpc.goodclaw.org'),
  account: privateKeyToAccount(TESTER_PRIVATE_KEY)
});

// CORRECT ABI with proper function signatures
const PerpEngineABI = [
  {
    type: 'function',
    name: 'marketCount',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'positions',
    inputs: [{ type: 'address', name: 'user' }, { type: 'uint256', name: 'marketId' }],
    outputs: [
      { type: 'bool', name: 'isOpen' },
      { type: 'int256', name: 'entryPrice' },
      { type: 'int256', name: 'size' },
      { type: 'uint256', name: 'timestamp' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'openPosition',
    inputs: [
      { type: 'uint256', name: 'marketId' },
      { type: 'uint256', name: 'size' },
      { type: 'bool', name: 'isLong' },
      { type: 'uint256', name: 'margin' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  }
];

const MarginVaultABI = [
  {
    type: 'function',
    name: 'balances',
    inputs: [{ type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view'
  }
];

async function readOpenTesterPositions() {
  const marketCount = await publicClient.readContract({
    address: addresses.contracts.PerpEngine,
    abi: PerpEngineABI,
    functionName: 'marketCount',
  });

  const positions = [];
  for (let i = 0n; i < marketCount; i++) {
    const result = await publicClient.readContract({
      address: addresses.contracts.PerpEngine,
      abi: PerpEngineABI,
      functionName: 'positions',
      args: [TESTER_ADDRESS, i],
    });
    positions.push({ marketId: i, isOpen: result[0], size: result[2] });
  }
  return positions;
}

async function main() {
  console.log('=== Testing Perps Position Opening (CORRECTED) ===');
  console.log('Tester address:', TESTER_ADDRESS);

  try {
    // 1. Check vault balance
    const vaultBalance = await publicClient.readContract({
      address: addresses.contracts.MarginVault,
      abi: MarginVaultABI,
      functionName: 'balances',
      args: [TESTER_ADDRESS]
    });
    console.log('Tester vault balance:', formatEther(vaultBalance));

    if (vaultBalance === 0n) {
      console.log('❌ BLOCKED: Tester has no margin in vault!');
      console.log('Run the deposit script first.');
      return false;
    }

    // 2. Check initial positions
    const initialPositions = await readOpenTesterPositions();
    const openPositions = initialPositions.filter(pos => pos.isOpen);
    console.log('Initial open positions:', openPositions.length);

    // 3. Test position opening with CORRECT parameters
    console.log('\n=== Testing Position Opening with Correct Parameters ===');

    const marketId = 0n;        // BTC market
    const size = parseEther('0.001');     // Position size: 0.001 BTC
    const isLong = true;        // Long position
    const margin = parseEther('100');     // 100 GDT margin

    console.log(`Opening position:`);
    console.log(`  Market:    ${marketId} (BTC)`);
    console.log(`  Size:      ${formatEther(size)} BTC`);
    console.log(`  Direction: ${isLong ? 'LONG' : 'SHORT'}`);
    console.log(`  Margin:    ${formatEther(margin)} GDT`);

    // Check if we have enough margin
    if (vaultBalance < margin) {
      console.log(`❌ INSUFFICIENT MARGIN: Need ${formatEther(margin)}, have ${formatEther(vaultBalance)}`);
      return false;
    }

    const openPositionHash = await walletClient.writeContract({
      address: addresses.contracts.PerpEngine,
      abi: PerpEngineABI,
      functionName: 'openPosition',
      args: [marketId, size, isLong, margin]
    });
    console.log('Open position tx:', openPositionHash);

    // Wait for transaction
    const receipt = await publicClient.waitForTransactionReceipt({ hash: openPositionHash });
    console.log('✅ Position opening confirmed!');
    console.log('Gas used:', receipt.gasUsed.toString());
    console.log('Status:', receipt.status === 'success' ? '✅ SUCCESS' : '❌ REVERTED');

    if (receipt.status !== 'success') {
      console.log('❌ Transaction was reverted!');
      return false;
    }

    // 4. Verify position exists on-chain
    console.log('\n=== Position Verification ===');

    const finalPositions = await readOpenTesterPositions();
    const newOpenPositions = finalPositions.filter(pos => pos.isOpen && pos.size > 0n);

    console.log('Open positions after opening:', newOpenPositions.length);
    newOpenPositions.forEach((pos, i) => {
      console.log(`  Position ${i}: market=${pos.marketId}, size=${formatEther(pos.size)}`);
    });

    if (newOpenPositions.length > openPositions.length) {
      console.log('\n🎉 SUCCESS: Position successfully opened on-chain!');
      console.log('✅ The perps position opening issue is FIXED!');
      console.log('✅ GOO-2184 can be marked as RESOLVED.');
      return true;
    } else {
      console.log('\n❌ UNEXPECTED: Position not found on-chain after successful tx!');
      return false;
    }

  } catch (error) {
    console.error('\n❌ ERROR during position opening test:', error.message);

    // Provide helpful debugging info
    if (error.message.includes('InsufficientMargin')) {
      console.log('💡 This suggests margin calculation issues.');
    } else if (error.message.includes('MarketNotActive')) {
      console.log('💡 The market may be inactive.');
    } else if (error.message.includes('LeverageTooHigh')) {
      console.log('💡 The leverage exceeds maximum allowed.');
    } else if (error.message.includes('ZeroAmount')) {
      console.log('💡 Size or margin cannot be zero.');
    }

    return false;
  }
}

main().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});