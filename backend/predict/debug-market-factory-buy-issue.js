#!/usr/bin/env node

// ============================================================
// Debug MarketFactory buy() Issue - GOO-2286
// ============================================================
// Investigate why buy() function is reverting on all trades
// Contract: 0x6da3d07a6bf01f02fb41c02984a49b5d9aa6ea92

import { ethers } from 'ethers';

const RPC_URL = process.env.L2_RPC_URL || 'http://localhost:8545';
const MARKET_FACTORY_ADDR = '0x6da3d07a6bf01f02fb41c02984a49b5d9aa6ea92';
const GOOD_DOLLAR_ADDR = '0x68d2ecd85bdebffd075fb6d87ffd829ad025dd5c';

// Minimal ABIs for investigation
const MARKET_FACTORY_ABI = [
  'function marketCount() external view returns (uint256)',
  'function getMarket(uint256 marketId) external view returns (string question, uint256 endTime, uint8 status, uint256 totalYES, uint256 totalNO, uint256 collateral)',
  'function buy(uint256 marketId, bool isYES, uint256 amount) external',
];

const ERC20_ABI = [
  'function balanceOf(address account) external view returns (uint256)',
  'function allowance(address owner, address spender) external view returns (uint256)',
];

async function main() {
  console.log('=======================================================');
  console.log('  MarketFactory Buy() Debug - GOO-2286');
  console.log('  Contract: ' + MARKET_FACTORY_ADDR);
  console.log('=======================================================\n');

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const marketFactory = new ethers.Contract(MARKET_FACTORY_ADDR, MARKET_FACTORY_ABI, provider);
  const goodDollar = new ethers.Contract(GOOD_DOLLAR_ADDR, ERC20_ABI, provider);

  // Get current block info
  const blockNumber = await provider.getBlockNumber();
  const block = await provider.getBlock(blockNumber);
  const currentTime = block.timestamp;

  console.log(`Current block: ${blockNumber}`);
  console.log(`Current time: ${currentTime} (${new Date(currentTime * 1000).toISOString()})\n`);

  // Check market count
  let marketCount;
  try {
    marketCount = await marketFactory.marketCount();
    console.log(`Total markets: ${marketCount}\n`);
  } catch (err) {
    console.error('❌ Failed to get market count:', err.message);
    return;
  }

  if (marketCount === 0n) {
    console.log('❌ NO MARKETS FOUND - This is the issue! No markets exist for trading.');
    console.log('   buy() function fails because there are no market IDs to trade on.\n');
    console.log('💡 SOLUTION: Create markets first before attempting to trade.');
    return;
  }

  // Check each market's status
  console.log('📊 MARKET STATUS ANALYSIS:');
  console.log('='.repeat(50));

  const statusMap = ['Open', 'Closed', 'ResolvedYES', 'ResolvedNO', 'Voided'];
  let openMarkets = 0;
  let expiredMarkets = 0;
  let closedMarkets = 0;
  let resolvedMarkets = 0;

  for (let i = 0; i < marketCount; i++) {
    try {
      const [question, endTime, status, totalYES, totalNO, collateral] = await marketFactory.getMarket(i);
      const statusName = statusMap[status] || `Unknown(${status})`;
      const isExpired = currentTime >= endTime;
      const endTimeStr = new Date(Number(endTime) * 1000).toISOString();

      console.log(`Market ${i}:`);
      console.log(`  Question: ${question.substring(0, 60)}${question.length > 60 ? '...' : ''}`);
      console.log(`  Status: ${statusName} ${status === 0 ? '✅' : status === 1 ? '🔒' : '🏁'}`);
      console.log(`  End Time: ${endTime} (${endTimeStr})`);
      console.log(`  Expired: ${isExpired ? '❌ YES' : '✅ NO'}`);
      console.log(`  YES/NO: ${ethers.formatEther(totalYES)}/${ethers.formatEther(totalNO)}`);
      console.log(`  Collateral: ${ethers.formatEther(collateral)} G$\n`);

      if (status === 0) openMarkets++;
      if (isExpired) expiredMarkets++;
      if (status === 1) closedMarkets++;
      if (status >= 2) resolvedMarkets++;

    } catch (err) {
      console.error(`❌ Failed to get market ${i}:`, err.message);
    }
  }

  console.log('📈 SUMMARY:');
  console.log('='.repeat(30));
  console.log(`Total markets: ${marketCount}`);
  console.log(`Open markets: ${openMarkets}`);
  console.log(`Expired markets: ${expiredMarkets}`);
  console.log(`Closed markets: ${closedMarkets}`);
  console.log(`Resolved markets: ${resolvedMarkets}\n`);

  // Determine the issue
  if (openMarkets === 0) {
    console.log('❌ ISSUE IDENTIFIED: NO OPEN MARKETS');
    console.log('   All markets are either expired, closed, or resolved.');
    console.log('   buy() function reverts with MarketNotOpen error.\n');

    if (expiredMarkets > 0) {
      console.log('💡 SOLUTION: Markets have expired and need to be closed first,');
      console.log('   then new markets need to be created for trading.');
    } else if (closedMarkets > 0 || resolvedMarkets > 0) {
      console.log('💡 SOLUTION: Create new open markets for trading.');
    }
  } else {
    console.log('🔍 Markets are open, investigating other potential issues...\n');

    // Check if it's a token approval issue
    // Use admin address as a test case
    const adminAddr = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    try {
      const balance = await goodDollar.balanceOf(adminAddr);
      const allowance = await goodDollar.allowance(adminAddr, MARKET_FACTORY_ADDR);

      console.log(`Test address: ${adminAddr}`);
      console.log(`G$ balance: ${ethers.formatEther(balance)}`);
      console.log(`G$ allowance for MarketFactory: ${ethers.formatEther(allowance)}\n`);

      if (balance === 0n) {
        console.log('❌ POTENTIAL ISSUE: Test address has no G$ balance');
      }
      if (allowance === 0n) {
        console.log('❌ POTENTIAL ISSUE: No G$ allowance for MarketFactory');
        console.log('   Users need to approve G$ spending first.');
      }

    } catch (err) {
      console.error('❌ Failed to check token state:', err.message);
    }
  }

  console.log('\n=======================================================');
  console.log('Debug complete. Check the analysis above.');
  console.log('=======================================================');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});