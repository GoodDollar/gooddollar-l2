import { ethers } from 'ethers';

const RPC_URL = 'http://localhost:8545';
const NEW_MF = '0x2fe9Dfa9FaF3Ebcc293Df4832BCAd687999CD63E';
const GDT    = '0x68d2ecd85bdebffd075fb6d87ffd829ad025dd5c';
const PK     = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

const MF_ABI = [
  'function createMarket(string,uint256,address) external returns (uint256)',
  'function buy(uint256,bool,uint256) external',
  'function getMarket(uint256) external view returns (string,uint256,uint8,uint256,uint256,uint256)',
  'function goodDollar() external view returns (address)',
];
const ERC20_ABI = [
  'function approve(address,uint256) external returns (bool)',
  'function balanceOf(address) external view returns (uint256)',
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer   = new ethers.Wallet(PK, provider);
  const mf  = new ethers.Contract(NEW_MF, MF_ABI, signer);
  const gdt = new ethers.Contract(GDT, ERC20_ABI, signer);

  // Verify GoodDollar wiring
  const gdAddr = await mf.goodDollar();
  console.log('MarketFactory.goodDollar():', gdAddr);
  console.log('Matches real GDT:', gdAddr.toLowerCase() === GDT.toLowerCase());

  // Approve
  const allowTx = await gdt.approve(NEW_MF, ethers.MaxUint256);
  await allowTx.wait(1);
  console.log('Approved GDT for new MarketFactory');

  // Create a test market
  const endTime = BigInt(Math.floor(Date.now() / 1000) + 3600);
  const createTx = await mf.createMarket('Will buy() work after GOO-2286 fix?', endTime, ethers.ZeroAddress, { gasLimit: 600000n });
  await createTx.wait(1);
  console.log('createMarket tx:', createTx.hash);

  const marketId = 0n;

  // Buy 1 YES token
  const buyTx = await mf.buy(marketId, true, ethers.parseEther('1'), { gasLimit: 300000n });
  const buyRcpt = await buyTx.wait(1);
  console.log('buy() tx:', buyTx.hash);
  console.log('buy() status:', buyRcpt.status === 1 ? 'SUCCESS ✅' : 'FAILED ❌');

  const [question, , , totalYES] = await mf.getMarket(marketId);
  console.log('totalYES after buy:', ethers.formatEther(totalYES), 'G$');
}

main().catch(e => { console.error(e.message); process.exit(1); });
