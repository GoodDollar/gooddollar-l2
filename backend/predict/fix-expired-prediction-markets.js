#!/usr/bin/env node

// ============================================================
// Fix Expired Prediction Markets - GOO-2286
// ============================================================
// Close all expired markets to restore prediction market trading

import { ethers } from 'ethers';

const RPC_URL = process.env.L2_RPC_URL || 'http://localhost:8545';
const MARKET_FACTORY_ADDR = '0x6da3d07a6bf01f02fb41c02984a49b5d9aa6ea92';
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Default hardhat key

const MARKET_FACTORY_ABI = [
  'function marketCount() external view returns (uint256)',
  'function getMarket(uint256 marketId) external view returns (string question, uint256 endTime, uint8 status, uint256 totalYES, uint256 totalNO, uint256 collateral)',
  'function closeMarket(uint256 marketId) external',
  'function createMarket(string question, uint256 endTime, address resolver) external returns (uint256 marketId)',
];

async function main() {
  console.log('=======================================================');
  console.log('  Fixing Expired Prediction Markets - GOO-2286');
  console.log('  Contract: ' + MARKET_FACTORY_ADDR);
  console.log('=======================================================\n');

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
  const marketFactory = new ethers.Contract(MARKET_FACTORY_ADDR, MARKET_FACTORY_ABI, signer);

  // Get current time
  const blockNumber = await provider.getBlockNumber();
  const block = await provider.getBlock(blockNumber);
  const currentTime = block.timestamp;

  console.log(`Current time: ${currentTime} (${new Date(currentTime * 1000).toISOString()})`);
  console.log(`Admin address: ${signer.address}\n`);

  // Get market count
  const marketCount = await marketFactory.marketCount();
  console.log(`Total markets: ${marketCount}\n`);

  // Phase 1: Close expired markets
  console.log('🔒 PHASE 1: Closing expired markets...');
  console.log('='.repeat(50));

  let closedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < marketCount; i++) {
    try {
      const [question, endTime, status] = await marketFactory.getMarket(i);
      const isExpired = currentTime >= endTime;
      const statusName = ['Open', 'Closed', 'ResolvedYES', 'ResolvedNO', 'Voided'][status];

      if (status === 0 && isExpired) { // Open and expired
        console.log(`Market ${i}: ${question.substring(0, 50)}... (expired)`);

        try {
          const tx = await marketFactory.closeMarket(i, { gasLimit: 200000n });
          console.log(`  ✅ Closing tx: ${tx.hash}`);
          await tx.wait(1);
          closedCount++;
        } catch (closeErr) {
          console.log(`  ❌ Failed to close: ${closeErr.message}`);
          errorCount++;
        }
      } else if (status === 0) {
        console.log(`Market ${i}: Still valid (expires ${new Date(Number(endTime) * 1000).toISOString()})`);
      }
    } catch (err) {
      console.error(`❌ Failed to process market ${i}:`, err.message);
      errorCount++;
    }
  }

  console.log('\n📈 PHASE 1 RESULTS:');
  console.log(`Markets closed: ${closedCount}`);
  console.log(`Errors: ${errorCount}\n`);

  // Phase 2: Create new test markets
  console.log('🆕 PHASE 2: Creating new test markets...');
  console.log('='.repeat(50));

  const now = Math.floor(Date.now() / 1000);
  const testMarkets = [
    {
      question: 'Will BTC exceed $100k by end of 2026?',
      duration: 24 * 60 * 60, // 24 hours
    },
    {
      question: 'Will ETH reach $5000 in the next month?',
      duration: 30 * 24 * 60 * 60, // 30 days
    },
    {
      question: 'Will GoodDollar L2 launch this quarter?',
      duration: 7 * 24 * 60 * 60, // 7 days
    },
  ];

  let createdCount = 0;

  for (const market of testMarkets) {
    try {
      const endTime = now + market.duration;
      const tx = await marketFactory.createMarket(
        market.question,
        BigInt(endTime),
        ethers.ZeroAddress, // admin is resolver
        { gasLimit: 500000n }
      );

      console.log(`✅ Created: "${market.question}"`);
      console.log(`   Tx: ${tx.hash}`);
      console.log(`   Expires: ${new Date(endTime * 1000).toISOString()}\n`);

      await tx.wait(1);
      createdCount++;
    } catch (err) {
      console.error(`❌ Failed to create market: ${market.question}`);
      console.error(`   Error: ${err.message}\n`);
    }
  }

  console.log('📈 PHASE 2 RESULTS:');
  console.log(`New markets created: ${createdCount}\n`);

  // Phase 3: Verify fix
  console.log('🔍 PHASE 3: Verifying fix...');
  console.log('='.repeat(50));

  const newMarketCount = await marketFactory.marketCount();
  let openMarkets = 0;
  let validMarkets = 0;

  for (let i = Number(marketCount); i < newMarketCount; i++) {
    try {
      const [question, endTime, status] = await marketFactory.getMarket(i);
      const isExpired = currentTime >= endTime;

      if (status === 0) { // Open
        openMarkets++;
        if (!isExpired) {
          validMarkets++;
          console.log(`✅ Market ${i}: Valid and tradeable`);
          console.log(`   Question: ${question}`);
          console.log(`   Expires: ${new Date(Number(endTime) * 1000).toISOString()}\n`);
        }
      }
    } catch (err) {
      console.error(`❌ Failed to verify market ${i}:`, err.message);
    }
  }

  console.log('🎯 FINAL STATUS:');
  console.log('='.repeat(30));
  console.log(`✅ Markets closed: ${closedCount}`);
  console.log(`✅ New markets: ${createdCount}`);
  console.log(`✅ Valid tradeable markets: ${validMarkets}`);
  console.log(`❌ Errors encountered: ${errorCount}`);

  if (validMarkets > 0) {
    console.log('\n🎉 SUCCESS: Prediction market trading is now restored!');
    console.log('   Users can now buy/sell tokens on the new markets.');
  } else {
    console.log('\n⚠️  WARNING: No valid markets available for trading.');
    console.log('   Additional market creation may be needed.');
  }

  console.log('\n=======================================================');
  console.log('GOO-2286 Fix Complete');
  console.log('=======================================================');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});