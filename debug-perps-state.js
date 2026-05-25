#!/usr/bin/env node

/**
 * Debug script to check current perps deployment state
 * Verifies MarginVault collateral address and basic functionality
 */

const { createPublicClient, http } = require('viem');
const { readFileSync } = require('fs');

// Load addresses
const addresses = JSON.parse(readFileSync('/home/goodclaw/gooddollar-l2/op-stack/addresses.json', 'utf8'));

const publicClient = createPublicClient({
  transport: http('https://rpc.goodclaw.org')
});

// MarginVault ABI - just the collateral getter
const MarginVaultABI = [
  {
    type: 'function',
    name: 'collateral',
    inputs: [],
    outputs: [{ type: 'address' }],
    stateMutability: 'view'
  }
];

async function main() {
  console.log('=== Debugging Perps State (GOO-2184) ===');
  console.log('Chain ID:', addresses.chain_id);
  console.log('RPC URL:', addresses.rpc_url);
  console.log('\n=== Contract Addresses ===');
  console.log('GoodDollarToken:', addresses.contracts.GoodDollarToken);
  console.log('MarginVault:    ', addresses.contracts.MarginVault);
  console.log('PerpEngine:     ', addresses.contracts.PerpEngine);

  try {
    // Check MarginVault collateral address
    console.log('\n=== MarginVault Collateral Check ===');
    const collateralAddress = await publicClient.readContract({
      address: addresses.contracts.MarginVault,
      abi: MarginVaultABI,
      functionName: 'collateral'
    });

    console.log('MarginVault.collateral():', collateralAddress);
    console.log('Expected GDT address:    ', addresses.contracts.GoodDollarToken);

    const isCorrect = collateralAddress.toLowerCase() === addresses.contracts.GoodDollarToken.toLowerCase();
    console.log('Collateral matches GDT:', isCorrect ? '✅ YES' : '❌ NO');

    if (!isCorrect) {
      console.log('\n❌ PROBLEM: MarginVault is still using wrong collateral address!');
      console.log('This will cause deposit/position opening to fail.');
      return false;
    }

    // Check if GDT contract has bytecode
    console.log('\n=== GDT Contract Check ===');
    const gdtCode = await publicClient.getBytecode({ address: addresses.contracts.GoodDollarToken });
    const hasGdtCode = gdtCode && gdtCode !== '0x';
    console.log('GDT has bytecode:', hasGdtCode ? '✅ YES' : '❌ NO');

    if (!hasGdtCode) {
      console.log('❌ PROBLEM: GDT contract has no bytecode!');
      return false;
    }

    // Check if collateral contract has bytecode
    console.log('\n=== Collateral Contract Check ===');
    const collateralCode = await publicClient.getBytecode({ address: collateralAddress });
    const hasCollateralCode = collateralCode && collateralCode !== '0x';
    console.log('Collateral has bytecode:', hasCollateralCode ? '✅ YES' : '❌ NO');

    if (!hasCollateralCode) {
      console.log('❌ PROBLEM: Collateral contract has no bytecode!');
      return false;
    }

    console.log('\n✅ SUCCESS: All basic checks passed!');
    console.log('The MarginVault collateral issue appears to be fixed.');
    return true;

  } catch (error) {
    console.error('\n❌ ERROR checking contracts:', error.message);
    return false;
  }
}

main().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});