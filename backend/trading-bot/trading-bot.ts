/**
 * GoodChain Trading Bot — cycles through all on-chain apps every 60s
 * Purpose: generate real transactions across swap/lend/perps/yield
 *          to test cross-app price impact and build audit trail
 *
 * Uses the Anvil devnet admin key (0xf39F...) which is pre-funded.
 */

import { ethers } from 'ethers';

// ─── Config ──────────────────────────────────────────────────────────────────

const RPC_URL = process.env.RPC_URL || 'http://localhost:8545';
const PRIVATE_KEY = process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const CYCLE_MS = parseInt(process.env.CYCLE_MS || '60000', 10);

const ADDR = {
  GDT:             '0x5fbdb2315678afecb367f032d93f642f64180aa3',
  WETH:            '0x8f86403a4de0bb5791fa46b8e795c547942fe4cf',
  USDC:            '0x0e801d84fa97b50751dbf25036d067dcf18858bf',
  gUSD:            '0x70bda08dbe07363968e9ee53d899dfe48560605b',
  GoodSwapRouter:  '0x262e2b50219620226c5fb5956432a88fffd94ba7',
  SwapPriceOracle: '0x40a42baf86fc821f972ad2ac878729063ceef403',
  StockOracleV2:   '0xF357118EBd576f3C812c7875B1A1651a7f140E9C',
  PerpEngine:      '0x90c84237fddf091b1e63f369af122eb46000bc70',
  MarginVault:     '0x5322471a7e37ac2b8902cfcba84d266b37d811a0',
  GoodLendPool:    '0x5f3f1dbd7b74c6b46e8c44f98792a1daf8d69154',
  UBIFeeSplitter:  '0xdc64a140aa3e981100a9beca4e685f962f0cf6c9',
};

// ─── ABIs ────────────────────────────────────────────────────────────────────

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)',
  'function allowance(address,address) view returns (uint256)',
];

// Uniswap V2-style router with deadline
const SWAP_ROUTER_ABI = [
  'function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) external returns (uint256)',
  'function getAmountOut(uint256 amountIn, address tokenIn, address tokenOut) view returns (uint256)',
];

const PERP_ENGINE_ABI = [
  'function openPosition(uint256 marketId, uint256 size, bool isLong, uint256 margin) external',
  'function closePosition(uint256 marketId) external',
  'function paused() view returns (bool)',
];

const MARGIN_VAULT_ABI = [
  'function deposit(uint256 amount) external',
  'function withdraw(uint256 amount) external',
  'function balances(address) view returns (uint256)',
];

const LEND_POOL_ABI = [
  'function supply(address asset, uint256 amount) external',
  'function withdraw(address asset, uint256 amount) external returns (uint256)',
];

const ORACLE_ABI = [
  'function getPriceUnsafe(string symbol) view returns (uint256 price8, uint256 timestamp, uint8 session, uint8 confidence)',
];

const SWAP_ORACLE_ABI = [
  'function getPriceUnsafe(address token) view returns (uint256 price, uint256 timestamp)',
];

// ─── State ───────────────────────────────────────────────────────────────────

let provider: ethers.JsonRpcProvider;
let wallet: ethers.Wallet;
let cycleCount = 0;
const txLog: { cycle: number; app: string; action: string; txHash: string; gasUsed: string; ts: string; error?: string }[] = [];

// Swap pairs to rotate through
const SWAP_PAIRS = [
  { from: 'WETH', to: 'GDT',  tokenIn: 'WETH', tokenOut: 'GDT',  amount: '0.01' },
  { from: 'GDT',  to: 'WETH', tokenIn: 'GDT',  tokenOut: 'WETH', amount: '10' },
  { from: 'GDT',  to: 'USDC', tokenIn: 'GDT',  tokenOut: 'USDC', amount: '10' },
  { from: 'USDC', to: 'GDT',  tokenIn: 'USDC', tokenOut: 'GDT',  amount: '1' },
  { from: 'WETH', to: 'USDC', tokenIn: 'WETH', tokenOut: 'USDC', amount: '0.005' },
  { from: 'USDC', to: 'WETH', tokenIn: 'USDC', tokenOut: 'WETH', amount: '5' },
];

