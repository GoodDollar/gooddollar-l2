#!/usr/bin/env node

import { ethers } from 'ethers';

const RPC_URL = process.env.L2_RPC_URL || 'http://localhost:8545';
const MARKET_FACTORY_ADDR = '0x6da3d07a6bf01f02fb41c02984a49b5d9aa6ea92';
const GOOD_DOLLAR_ADDR = '0x68d2ecd85bdebffd075fb6d87ffd829ad025dd5c';
const ADMIN_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

const MARKET_FACTORY_ABI = [
  'function getMarket(uint256 marketId) external view returns (string question, uint256 endTime, uint8 status, uint256 totalYES, uint256 totalNO, uint256 collateral)',
  'function buy(uint256 marketId, bool isYES, uint256 amount) external',
  'function admin() external view returns (address)',
  'function goodDollar() external view returns (address)',
  'function tokens() external view returns (address)',
  'function feeSplitter() external view returns (address)',
];

const ERC20_ABI = [
  'function balanceOf(address account) external view returns (uint256)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) external returns (bool)',
];

async function main() {
  console.log('🔍 Deep debugging buy() failure...\n');

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
  const marketFactory = new ethers.Contract(MARKET_FACTORY_ADDR, MARKET_FACTORY_ABI, signer);
  const goodDollar = new ethers.Contract(GOOD_DOLLAR_ADDR, ERC20_ABI, signer);

  const marketId = 177;
  const buyAmount = ethers.parseEther('0.1');
  const blockNumber = await provider.getBlockNumber();
  const block = await provider.getBlock(blockNumber);
  const currentTime = block.timestamp;

  console.log(`Current time: ${currentTime} (${new Date(currentTime * 1000).toISOString()})`);
  console.log(`Market ID: ${marketId}`);
  console.log(`Buy amount: ${ethers.formatEther(buyAmount)} G$`);
  console.log(`Buyer address: ${signer.address}\n`);

  // 1. Check market state
  console.log('📊 MARKET STATE:');
  try {
    const [question, endTime, status, totalYES, totalNO, collateral] = await marketFactory.getMarket(marketId);
    const isExpired = currentTime >= endTime;

    console.log(`  Question: ${question}`);
    console.log(`  End time: ${endTime} (${new Date(Number(endTime) * 1000).toISOString()})`);
    console.log(`  Status: ${['Open', 'Closed', 'ResolvedYES', 'ResolvedNO', 'Voided'][status]}`);
    console.log(`  Is expired: ${isExpired}`);
    console.log(`  Total YES: ${ethers.formatEther(totalYES)}`);
    console.log(`  Total NO: ${ethers.formatEther(totalNO)}`);
    console.log(`  Collateral: ${ethers.formatEther(collateral)}\n`);

    // Check buy() requirements
    console.log('✅ Market state checks:');
    console.log(`  ✅ Amount > 0: ${buyAmount > 0n}`);
    console.log(`  ${status === 0 ? '✅' : '❌'} Status is Open: ${status === 0}`);
    console.log(`  ${!isExpired ? '✅' : '❌'} Not expired: ${!isExpired}\n`);

  } catch (err) {
    console.error('❌ Failed to get market state:', err.message);
    return;
  }

  // 2. Check contract configuration
  console.log('⚙️ CONTRACT CONFIG:');
  try {
    const admin = await marketFactory.admin();
    const goodDollarAddr = await marketFactory.goodDollar();
    const tokensAddr = await marketFactory.tokens();
    const feeSplitterAddr = await marketFactory.feeSplitter();

    console.log(`  Admin: ${admin}`);
    console.log(`  GoodDollar: ${goodDollarAddr} (expected: ${GOOD_DOLLAR_ADDR})`);
    console.log(`  Tokens: ${tokensAddr}`);
    console.log(`  Fee Splitter: ${feeSplitterAddr}`);
    console.log(`  Config matches: ${goodDollarAddr.toLowerCase() === GOOD_DOLLAR_ADDR.toLowerCase()}\n`);

  } catch (err) {
    console.error('❌ Failed to get contract config:', err.message);
  }

  // 3. Check GoodDollar state
  console.log('💰 GOODDOLLAR STATE:');
  try {
    const balance = await goodDollar.balanceOf(signer.address);
    const allowance = await goodDollar.allowance(signer.address, MARKET_FACTORY_ADDR);

    console.log(`  Balance: ${ethers.formatEther(balance)} G$`);
    console.log(`  Allowance: ${ethers.formatEther(allowance)} G$`);
    console.log(`  Sufficient balance: ${balance >= buyAmount}`);
    console.log(`  Sufficient allowance: ${allowance >= buyAmount}\n`);

    // Test direct GoodDollar transfer
    console.log('🧪 Testing GoodDollar transferFrom...');
    try {
      const transferTx = await goodDollar.transferFrom(signer.address, MARKET_FACTORY_ADDR, buyAmount, { gasLimit: 100000n });
      console.log(`  ✅ Direct transfer successful: ${transferTx.hash}`);
      await transferTx.wait(1);

      // Transfer back for next test
      const marketFactoryGD = new ethers.Contract(GOOD_DOLLAR_ADDR, ERC20_ABI, signer);
      const code = await provider.getCode(MARKET_FACTORY_ADDR);
      console.log(`  MarketFactory code length: ${code.length} (should be > 2)`);

    } catch (transferErr) {
      console.error(`  ❌ Direct transfer failed: ${transferErr.message}`);
    }

  } catch (err) {
    console.error('❌ Failed to check GoodDollar state:', err.message);
  }

  // 4. Check contract deployment
  console.log('🏗️ CONTRACT DEPLOYMENT:');
  try {
    const code = await provider.getCode(MARKET_FACTORY_ADDR);
    const gdCode = await provider.getCode(GOOD_DOLLAR_ADDR);

    console.log(`  MarketFactory code: ${code.length} bytes`);
    console.log(`  GoodDollar code: ${gdCode.length} bytes`);
    console.log(`  Both deployed: ${code.length > 2 && gdCode.length > 2}\n`);

  } catch (err) {
    console.error('❌ Failed to check contract deployment:', err.message);
  }

  // 5. Try static call to get better error
  console.log('🔍 STATIC CALL TEST:');
  try {
    await marketFactory.buy.staticCall(marketId, true, buyAmount);
    console.log('  ✅ Static call succeeded - no revert reason');
  } catch (staticErr) {
    console.error(`  ❌ Static call failed: ${staticErr.message}`);
    if (staticErr.reason) {
      console.error(`  Reason: ${staticErr.reason}`);
    }
    if (staticErr.code) {
      console.error(`  Error code: ${staticErr.code}`);
    }
  }

  console.log('\n='.repeat(50));
  console.log('Debug complete');
  console.log('='.repeat(50));
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});