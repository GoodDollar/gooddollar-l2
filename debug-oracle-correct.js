#!/usr/bin/env node

/**
 * Debug script using CORRECT Oracle function signatures
 * Based on actual PerpPriceOracle.sol contract
 */

const { createPublicClient, http, keccak256, toHex } = require('viem');
const { readFileSync } = require('fs');

// Load addresses
const addresses = JSON.parse(readFileSync('/home/goodclaw/gooddollar-l2/op-stack/addresses.json', 'utf8'));

const publicClient = createPublicClient({
  transport: http('https://rpc.goodclaw.org')
});

// CORRECT ABI based on actual contract
const PerpPriceOracleABI = [
  {
    type: 'function',
    name: 'getMarkPrice',
    inputs: [{ type: 'bytes32', name: 'key' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getIndexPrice',
    inputs: [{ type: 'bytes32', name: 'key' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'supportedMarkets',
    inputs: [{ type: 'bytes32', name: 'key' }],
    outputs: [{ type: 'bool' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getPriceData',
    inputs: [{ type: 'bytes32', name: 'key' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { type: 'uint256', name: 'markPrice' },
          { type: 'uint256', name: 'indexPrice' },
          { type: 'uint256', name: 'timestamp' },
          { type: 'uint8', name: 'numSources' },
          { type: 'bool', name: 'manualOverride' }
        ]
      }
    ],
    stateMutability: 'view'
  }
];

async function main() {
  console.log('=== Debugging Oracle with CORRECT Function Signatures ===');

  const tickers = ['BTC', 'ETH', 'SOL', 'BNB', 'MATIC', 'ARB'];

  for (const ticker of tickers) {
    const key = keccak256(toHex(ticker));
    console.log(`\n=== ${ticker} Market ===`);
    console.log(`Key: ${key}`);

    try {
      // Check if market is supported (this uses the public mapping)
      const isSupported = await publicClient.readContract({
        address: addresses.contracts.PerpPriceOracle,
        abi: PerpPriceOracleABI,
        functionName: 'supportedMarkets',
        args: [key]
      });
      console.log(`Supported: ${isSupported ? '✅' : '❌'}`);

      if (!isSupported) {
        console.log(`❌ Market ${ticker} is NOT registered!`);
        continue;
      }

      // Try to get price data
      try {
        const priceData = await publicClient.readContract({
          address: addresses.contracts.PerpPriceOracle,
          abi: PerpPriceOracleABI,
          functionName: 'getPriceData',
          args: [key]
        });

        console.log(`Mark Price:    $${(Number(priceData.markPrice) / 1e8).toFixed(2)}`);
        console.log(`Index Price:   $${(Number(priceData.indexPrice) / 1e8).toFixed(2)}`);
        console.log(`Timestamp:     ${priceData.timestamp}`);
        console.log(`Manual Override: ${priceData.manualOverride ? '✅' : '❌'}`);

        if (priceData.markPrice === 0n || priceData.indexPrice === 0n) {
          console.log(`❌ ZERO PRICES detected for ${ticker}!`);
        }

        // Test individual price getters
        try {
          const markPrice = await publicClient.readContract({
            address: addresses.contracts.PerpPriceOracle,
            abi: PerpPriceOracleABI,
            functionName: 'getMarkPrice',
            args: [key]
          });
          console.log(`✅ getMarkPrice works: $${(Number(markPrice) / 1e8).toFixed(2)}`);
        } catch (markError) {
          console.log(`❌ getMarkPrice failed: ${markError.message}`);
        }

        try {
          const indexPrice = await publicClient.readContract({
            address: addresses.contracts.PerpPriceOracle,
            abi: PerpPriceOracleABI,
            functionName: 'getIndexPrice',
            args: [key]
          });
          console.log(`✅ getIndexPrice works: $${(Number(indexPrice) / 1e8).toFixed(2)}`);
        } catch (indexError) {
          console.log(`❌ getIndexPrice failed: ${indexError.message}`);
        }

      } catch (dataError) {
        console.log(`❌ getPriceData failed: ${dataError.message}`);
      }

    } catch (supportError) {
      console.log(`❌ supportedMarkets check failed: ${supportError.message}`);
    }
  }

  console.log('\n=== Summary ===');
  console.log('If markets are not supported, they need to be registered.');
  console.log('If prices are zero, they need to be set via setManualPrice.');

  return true;
}

main().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});