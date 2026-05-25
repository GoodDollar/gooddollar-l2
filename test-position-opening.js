#!/usr/bin/env node

/**
 * Test script to simulate perps position opening
 * Replicates what the E2E test does to open a position
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

// Minimal ABIs for our test
const GoodDollarTokenABI = [
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'approve',
    inputs: [{ type: 'address', name: 'spender' }, { type: 'uint256', name: 'amount' }],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable'
  }
];

const MarginVaultABI = [
  {
    type: 'function',
    name: 'deposit',
    inputs: [{ type: 'uint256', name: 'amount' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'balances',
    inputs: [{ type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view'
  }
];

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
      { type: 'int256', name: 'sizeDelta' },
      { type: 'uint256', name: 'acceptablePrice' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
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
  console.log('=== Testing Perps Position Opening (GOO-2184) ===');
  console.log('Tester address:', TESTER_ADDRESS);

  try {
    // 1. Check initial state
    console.log('\n=== Initial State Check ===');

    const gdtBalance = await publicClient.readContract({
      address: addresses.contracts.GoodDollarToken,
      abi: GoodDollarTokenABI,
      functionName: 'balanceOf',
      args: [TESTER_ADDRESS]
    });
    console.log('Tester GDT balance:', formatEther(gdtBalance));

    const vaultBalance = await publicClient.readContract({
      address: addresses.contracts.MarginVault,
      abi: MarginVaultABI,
      functionName: 'balances',
      args: [TESTER_ADDRESS]
    });
    console.log('Tester vault balance:', formatEther(vaultBalance));

    const initialPositions = await readOpenTesterPositions();
    const openPositions = initialPositions.filter(pos => pos.isOpen);
    console.log('Open positions:', openPositions.length);

    if (gdtBalance === 0n) {
      console.log('❌ BLOCKED: Tester has no GDT balance!');
      return false;
    }

    // 2. Test deposit (if needed)
    const depositAmount = parseEther('1000'); // 1000 GDT

    if (vaultBalance < depositAmount) {
      console.log('\n=== Testing Margin Deposit ===');

      // Approve GDT spending
      console.log('Approving GDT spending...');
      const approveHash = await walletClient.writeContract({
        address: addresses.contracts.GoodDollarToken,
        abi: GoodDollarTokenABI,
        functionName: 'approve',
        args: [addresses.contracts.MarginVault, depositAmount]
      });
      console.log('Approve tx:', approveHash);

      // Wait for approval
      await publicClient.waitForTransactionReceipt({ hash: approveHash });
      console.log('✅ Approval confirmed');

      // Deposit to vault
      console.log('Depositing to vault...');
      const depositHash = await walletClient.writeContract({
        address: addresses.contracts.MarginVault,
        abi: MarginVaultABI,
        functionName: 'deposit',
        args: [depositAmount]
      });
      console.log('Deposit tx:', depositHash);

      // Wait for deposit
      await publicClient.waitForTransactionReceipt({ hash: depositHash });
      console.log('✅ Deposit confirmed');

      // Check new vault balance
      const newVaultBalance = await publicClient.readContract({
        address: addresses.contracts.MarginVault,
        abi: MarginVaultABI,
        functionName: 'balances',
        args: [TESTER_ADDRESS]
      });
      console.log('New vault balance:', formatEther(newVaultBalance));
    } else {
      console.log('\n=== Sufficient Vault Balance ===');
      console.log('Tester already has sufficient margin in vault');
    }

    // 3. Test position opening
    console.log('\n=== Testing Position Opening ===');

    const marketId = 0n; // BTC market
    const sizeDelta = parseEther('0.001'); // Small long position
    const acceptablePrice = parseEther('100000'); // High acceptable price

    console.log(`Opening position: market=${marketId}, size=${formatEther(sizeDelta)}, maxPrice=${formatEther(acceptablePrice)}`);

    const openPositionHash = await walletClient.writeContract({
      address: addresses.contracts.PerpEngine,
      abi: PerpEngineABI,
      functionName: 'openPosition',
      args: [marketId, sizeDelta, acceptablePrice]
    });
    console.log('Open position tx:', openPositionHash);

    // Wait for position opening
    const receipt = await publicClient.waitForTransactionReceipt({ hash: openPositionHash });
    console.log('✅ Position opening confirmed');
    console.log('Gas used:', receipt.gasUsed.toString());

    // 4. Verify position exists on-chain
    console.log('\n=== Position Verification ===');

    const finalPositions = await readOpenTesterPositions();
    const newOpenPositions = finalPositions.filter(pos => pos.isOpen && pos.size > 0n);

    console.log('Open positions after opening:', newOpenPositions.length);
    newOpenPositions.forEach((pos, i) => {
      console.log(`  Position ${i}: market=${pos.marketId}, size=${formatEther(pos.size)}`);
    });

    if (newOpenPositions.length > openPositions.length) {
      console.log('✅ SUCCESS: Position successfully opened on-chain!');
      console.log('The perps position opening issue appears to be FIXED.');
      return true;
    } else {
      console.log('❌ FAIL: Position not found on-chain after opening!');
      return false;
    }

  } catch (error) {
    console.error('\n❌ ERROR during position opening test:', error.message);
    if (error.message.includes('insufficient margin')) {
      console.log('This suggests MarginVault deposit may have failed.');
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