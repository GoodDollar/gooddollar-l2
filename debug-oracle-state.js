#!/usr/bin/env node

/**
 * Debug script to check PerpPriceOracle state and permissions
 */

const { createPublicClient, http, keccak256, toHex } = require('viem');
const { readFileSync } = require('fs');

// Load addresses
const addresses = JSON.parse(readFileSync('/home/goodclaw/gooddollar-l2/op-stack/addresses.json', 'utf8'));

const publicClient = createPublicClient({
  transport: http('https://rpc.goodclaw.org')
});

const PerpPriceOracleABI = [
  {
    type: 'function',
    name: 'isRegistered',
    inputs: [{ type: 'bytes32', name: 'key' }],
    outputs: [{ type: 'bool' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'admin',
    inputs: [],
    outputs: [{ type: 'address' }],
    stateMutability: 'view'
  },
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
  console.log('=== Debugging PerpPriceOracle State ===');
  console.log('Oracle address:', addresses.contracts.PerpPriceOracle);

  try {
    // Check oracle admin
    const admin = await publicClient.readContract({
      address: addresses.contracts.PerpPriceOracle,
      abi: PerpPriceOracleABI,
      functionName: 'admin'
    });
    console.log('Oracle admin:', admin);

    // Check market registrations
    const tickers = ['BTC', 'ETH', 'SOL', 'BNB', 'MATIC', 'ARB'];
    console.log('\n=== Market Registration Status ===');

    for (const ticker of tickers) {
      const key = keccak256(toHex(ticker));
      console.log(`\n${ticker}:`);
      console.log(`  Key: ${key}`);

      try {
        const isRegistered = await publicClient.readContract({
          address: addresses.contracts.PerpPriceOracle,
          abi: PerpPriceOracleABI,
          functionName: 'isRegistered',
          args: [key]
        });
        console.log(`  Registered: ${isRegistered ? '✅' : '❌'}`);

        if (isRegistered) {
          // Try to get price to see the specific error
          try {
            const [markPrice, indexPrice] = await publicClient.readContract({
              address: addresses.contracts.PerpPriceOracle,
              abi: PerpPriceOracleABI,
              functionName: 'getPrice',
              args: [key]
            });
            console.log(`  Mark Price:  $${(Number(markPrice) / 1e8).toFixed(2)}`);
            console.log(`  Index Price: $${(Number(indexPrice) / 1e8).toFixed(2)}`);

            if (markPrice === 0n || indexPrice === 0n) {
              console.log(`  ⚠️  Zero price detected!`);
            }
          } catch (priceError) {
            console.log(`  ❌ getPrice error: ${priceError.message}`);

            // Check if it's a specific error we can identify
            if (priceError.message.includes('execution reverted')) {
              console.log(`  💡 This suggests the market may not have prices set`);
            }
          }
        } else {
          console.log(`  ❌ Market ${ticker} is not registered in oracle!`);
        }

      } catch (regError) {
        console.log(`  ❌ Registration check error: ${regError.message}`);
      }
    }

    // Test with a low-level call to see raw revert data
    console.log('\n=== Raw Contract State Check ===');
    const btcKey = keccak256(toHex('BTC'));

    try {
      // Make a direct eth_call to get more detailed error info
      const result = await publicClient.call({
        to: addresses.contracts.PerpPriceOracle,
        data: `0x41976e09${btcKey.slice(2)}` // getPrice(bytes32) selector + BTC key
      });
      console.log('Raw call result:', result);
    } catch (rawError) {
      console.log('Raw call error:', rawError.message);

      if (rawError.data) {
        console.log('Error data:', rawError.data);
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