const ORACLE_TICKERS = ['AAPL', 'TSLA', 'META', 'SPY', 'NVDA', 'AMZN'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function log(msg: string) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function logTx(app: string, action: string, receipt: ethers.TransactionReceipt | null, error?: string) {
  const entry = {
    cycle: cycleCount,
    app,
    action,
    txHash: receipt?.hash || 'n/a',
    gasUsed: receipt?.gasUsed?.toString() || '0',
    ts: new Date().toISOString(),
    error: error || undefined,
  };
  txLog.push(entry);
  if (error) {
    log(`  ❌ ${app}.${action} — ${error.slice(0, 160)}`);
  } else {
    log(`  ✅ ${app}.${action} — tx ${entry.txHash.slice(0, 14)}… gas ${entry.gasUsed}`);
  }
}

async function ensureApproval(tokenAddr: string, spender: string) {
  const token = new ethers.Contract(tokenAddr, ERC20_ABI, wallet);
  const allowance = await token.allowance(wallet.address, spender);
  if (allowance < ethers.parseEther('1000000')) {
    const tx = await token.approve(spender, ethers.MaxUint256);
    await tx.wait();
    log(`    approved ${tokenAddr.slice(0, 10)}… for ${spender.slice(0, 10)}…`);
  }
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function deadline(): number {
  return Math.floor(Date.now() / 1000) + 600;
}

// ─── Trading Actions ─────────────────────────────────────────────────────────

async function tradeSwap() {
  const router = new ethers.Contract(ADDR.GoodSwapRouter, SWAP_ROUTER_ABI, wallet);
  const pair = SWAP_PAIRS[cycleCount % SWAP_PAIRS.length];
  const tokenInAddr = ADDR[pair.tokenIn as keyof typeof ADDR];
  const tokenOutAddr = ADDR[pair.tokenOut as keyof typeof ADDR];

  try {
    // Parse amount based on token decimals
    let amountIn: bigint;
    if (pair.tokenIn === 'USDC') {
      amountIn = BigInt(Math.floor(parseFloat(pair.amount) * 1e6));
    } else {
      amountIn = ethers.parseEther(pair.amount);
    }

    // Check balance
    const token = new ethers.Contract(tokenInAddr, ERC20_ABI, wallet);
    const bal = await token.balanceOf(wallet.address);
    if (bal < amountIn) {
      logTx('swap', `${pair.from}→${pair.to}`, null, `insufficient ${pair.from}`);
      return;
    }

    await ensureApproval(tokenInAddr, ADDR.GoodSwapRouter);
    
    // Get quote for logging
    const expectedOut = await router.getAmountOut(amountIn, tokenInAddr, tokenOutAddr);
    const minOut = expectedOut * 90n / 100n; // 10% slippage for devnet

    const tx = await router.swapExactTokensForTokens(
      amountIn, minOut,
      [tokenInAddr, tokenOutAddr],
      wallet.address,
      deadline()
    );
    const receipt = await tx.wait();
    logTx('swap', `${pair.from}→${pair.to} (${pair.amount} ${pair.from})`, receipt);
  } catch (e: any) {
    logTx('swap', `${pair.from}→${pair.to}`, null, e.message?.slice(0, 200));
  }
}

async function tradePerps() {
  const perps = new ethers.Contract(ADDR.PerpEngine, PERP_ENGINE_ABI, wallet);
  const marginVault = new ethers.Contract(ADDR.MarginVault, MARGIN_VAULT_ABI, wallet);

  try {
    const paused = await perps.paused();
    if (paused) { logTx('perps', 'skip', null, 'paused'); return; }

    const marginBalance = await marginVault.balances(wallet.address);
    const marketId = cycleCount % 3;

    if (marginBalance < ethers.parseEther('50')) {
      // Deposit margin first
      const depositAmount = ethers.parseEther('100');
      await ensureApproval(ADDR.GDT, ADDR.MarginVault);
      const tx = await marginVault.deposit(depositAmount);
      const receipt = await tx.wait();
      logTx('perps', `deposit margin (100 G$)`, receipt);
    }

    // Try open, if already open then close
    const isLong = cycleCount % 2 === 0;
    const margin = ethers.parseEther('10');
    const size = ethers.parseEther('20'); // 2x leverage

    try {
      const tx = await perps.openPosition(marketId, size, isLong, margin);
      const receipt = await tx.wait();
      logTx('perps', `open ${isLong ? 'LONG' : 'SHORT'} mkt${marketId}`, receipt);
    } catch (e: any) {
      if (e.message?.includes('PositionAlreadyOpen') || e.message?.includes('0x')) {
        // Close existing position
        try {
          const tx = await perps.closePosition(marketId);
          const receipt = await tx.wait();
          logTx('perps', `close mkt${marketId}`, receipt);
        } catch (e2: any) {
          logTx('perps', `close mkt${marketId}`, null, e2.message?.slice(0, 200));
        }
      } else {
        logTx('perps', `open mkt${marketId}`, null, e.message?.slice(0, 200));
      }
    }
  } catch (e: any) {
    logTx('perps', 'perps', null, e.message?.slice(0, 200));
  }
}

async function tradeLend() {
  const lend = new ethers.Contract(ADDR.GoodLendPool, LEND_POOL_ABI, wallet);

  try {
    // Alternate: supply WETH, supply GDT, withdraw WETH, withdraw GDT
    const actions = [
      { asset: ADDR.WETH, amount: ethers.parseEther('0.005'), label: '0.005 WETH', action: 'supply' },
      { asset: ADDR.GDT,  amount: ethers.parseEther('5'),     label: '5 GDT',      action: 'supply' },
      { asset: ADDR.WETH, amount: ethers.parseEther('0.002'), label: '0.002 WETH', action: 'withdraw' },
      { asset: ADDR.GDT,  amount: ethers.parseEther('2'),     label: '2 GDT',      action: 'withdraw' },
    ];
    const act = actions[cycleCount % actions.length];

    if (act.action === 'supply') {
      await ensureApproval(act.asset, ADDR.GoodLendPool);
      const tx = await lend.supply(act.asset, act.amount);
      const receipt = await tx.wait();
      logTx('lend', `supply ${act.label}`, receipt);
    } else {
      const tx = await lend.withdraw(act.asset, act.amount);
      const receipt = await tx.wait();
      logTx('lend', `withdraw ${act.label}`, receipt);
    }
  } catch (e: any) {
    logTx('lend', 'lend', null, e.message?.slice(0, 200));
  }
}

async function readPrices() {
  const stockOracle = new ethers.Contract(ADDR.StockOracleV2, ORACLE_ABI, wallet);
  const swapOracle = new ethers.Contract(ADDR.SwapPriceOracle, SWAP_ORACLE_ABI, wallet);
  const parts: string[] = [];

  // Stock oracle prices
  for (const ticker of ORACLE_TICKERS.slice(0, 4)) {
    try {
      const [price8] = await stockOracle.getPriceUnsafe(ticker);
      parts.push(`${ticker}=$${(Number(price8) / 1e8).toFixed(2)}`);
    } catch { parts.push(`${ticker}=err`); }
  }

  // Swap oracle prices (on-chain AMM prices)
  for (const [label, addr] of [['WETH', ADDR.WETH], ['GDT', ADDR.GDT], ['USDC', ADDR.USDC]]) {
    try {
      const [price] = await swapOracle.getPriceUnsafe(addr);
      parts.push(`${label}=$${(Number(price) / 1e8).toFixed(4)}`);
    } catch { parts.push(`${label}=err`); }
  }

  log(`  📊 ${parts.join(' | ')}`);
}

// ─── Main Loop ───────────────────────────────────────────────────────────────

async function runCycle() {
  cycleCount++;
  log(`\n═══ CYCLE ${cycleCount} ═══`);

  // Pre-trade prices
  await readPrices();

  // Execute all trading actions
  const actions = [tradeSwap, tradePerps, tradeLend];
  for (const fn of actions) {
    try { await fn(); } catch (e: any) {
      log(`  ⚠️ unexpected: ${e.message?.slice(0, 200)}`);
    }
  }

  // Post-trade prices (show impact)
  log('  post-trade:');
  await readPrices();

  // Stats
  const cycleTxs = txLog.filter(t => t.cycle === cycleCount);
  const ok = cycleTxs.filter(t => !t.error).length;
  const fail = cycleTxs.filter(t => t.error).length;
  const totalOk = txLog.filter(t => !t.error).length;
  log(`  ── cycle ${cycleCount}: ${ok}✅ ${fail}❌ | total: ${totalOk}✅ across ${cycleCount} cycles ──`);
}

async function main() {
  log('🤖 GoodChain Trading Bot starting...');
  log(`RPC: ${RPC_URL} | Cycle: ${CYCLE_MS}ms`);

  provider = new ethers.JsonRpcProvider(RPC_URL);
  wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  log(`Wallet: ${wallet.address}`);

  const balance = await provider.getBalance(wallet.address);
  log(`ETH: ${ethers.formatEther(balance)}`);

  // Pre-approve everything
  log('Pre-approving tokens...');
  for (const [token, spenders] of [
    [ADDR.WETH, [ADDR.GoodSwapRouter, ADDR.GoodLendPool]],
    [ADDR.GDT,  [ADDR.GoodSwapRouter, ADDR.GoodLendPool, ADDR.MarginVault]],
    [ADDR.USDC, [ADDR.GoodSwapRouter, ADDR.GoodLendPool]],
  ] as [string, string[]][]) {
    for (const spender of spenders) {
      await ensureApproval(token, spender);
    }
  }
  log('Approvals done.');

  // Run first cycle immediately, then repeat
  await runCycle();
  setInterval(async () => {
    try { await runCycle(); } catch (e: any) {
      log(`⚠️ Cycle error: ${e.message?.slice(0, 300)}`);
    }
  }, CYCLE_MS);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
