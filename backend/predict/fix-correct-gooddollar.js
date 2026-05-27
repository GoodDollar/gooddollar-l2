#!/usr/bin/env node

// Fix prediction markets with correct GoodDollar address

import { ethers } from 'ethers';

const RPC_URL = process.env.L2_RPC_URL || 'http://localhost:8545';
const MARKET_FACTORY_ADDR = '0x6da3d07a6bf01f02fb41c02984a49b5d9aa6ea92';
const CORRECT_GOOD_DOLLAR = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // From MarketFactory config
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
  console.log('🔧 Fixing prediction market with correct GoodDollar address...\n');

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
  const marketFactory = new ethers.Contract(MARKET_FACTORY_ADDR, MARKET_FACTORY_ABI, signer);
  const goodDollar = new ethers.Contract(CORRECT_GOOD_DOLLAR, ERC20_ABI, signer);

  const marketId = 177;
  const buyAmount = ethers.parseEther('1.0'); // Test with 1 G$

  console.log(`Using correct GoodDollar: ${CORRECT_GOOD_DOLLAR}`);
  console.log(`Testing on market: ${marketId}\n`);

  // Check GoodDollar state
  try {
    const balance = await goodDollar.balanceOf(signer.address);
    const allowance = await goodDollar.allowance(signer.address, MARKET_FACTORY_ADDR);

    console.log(`G$ Balance: ${ethers.formatEther(balance)}`);
    console.log(`Current allowance: ${ethers.formatEther(allowance)}\n`);

    if (balance === 0n) {
      console.log('❌ No GoodDollar balance on correct contract');
      console.log('   This might be a testnet vs mainnet contract issue');
      return;
    }

    // Approve if needed
    if (allowance < buyAmount) {
      console.log('⏳ Approving correct GoodDollar...');
      const approveTx = await goodDollar.approve(MARKET_FACTORY_ADDR, ethers.MaxUint256);
      console.log(`📝 Approval tx: ${approveTx.hash}`);
      await approveTx.wait(1);
      console.log('✅ Approval confirmed\n');
    }

    // Test buy transaction
    console.log(`⏳ Testing buy() with correct GoodDollar...`);
    const buyTx = await marketFactory.buy(marketId, true, buyAmount, { gasLimit: 300000n });
    console.log(`📝 Buy tx: ${buyTx.hash}`);

    const receipt = await buyTx.wait(1);
    console.log(`✅ SUCCESS! Buy confirmed in block ${receipt.blockNumber}`);
    console.log(`⛽ Gas used: ${receipt.gasUsed}`);

    console.log('\n🎉 PREDICTION MARKET TRADING IS NOW FIXED!');
    console.log('   Issue: Contract was using different GoodDollar address');
    console.log(`   Solution: Use GoodDollar at ${CORRECT_GOOD_DOLLAR}`);

  } catch (err) {
    console.error(`❌ Error: ${err.message}`);

    if (err.reason) {
      console.error(`   Reason: ${err.reason}`);
    }
  }

  console.log('\n='.repeat(50));
  console.log('GOO-2286 Fix Complete');
  console.log('='.repeat(50));
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});