#!/usr/bin/env node

import { ethers } from 'ethers';

const RPC_URL = process.env.L2_RPC_URL || 'http://localhost:8545';
const MARKET_FACTORY_ADDR = '0x6da3d07a6bf01f02fb41c02984a49b5d9aa6ea92';

const MARKET_FACTORY_ABI = [
  'function marketCount() external view returns (uint256)',
  'function getMarket(uint256 marketId) external view returns (string question, uint256 endTime, uint8 status, uint256 totalYES, uint256 totalNO, uint256 collateral)',
];

async function main() {
  console.log('Checking recent markets...\n');

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const marketFactory = new ethers.Contract(MARKET_FACTORY_ADDR, MARKET_FACTORY_ABI, provider);

  const blockNumber = await provider.getBlockNumber();
  const block = await provider.getBlock(blockNumber);
  const currentTime = block.timestamp;

  const marketCount = await marketFactory.marketCount();
  console.log(`Current time: ${currentTime} (${new Date(currentTime * 1000).toISOString()})`);
  console.log(`Total markets: ${marketCount}\n`);

  // Check the last 10 markets
  const start = Math.max(0, Number(marketCount) - 10);

  for (let i = start; i < marketCount; i++) {
    try {
      const [question, endTime, status] = await marketFactory.getMarket(i);
      const isExpired = currentTime >= endTime;
      const statusName = ['Open', 'Closed', 'ResolvedYES', 'ResolvedNO', 'Voided'][status];
      const endTimeDate = new Date(Number(endTime) * 1000);
      const timeDiff = Number(endTime) - currentTime;

      console.log(`Market ${i}:`);
      console.log(`  Question: ${question}`);
      console.log(`  Status: ${statusName} ${status === 0 ? (isExpired ? '❌ EXPIRED' : '✅ VALID') : '🔒'}`);
      console.log(`  End Time: ${endTime} (${endTimeDate.toISOString()})`);
      console.log(`  Time Diff: ${timeDiff} seconds (${Math.floor(timeDiff / 3600)} hours)`);
      console.log(`  Current vs End: ${currentTime} >= ${endTime} = ${isExpired}\n`);
    } catch (err) {
      console.error(`Failed to get market ${i}:`, err.message);
    }
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});