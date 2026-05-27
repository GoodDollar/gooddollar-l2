#!/usr/bin/env node

import { ethers } from 'ethers';

const RPC_URL = process.env.L2_RPC_URL || 'http://localhost:8545';

const addresses = {
  'addresses.json GoodDollar': '0x68d2ecd85bdebffd075fb6d87ffd829ad025dd5c',
  'MarketFactory expected GD': '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  'MarketFactory': '0x6da3d07a6bf01f02fb41c02984a49b5d9aa6ea92',
};

async function main() {
  console.log('🔍 Investigating contract deployments...\n');

  const provider = new ethers.JsonRpcProvider(RPC_URL);

  for (const [name, addr] of Object.entries(addresses)) {
    console.log(`${name}:`);
    console.log(`  Address: ${addr}`);

    try {
      const code = await provider.getCode(addr);
      console.log(`  Code length: ${code.length} bytes`);
      console.log(`  Is contract: ${code.length > 2}`);

      if (code.length > 2) {
        // Try basic ERC20 calls if it looks like a token
        if (name.includes('GoodDollar') || name.includes('GD')) {
          try {
            const contract = new ethers.Contract(addr, [
              'function name() view returns (string)',
              'function symbol() view returns (string)',
              'function decimals() view returns (uint8)',
            ], provider);

            const name_result = await contract.name();
            const symbol = await contract.symbol();
            const decimals = await contract.decimals();

            console.log(`  Token name: ${name_result}`);
            console.log(`  Symbol: ${symbol}`);
            console.log(`  Decimals: ${decimals}`);
          } catch (err) {
            console.log(`  ❌ Not a standard ERC20: ${err.message}`);
          }
        }

        // Try MarketFactory-specific calls
        if (name.includes('MarketFactory')) {
          try {
            const contract = new ethers.Contract(addr, [
              'function admin() view returns (address)',
              'function goodDollar() view returns (address)',
              'function marketCount() view returns (uint256)',
            ], provider);

            const admin = await contract.admin();
            const goodDollarAddr = await contract.goodDollar();
            const marketCount = await contract.marketCount();

            console.log(`  Admin: ${admin}`);
            console.log(`  GoodDollar: ${goodDollarAddr}`);
            console.log(`  Market count: ${marketCount}`);
          } catch (err) {
            console.log(`  ❌ MarketFactory calls failed: ${err.message}`);
          }
        }
      } else {
        console.log(`  ❌ No contract deployed`);
      }

    } catch (err) {
      console.error(`  ❌ Error checking: ${err.message}`);
    }

    console.log('');
  }

  // Check if there are other GoodDollar-like contracts
  console.log('🔍 Looking for other potential GoodDollar deployments...');

  // Common deployment addresses (first few deterministic addresses)
  const commonAddrs = [
    '0x5fbdb2315678afecb367f032d93f642f64180aa3', // First deployment
    '0xe7f1725e7734ce288f8367e1bb143e90bb3f0512', // Second deployment
    '0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0', // Third deployment
    '0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9', // Fourth deployment
    '0xdc64a140aa3e981100a9beca4e685f962f0cf6c9', // Fifth deployment
  ];

  for (const addr of commonAddrs) {
    try {
      const code = await provider.getCode(addr);
      if (code.length > 2) {
        try {
          const contract = new ethers.Contract(addr, [
            'function name() view returns (string)',
            'function symbol() view returns (string)',
          ], provider);

          const name = await contract.name();
          const symbol = await contract.symbol();

          if (name.toLowerCase().includes('good') || symbol.toLowerCase().includes('g')) {
            console.log(`  Found potential GoodDollar at ${addr}:`);
            console.log(`    Name: ${name}, Symbol: ${symbol}`);
          }
        } catch {}
      }
    } catch {}
  }

  console.log('\n='.repeat(50));
  console.log('Investigation complete');
  console.log('='.repeat(50));
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});