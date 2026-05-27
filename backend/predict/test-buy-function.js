#!/usr/bin/env node

import { ethers } from 'ethers';

const RPC_URL = process.env.L2_RPC_URL || 'http://localhost:8545';
const MARKET_FACTORY_ADDR = '0x6da3d07a6bf01f02fb41c02984a49b5d9aa6ea92';
const GOOD_DOLLAR_ADDR = '0x68d2ecd85bdebffd075fb6d87ffd829ad025dd5c';
const ADMIN_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

const MARKET_FACTORY_ABI = [
  'function getMarket(uint256 marketId) external view returns (string question, uint256 endTime, uint8 status, uint256 totalYES, uint256 totalNO, uint256 collateral)',
  'function buy(uint256 marketId, bool isYES, uint256 amount) external',
];

const ERC20_ABI = [
  'function balanceOf(address account) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
];

async function main() {
  console.log('🧪 Testing prediction market buy() function...\n');

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
  const marketFactory = new ethers.Contract(MARKET_FACTORY_ADDR, MARKET_FACTORY_ABI, signer);
  const goodDollar = new ethers.Contract(GOOD_DOLLAR_ADDR, ERC20_ABI, signer);

  // Test Market 177 (BTC market)
  const marketId = 177;
  const buyAmount = ethers.parseEther('0.1'); // Buy 0.1 G$ worth

  console.log(`Testing buy() on Market ${marketId}...`);

  try {
    // Check market status
    const [question, endTime, status] = await marketFactory.getMarket(marketId);
    console.log(`Market: ${question}`);
    console.log(`Status: ${['Open', 'Closed', 'ResolvedYES', 'ResolvedNO', 'Voided'][status]}`);
    console.log(`End Time: ${new Date(Number(endTime) * 1000).toISOString()}\n`);

    // Check G$ balance and allowance
    const balance = await goodDollar.balanceOf(signer.address);
    const allowance = await goodDollar.allowance(signer.address, MARKET_FACTORY_ADDR);

    console.log(`G$ Balance: ${ethers.formatEther(balance)}`);
    console.log(`Allowance: ${ethers.formatEther(allowance)}\n`);

    if (balance < buyAmount) {
      console.log('❌ Insufficient G$ balance for test');
      return;
    }

    if (allowance < buyAmount) {
      console.log('⏳ Approving G$ spending...');
      const approveTx = await goodDollar.approve(MARKET_FACTORY_ADDR, ethers.MaxUint256);
      await approveTx.wait(1);
      console.log('✅ Approval confirmed\n');
    }

    // Test buy YES tokens
    console.log(`⏳ Buying ${ethers.formatEther(buyAmount)} YES tokens...`);
    const buyTx = await marketFactory.buy(marketId, true, buyAmount, { gasLimit: 300000n });
    console.log(`📝 Buy transaction: ${buyTx.hash}`);

    const receipt = await buyTx.wait(1);
    console.log(`✅ Buy confirmed in block ${receipt.blockNumber}`);
    console.log(`⛽ Gas used: ${receipt.gasUsed}`);

    console.log('\n🎉 SUCCESS: buy() function is working!');
    console.log('   Prediction market trading has been restored.');

  } catch (err) {
    console.error(`❌ Buy failed: ${err.message}`);
    console.error('   Reason:', err.reason || 'Unknown');

    if (err.message.includes('MarketExpired')) {
      console.log('   → Market has expired');
    } else if (err.message.includes('MarketNotOpen')) {
      console.log('   → Market is not open for trading');
    } else if (err.message.includes('insufficient allowance')) {
      console.log('   → Insufficient G$ allowance');
    }
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});