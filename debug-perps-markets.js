#!/usr/bin/env node

/**
 * Debug script to check perps markets state and oracle prices
 */

const { createPublicClient, http, formatEther, keccak256, toHex } = require('viem');
const { readFileSync } = require('fs');

// Load addresses
const addresses = JSON.parse(readFileSync('/home/goodclaw/gooddollar-l2/op-stack/addresses.json', 'utf8'));

const publicClient = createPublicClient({
  transport: http('https://rpc.goodclaw.org')
});

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
    name: 'markets',
    inputs: [{ type: 'uint256' }],
    outputs: [
      { type: 'bytes32', name: 'marketKey' },
      { type: 'bytes32', name: 'oracleKey' },
      { type: 'uint256', name: 'maxLeverage' },
      { type: 'bool', name: 'isActive' }
    ],
    stateMutability: 'view'
  }
];

const PerpPriceOracleABI = [
  {
    type: 'function',
    name: 'getPrice',
    inputs: [{ type: 'bytes32', name: 'key' }],
    outputs: [
      { type: 'uint256', name: 'markPrice' },
      { type: 'uint256', name: 'indexPrice' }
    ],
    stateMutability: 'view'
  }
];

async function main() {
  console.log('=== Debugging Perps Markets and Oracles ===');

  try {
    // Check market count
    const marketCount = await publicClient.readContract({
      address: addresses.contracts.PerpEngine,
      abi: PerpEngineABI,
      functionName: 'marketCount',
    });

    console.log(`Total markets: ${marketCount}`);

    if (marketCount === 0n) {
      console.log('❌ NO MARKETS: PerpEngine has no markets configured!');
      return false;
    }

    // Check each market
    console.log('\n=== Market Details ===');
    const tickers = ['BTC', 'ETH', 'SOL', 'BNB', 'MATIC', 'ARB'];

    for (let i = 0n; i < marketCount; i++) {
      try {
        const marketInfo = await publicClient.readContract({
          address: addresses.contracts.PerpEngine,
          abi: PerpEngineABI,
          functionName: 'markets',
          args: [i]
        });

        const [marketKey, oracleKey, maxLeverage, isActive] = marketInfo;
        const ticker = tickers[Number(i)] || 'UNKNOWN';

        console.log(`\nMarket ${i} (${ticker}):`);
        console.log(`  Market Key:   ${marketKey}`);
        console.log(`  Oracle Key:   ${oracleKey}`);
        console.log(`  Max Leverage: ${maxLeverage}x`);
        console.log(`  Active:       ${isActive ? '✅' : '❌'}`);

        // Verify the market key matches expected ticker
        const expectedKey = keccak256(toHex(ticker));
        const keyMatches = marketKey.toLowerCase() === expectedKey.toLowerCase();
        console.log(`  Key matches:  ${keyMatches ? '✅' : '❌'} (expected: ${expectedKey})`);

        if (!isActive) {
          console.log(`  ⚠️  Market ${ticker} is INACTIVE!`);
        }

        // Check oracle prices
        try {
          const [markPrice, indexPrice] = await publicClient.readContract({
            address: addresses.contracts.PerpPriceOracle,
            abi: PerpPriceOracleABI,
            functionName: 'getPrice',
            args: [oracleKey]
          });

          console.log(`  Mark Price:   $${(Number(markPrice) / 1e8).toFixed(2)}`);
          console.log(`  Index Price:  $${(Number(indexPrice) / 1e8).toFixed(2)}`);

          if (markPrice === 0n || indexPrice === 0n) {
            console.log(`  ❌ Zero prices detected for ${ticker}!`);
          }

        } catch (oracleError) {
          console.log(`  ❌ Oracle error: ${oracleError.message}`);
        }

      } catch (marketError) {
        console.log(`\n❌ Error reading market ${i}: ${marketError.message}`);
      }
    }

    return true;

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    return false;
  }
}

main().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});