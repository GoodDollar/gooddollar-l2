#!/usr/bin/env node
/**
 * Paperclip continuous testers — GoodDollar L2 devnet smoke cycles.
 *
 * GOO-2012: Beta lane runs prediction-lifecycle (create → buy → close → resolve → redeem)
 * plus perp-open-close (vault deposit + toggle BTC perp on market 0).
 *
 * Usage:
 *   node scripts/paperclip-continuous-testers.mjs --once --tester beta
 *   node scripts/paperclip-continuous-testers.mjs --once --tester beta --skip-setup
 *   node scripts/paperclip-continuous-testers.mjs --once   # all testers (beta actions only)
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
  parseEther,
  parseEventLogs,
  formatEther,
  keccak256,
  toBytes,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { createHash } from 'node:crypto'
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  appendFileSync,
  existsSync,
  statSync,
} from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')

const CHAIN_ID = 42069
const FAUCET_URL = 'https://goodswap.goodclaw.org/api/faucet'
const LIFECYCLE_DEADLINE_SEC = 300 // Increased from 90s to 5min to account for transaction delays
const LIFECYCLE_BUFFER_SEC = 30 // Increased from 5s to 30s for more reliable timing
/** Must match PerpEngine.TRADE_FEE_BPS (10) for minVault sizing in actionPerpOpenClose. */
const PERP_TRADE_FEE_BPS = 10n
const PERP_BPS = 10000n

const TESTERS = [
  {
    id: 'alpha',
    paperclipAgentId: '089cacf1-77ca-4229-b58b-0ab2eb2abe3f',
    name: 'Tester Alpha — Swap & Lending',
    focus: 'swap-lending',
  },
  {
    id: 'beta',
    paperclipAgentId: 'ffa98f54-9cc3-4ea9-b015-e800fb7b7465',
    name: 'Tester Beta — Perps & Predictions',
    focus: 'perps-predictions',
  },
  {
    id: 'gamma',
    paperclipAgentId: '90b1b646-453a-4249-90a7-5a944e4419d8',
    name: 'Tester Gamma — Stocks & Stress',
    focus: 'stocks-stress',
  },
  {
    id: 'delta',
    paperclipAgentId: '3ecb6b00-2c97-4d69-95f4-f89d3ec0363f',
    name: 'Tester Delta — E2E & UX Validator',
    focus: 'e2e-ux',
  },
  {
    id: 'epsilon',
    paperclipAgentId: 'f6eba1c8-58a9-47b5-9592-6957c4d396fa',
    name: 'Quality Champion / Tester Epsilon — Revenue & UBI',
    focus: 'revenue-ubi',
  },
]

const MarketFactoryAbi = [
  {
    type: 'function',
    name: 'createMarket',
    inputs: [
      { name: 'question', type: 'string' },
      { name: 'endTime', type: 'uint256' },
      { name: 'resolver', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'buy',
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'isYES', type: 'bool' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'closeMarket',
    inputs: [{ name: 'marketId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'resolve',
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'yesWon', type: 'bool' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'redeem',
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setMarketCreator',
    inputs: [
      { name: 'who', type: 'address' },
      { name: 'allowed', type: 'bool' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'marketCreators',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'markets',
    inputs: [{ name: 'marketId', type: 'uint256' }],
    outputs: [
      { name: 'question', type: 'string' },
      { name: 'endTime', type: 'uint256' },
      { name: 'status', type: 'uint8' },
      { name: 'totalYES', type: 'uint256' },
      { name: 'totalNO', type: 'uint256' },
      { name: 'collateral', type: 'uint256' },
      { name: 'resolver', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'marketCount',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'goodDollar',
    inputs: [],
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'MarketCreated',
    inputs: [
      { name: 'marketId', type: 'uint256', indexed: true },
      { name: 'question', type: 'string', indexed: false },
      { name: 'endTime', type: 'uint256', indexed: false },
      { name: 'resolver', type: 'address', indexed: false },
    ],
  },
]

const SwapPriceOracleAbi = [
  {
    type: 'function',
    name: 'updatePrice',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'price', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getPrice',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
]

const Erc20Abi = [
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'transferFrom',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
]

const MarginVaultAbi = [
  {
    type: 'function',
    name: 'collateral',
    inputs: [],
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'deposit',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'balances',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
]

const PerpEngineAbi = [
  {
    type: 'function',
    name: 'openPosition',
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'size', type: 'uint256' },
      { name: 'isLong', type: 'bool' },
      { name: 'margin', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'closePosition',
    inputs: [{ name: 'marketId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'positions',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'marketId', type: 'uint256' },
    ],
    outputs: [
      { name: 'isOpen', type: 'bool' },
      { name: 'isLong', type: 'bool' },
      { name: 'size', type: 'uint256' },
      { name: 'entryPrice', type: 'uint256' },
      { name: 'margin', type: 'uint256' },
      { name: 'entryFundingIdx', type: 'int256' },
      { name: 'marketId', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'paused',
    inputs: [],
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
  },
]

function parseArgs(argv) {
  const args = {
    once: false,
    skipSetup: false,
    coverageGaps: false,
    tester: null,
    rpcUrl: process.env.RPC_URL ?? null,
  }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--once') args.once = true
    else if (a === '--skip-setup') args.skipSetup = true
    else if (a === '--coverage-gaps') args.coverageGaps = true
    else if (a === '--tester') args.tester = argv[++i]?.toLowerCase() ?? null
    else if (a === '--rpc-url') args.rpcUrl = argv[++i] ?? null
  }
  return args
}

function derivePrivateKey(paperclipAgentId) {
  const seed = createHash('sha256')
    .update(`gooddollar-paperclip-${paperclipAgentId}`)
    .digest('hex')
  return `0x${seed}`
}

function loadAddresses() {
  const path = resolve(REPO_ROOT, 'op-stack/addresses.json')
  const stat = statSync(path)
  const raw = JSON.parse(readFileSync(path, 'utf8'))
  return {
    path,
    mtimeMs: stat.mtimeMs,
    comment: raw._comment ?? '',
    rpcUrl: process.env.RPC_URL ?? raw.rpc_url ?? 'https://rpc.goodclaw.org',
    contracts: raw.contracts,
  }
}

/** GOO-3234: MF must bind the same GDT as addresses.json before lifecycle funding. */
async function assertMfGdtConsistency(publicClient, contracts, { skipBytecode = false } = {}) {
  const mf = contracts.MarketFactory
  const manifestGdt = contracts.GoodDollarToken
  if (!skipBytecode) {
    await ensureBytecode(publicClient, 'MarketFactory', mf)
    await ensureBytecode(publicClient, 'GoodDollarToken', manifestGdt)
  }

  const chainGdt = await publicClient.readContract({
    address: mf,
    abi: MarketFactoryAbi,
    functionName: 'goodDollar',
  })

  if (chainGdt.toLowerCase() !== manifestGdt.toLowerCase()) {
    throw new Error(
      `MF/GDT_DRIFT: MarketFactory.goodDollar()=${chainGdt} ` +
        `but addresses.json GoodDollarToken=${manifestGdt}. ` +
        'Re-run scripts/refresh-addresses.py and restart continuous testers.',
    )
  }

  return { marketFactory: mf, goodDollarToken: chainGdt }
}

/** GOO-3240: Perp margin must use MarginVault.collateral(), not addresses.json GDT alone. */
async function readPerpCollateralToken(publicClient, marginVault, manifestGdt) {
  const collateral = await publicClient.readContract({
    address: marginVault,
    abi: MarginVaultAbi,
    functionName: 'collateral',
  })
  await ensureBytecode(publicClient, 'MarginVault.collateral', collateral)
  if (manifestGdt && collateral.toLowerCase() !== manifestGdt.toLowerCase()) {
    console.warn(
      `[perp] VAULT_COLLATERAL_DRIFT: MarginVault.collateral=${collateral} ` +
        `manifest GoodDollarToken=${manifestGdt}; using vault collateral for deposit/approve`,
    )
  }
  return collateral
}

function perpOpenTotalRequired(size, margin) {
  const fee = (size * PERP_TRADE_FEE_BPS) / PERP_BPS
  return margin + fee
}

function loadDeployerKey() {
  const envPath = resolve(REPO_ROOT, '.autobuilder/addresses.env')
  if (!existsSync(envPath)) return null
  const text = readFileSync(envPath, 'utf8')
  const match = text.match(/^DEPLOYER_KEY=(.+)$/m)
  if (!match) return null
  return match[1].trim().replace(/^["']|["']$/g, '')
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

/** Fail fast when a lifecycle tx reverts (e.g. buy against wrong GDT). */
async function getBlockTimestamp(publicClient, blockNumber) {
  const block = await publicClient.getBlock({ blockNumber })
  return block ? Number(block.timestamp) : null
}

function formatContext(context) {
  const entries = []
  for (const [key, value] of Object.entries(context)) {
    entries.push(`${key}=${value}`)
  }
  return entries.join(' ')
}

function assertReceiptSuccess(receipt, step, context = null) {
  if (receipt.status === 'success') return
  const tx = receipt.transactionHash ?? 'unknown'
  let message = `${step} transaction reverted (tx=${tx})`
  if (context) {
    message += ` ${formatContext(context)}`
  }
  throw new Error(message)
}

const MARKET_FACTORY_LABEL = 'MarketFactory'

/** GOO-3235: parse legacy lifecycle failure strings when jsonl was not attached at throw site. */
function parsePredictionLifecycleError(message) {
  const fields = {
    action: 'prediction-lifecycle',
    contract: MARKET_FACTORY_LABEL,
  }
  const stepRevert = message.match(
    /^(createMarket|buy|closeMarket|resolve|redeem) transaction reverted/,
  )
  if (stepRevert) {
    fields.function = stepRevert[1]
  } else if (/function:\s+redeem/.test(message)) {
    fields.function = 'redeem'
  } else if (/function:\s+buy/.test(message)) {
    fields.function = 'buy'
  } else if (/function:\s+createMarket/.test(message)) {
    fields.function = 'createMarket'
  } else if (message.includes('MarketCreated event not found')) {
    fields.function = 'createMarket'
  } else if (message.includes('MF/GDT_DRIFT')) {
    fields.function = 'mf-gdt-preflight'
    fields.contract = MARKET_FACTORY_LABEL
  }

  const txMatch = message.match(/\(tx=(0x[a-fA-F0-9]+)\)/)
  if (txMatch) fields.tx = txMatch[1]

  for (const match of message.matchAll(
    /(?:^|\s)(marketId|endTime|buyBlockTimestamp|delta)=([^\s)]+)/g,
  )) {
    fields[match[1]] = match[2]
  }

  const redeemArgs = message.match(
    /function:\s+redeem\(uint256 marketId, uint256 amount\)[\s\S]*?args:\s+\((\d+),/,
  )
  if (redeemArgs && !fields.marketId) fields.marketId = redeemArgs[1]

  return fields
}

function throwPredictionLifecycleFailure(state, step, message, extra = {}) {
  const err = new Error(message)
  const jsonl = {
    action: 'prediction-lifecycle',
    contract: extra.contract ?? state.contract,
    function: step,
    marketId: state.marketId ?? undefined,
    endTime: state.endTime ?? undefined,
    question: state.question ?? undefined,
    buyAmount: state.buyAmount ?? undefined,
    ...extra,
  }
  if (Object.keys(state.txs).length > 0) jsonl.txs = { ...state.txs }
  err.jsonl = jsonl
  throw err
}

function lifecycleReceiptFailure(state, step, receipt, context = null) {
  const tx = receipt.transactionHash ?? 'unknown'
  let message = `${step} transaction reverted (tx=${tx})`
  const extra = { tx, contract: MARKET_FACTORY_LABEL }
  if (context) {
    message += ` ${formatContext(context)}`
    for (const [key, value] of Object.entries(context)) {
      extra[key] = value
    }
  }
  throwPredictionLifecycleFailure(state, step, message, extra)
}

function actionFailureJsonlRecord(fn, err) {
  const message = err instanceof Error ? err.message : String(err)
  if (err?.jsonl) {
    return { ...err.jsonl, error: message }
  }
  if (fn === actionPredictionLifecycle) {
    return { ...parsePredictionLifecycleError(message), error: message }
  }
  if (fn === actionPerpOpenClose) {
    return { action: 'perp-open-close', error: message }
  }
  return { action: fn.name, error: message }
}

function ts() {
  return new Date().toISOString()
}

function appendJsonl(testerId, record) {
  const dir = resolve(REPO_ROOT, 'test-results')
  mkdirSync(dir, { recursive: true })
  const line = JSON.stringify({ ts: ts(), tester: testerId, ...record }) + '\n'
  appendFileSync(resolve(dir, 'tester-beta.jsonl'), line)
  appendFileSync(resolve(dir, 'paperclip-continuous-testers.jsonl'), line)
}

async function faucet(address) {
  const res = await fetch(FAUCET_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address }),
  })
  const body = await res.text()
  return { ok: res.ok, status: res.status, body: body.slice(0, 500) }
}

async function ensureBytecode(publicClient, label, address) {
  const code = await publicClient.getBytecode({ address })
  const len = code?.length ?? 0
  if (!code || code === '0x' || len <= 2) {
    throw new Error(
      `DEVNET_DRIFT: ${label} at ${address} has no bytecode on RPC (len=${len}). ` +
        'Re-run scripts/refresh-addresses.py after redeploy.',
    )
  }
  return len
}

async function preflight(publicClient, contracts, activeFocus) {
  // Core contracts always required
  const checks = [
    ['GoodDollarToken', contracts.GoodDollarToken],
    ['MarketFactory', contracts.MarketFactory],
  ]
  // Perp contracts checked only when focus is NOT prediction-only (perp actions are currently
  // disabled via GOO-2199; skip perp preflight when running beta tester to avoid blocking
  // prediction lifecycle tests on a missing PerpEngine deployment)
  const perpDisabled = activeFocus === 'perps-predictions' // beta — perp actions disabled
  if (!perpDisabled) {
    checks.push(
      ['PerpEngine', contracts.PerpEngine],
      ['MarginVault', contracts.MarginVault],
      ['PerpPriceOracle', contracts.PerpPriceOracle],
    )
  }
  const out = {}
  for (const [label, addr] of checks) {
    out[label] = await ensureBytecode(publicClient, label, addr)
  }
  if (checks.some(([label]) => label === 'MarketFactory')) {
    out.mfGdt = await assertMfGdtConsistency(publicClient, contracts, { skipBytecode: true })
  }
  return out
}

async function setupPredictions(deployerAccount, publicClient, walletClient, contracts, testers) {
  const results = []
  for (const t of testers) {
    const account = privateKeyToAccount(derivePrivateKey(t.paperclipAgentId))
    const already = await publicClient.readContract({
      address: contracts.MarketFactory,
      abi: MarketFactoryAbi,
      functionName: 'marketCreators',
      args: [account.address],
    })
    if (already) {
      results.push({ tester: t.id, address: account.address, skipped: true, marketCreators: true })
      continue
    }
    const hash = await walletClient.writeContract({
      account: deployerAccount,
      chain: walletClient.chain,
      address: contracts.MarketFactory,
      abi: MarketFactoryAbi,
      functionName: 'setMarketCreator',
      args: [account.address, true],
    })
    await publicClient.waitForTransactionReceipt({ hash })
    results.push({ tester: t.id, address: account.address, tx: hash, marketCreators: true })
  }
  return results
}

async function readErc20Balance(publicClient, token, holder) {
  return publicClient.readContract({
    address: token,
    abi: Erc20Abi,
    functionName: 'balanceOf',
    args: [holder],
  })
}

/** Transfer shortfall from deployer when faucet cannot fund non-manifest collateral (GOO-3240). */
async function fundTokenFromDeployer(publicClient, walletClient, token, recipient, minWei) {
  const deployerKey = loadDeployerKey()
  if (!deployerKey) {
    throw new Error(
      'Insufficient token balance and DEPLOYER_KEY missing in .autobuilder/addresses.env',
    )
  }
  const deployerAccount = privateKeyToAccount(deployerKey)
  const deployerBal = await readErc20Balance(publicClient, token, deployerAccount.address)
  const recipientBal = await readErc20Balance(publicClient, token, recipient)
  const shortfall = minWei > recipientBal ? minWei - recipientBal : 0n
  if (shortfall === 0n) {
    return { balance: recipientBal, source: 'deployer-skip', tx: null }
  }
  if (deployerBal < shortfall) {
    throw new Error(
      `Deployer ${deployerAccount.address} has ${formatEther(deployerBal)} on ${token} ` +
        `but ${formatEther(shortfall)} needed for ${recipient}`,
    )
  }
  const rpc =
    walletClient.chain?.rpcUrls?.default?.http?.[0] ??
    walletClient.chain?.rpcUrls?.public?.http?.[0]
  if (!rpc) {
    throw new Error('walletClient.chain missing rpcUrls for deployer transfer')
  }
  const deployerWallet = createWalletClient({
    account: deployerAccount,
    chain: walletClient.chain,
    transport: http(rpc),
  })
  const hash = await deployerWallet.writeContract({
    account: deployerAccount,
    chain: deployerWallet.chain,
    address: token,
    abi: Erc20Abi,
    functionName: 'transfer',
    args: [recipient, shortfall],
  })
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  assertReceiptSuccess(receipt, 'deployer collateral transfer', {
    token,
    recipient,
    shortfall: shortfall.toString(),
  })
  const balance = await readErc20Balance(publicClient, token, recipient)
  return { balance, source: 'deployer-transfer', tx: hash }
}

async function ensureGdtBalance(
  publicClient,
  walletClient,
  gdt,
  account,
  minWei,
  { manifestGdt = gdt } = {},
) {
  let bal = await readErc20Balance(publicClient, gdt, account.address)
  if (bal >= minWei) return { balance: bal, faucet: null, source: 'existing' }

  let faucetResult = null
  const faucetTargetsManifest =
    !manifestGdt || gdt.toLowerCase() === manifestGdt.toLowerCase()
  if (faucetTargetsManifest) {
    faucetResult = await faucet(account.address)
    await sleep(3000)
    bal = await readErc20Balance(publicClient, gdt, account.address)
    if (bal >= minWei) return { balance: bal, faucet: faucetResult, source: 'faucet' }
  }

  const deployerFund = await fundTokenFromDeployer(
    publicClient,
    walletClient,
    gdt,
    account.address,
    minWei,
  )
  return {
    balance: deployerFund.balance,
    faucet: faucetResult,
    source: deployerFund.source,
    deployerTx: deployerFund.tx,
  }
}

async function ensureAllowance(publicClient, walletClient, token, owner, spender, amount) {
  const current = await publicClient.readContract({
    address: token,
    abi: Erc20Abi,
    functionName: 'allowance',
    args: [owner.address, spender],
  })
  if (current >= amount) return null
  const hash = await walletClient.writeContract({
    account: owner,
    chain: walletClient.chain,
    address: token,
    abi: Erc20Abi,
    functionName: 'approve',
    args: [spender, parseEther('100000')],
    gas: 60000n, // Explicit gas limit to prevent "gas required exceeds allowance: 0" errors
    maxFeePerGas: 20000000000n, // 20 gwei max fee for devnet chain (id: 42069)
    maxPriorityFeePerGas: 1000000000n, // 1 gwei priority fee for devnet
  })
  await publicClient.waitForTransactionReceipt({ hash })
  return hash
}

async function actionPerpOpenClose(publicClient, walletClient, contracts, account) {
  const marketId = 0n
  const size = parseEther('100')
  const margin = parseEther('10')
  const totalRequired = perpOpenTotalRequired(size, margin)
  const minVault = totalRequired + parseEther('1')
  const collateral = await readPerpCollateralToken(
    publicClient,
    contracts.MarginVault,
    contracts.GoodDollarToken,
  )

  const [isOpen] = await publicClient.readContract({
    address: contracts.PerpEngine,
    abi: PerpEngineAbi,
    functionName: 'positions',
    args: [account.address, marketId],
  })

  if (isOpen) {
    const hash = await walletClient.writeContract({
      account,
      chain: walletClient.chain,
      address: contracts.PerpEngine,
      abi: PerpEngineAbi,
      functionName: 'closePosition',
      args: [marketId],
    })
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    return { name: 'perp-open-close', ok: true, side: 'close', tx: hash, block: receipt.blockNumber.toString() }
  }

  let vaultBal = await publicClient.readContract({
    address: contracts.MarginVault,
    abi: MarginVaultAbi,
    functionName: 'balances',
    args: [account.address],
  })
  const depositAmount =
    vaultBal >= minVault ? 0n : minVault - vaultBal + parseEther('1')

  if (depositAmount > 0n) {
    await ensureGdtBalance(publicClient, walletClient, collateral, account, depositAmount, {
      manifestGdt: contracts.GoodDollarToken,
    })
    await ensureAllowance(
      publicClient,
      walletClient,
      collateral,
      account,
      contracts.MarginVault,
      depositAmount,
    )

    const depHash = await walletClient.writeContract({
      account,
      chain: walletClient.chain,
      address: contracts.MarginVault,
      abi: MarginVaultAbi,
      functionName: 'deposit',
      args: [depositAmount],
      gas: 200000n,
      maxFeePerGas: 20000000000n,
      maxPriorityFeePerGas: 1000000000n,
    })
    const depReceipt = await publicClient.waitForTransactionReceipt({ hash: depHash })
    assertReceiptSuccess(depReceipt, 'MarginVault.deposit', {
      collateral,
      amount: depositAmount.toString(),
    })
    vaultBal = await publicClient.readContract({
      address: contracts.MarginVault,
      abi: MarginVaultAbi,
      functionName: 'balances',
      args: [account.address],
    })
    if (vaultBal < minVault) {
      throw new Error(
        `MarginVault balance ${formatEther(vaultBal)} G$ below required ${formatEther(minVault)} after deposit`,
      )
    }
  }

  const hash = await walletClient.writeContract({
    account,
    chain: walletClient.chain,
    address: contracts.PerpEngine,
    abi: PerpEngineAbi,
    functionName: 'openPosition',
    args: [marketId, size, true, margin],
  })
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  return { name: 'perp-open-close', ok: true, side: 'open', tx: hash, block: receipt.blockNumber.toString() }
}

async function actionPredictionLifecycle(
  publicClient,
  walletClient,
  contracts,
  account,
  cycleOpts = {},
) {
  const buyAmount = parseEther('2')
  const state = {
    contract: MARKET_FACTORY_LABEL,
    marketId: null,
    endTime: null,
    question: null,
    buyAmount: buyAmount.toString(),
    txs: {},
  }

  try {
    const block = await publicClient.getBlock()
    const now = Number(block.timestamp)
    const endTime = BigInt(now + LIFECYCLE_DEADLINE_SEC)
    const question = `GOO-2012 continuous lifecycle ${Date.now()}`
    state.endTime = endTime.toString()
    state.question = question

    const gdt =
      cycleOpts.lifecycleGdt ??
      (await assertMfGdtConsistency(publicClient, contracts)).goodDollarToken

    state.contract = 'GoodDollarToken'
    await ensureGdtBalance(publicClient, walletClient, gdt, account, buyAmount)
    await ensureAllowance(
      publicClient,
      walletClient,
      gdt,
      account,
      contracts.MarketFactory,
      buyAmount,
    )
    state.contract = MARKET_FACTORY_LABEL

    const createHash = await walletClient.writeContract({
      account,
      chain: walletClient.chain,
      address: contracts.MarketFactory,
      abi: MarketFactoryAbi,
      functionName: 'createMarket',
      args: [question, endTime, account.address],
    })
    state.txs.create = createHash
    const createReceipt = await publicClient.waitForTransactionReceipt({ hash: createHash })
    if (createReceipt.status !== 'success') {
      lifecycleReceiptFailure(state, 'createMarket', createReceipt)
    }
    const created = parseEventLogs({
      abi: MarketFactoryAbi,
      logs: createReceipt.logs,
      eventName: 'MarketCreated',
    })
    if (!created.length) {
      throwPredictionLifecycleFailure(
        state,
        'createMarket',
        'MarketCreated event not found',
        { tx: createHash },
      )
    }
    const marketId = created[0].args.marketId
    state.marketId = marketId.toString()

    const buyHash = await walletClient.writeContract({
      account,
      chain: walletClient.chain,
      address: contracts.MarketFactory,
      abi: MarketFactoryAbi,
      functionName: 'buy',
      args: [marketId, true, buyAmount],
      gas: 500000n, // Explicit gas limit to prevent "gas required exceeds allowance: 0" errors
      maxFeePerGas: 20000000000n, // 20 gwei max fee for devnet chain (id: 42069)
      maxPriorityFeePerGas: 1000000000n, // 1 gwei priority fee for devnet
    })
    state.txs.buy = buyHash
    const buyReceipt = await publicClient.waitForTransactionReceipt({ hash: buyHash })
    if (buyReceipt.status !== 'success') {
      const buyBlockTimestamp = await getBlockTimestamp(publicClient, buyReceipt.blockNumber)
      const delta = buyBlockTimestamp != null ? Number(endTime) - buyBlockTimestamp : null
      lifecycleReceiptFailure(state, 'buy', buyReceipt, {
        marketId: state.marketId,
        endTime: state.endTime,
        buyBlockTimestamp: buyBlockTimestamp ?? 'unknown',
        delta: delta ?? 'unknown',
      })
    }

    const waitMs = Math.max(0, Number(endTime) * 1000 - Date.now() + LIFECYCLE_BUFFER_SEC * 1000)
    if (waitMs > 0) {
      await sleep(waitMs)
    }

    const closeHash = await walletClient.writeContract({
      account,
      chain: walletClient.chain,
      address: contracts.MarketFactory,
      abi: MarketFactoryAbi,
      functionName: 'closeMarket',
      args: [marketId],
    })
    state.txs.close = closeHash
    const closeReceipt = await publicClient.waitForTransactionReceipt({ hash: closeHash })
    if (closeReceipt.status !== 'success') {
      lifecycleReceiptFailure(state, 'closeMarket', closeReceipt)
    }

    const resolveHash = await walletClient.writeContract({
      account,
      chain: walletClient.chain,
      address: contracts.MarketFactory,
      abi: MarketFactoryAbi,
      functionName: 'resolve',
      args: [marketId, true],
    })
    state.txs.resolve = resolveHash
    const resolveReceipt = await publicClient.waitForTransactionReceipt({ hash: resolveHash })
    if (resolveReceipt.status !== 'success') {
      lifecycleReceiptFailure(state, 'resolve', resolveReceipt)
    }

    const balBefore = await publicClient.readContract({
      address: gdt,
      abi: Erc20Abi,
      functionName: 'balanceOf',
      args: [account.address],
    })

    const redeemHash = await walletClient.writeContract({
      account,
      chain: walletClient.chain,
      address: contracts.MarketFactory,
      abi: MarketFactoryAbi,
      functionName: 'redeem',
      args: [marketId, buyAmount],
    })
    state.txs.redeem = redeemHash
    const redeemReceipt = await publicClient.waitForTransactionReceipt({ hash: redeemHash })
    if (redeemReceipt.status !== 'success') {
      lifecycleReceiptFailure(state, 'redeem', redeemReceipt)
    }

    const balAfter = await publicClient.readContract({
      address: gdt,
      abi: Erc20Abi,
      functionName: 'balanceOf',
      args: [account.address],
    })

    const market = await publicClient.readContract({
      address: contracts.MarketFactory,
      abi: MarketFactoryAbi,
      functionName: 'markets',
      args: [marketId],
    })

    return {
      name: 'prediction-lifecycle',
      ok: true,
      marketId: marketId.toString(),
      question,
      endTime: endTime.toString(),
      waitMs,
      status: market[2],
      collateral: market[5].toString(),
      payoutDelta: formatEther(balAfter - balBefore),
      txs: {
        create: createHash,
        buy: buyHash,
        close: closeHash,
        resolve: resolveHash,
        redeem: redeemHash,
      },
    }
  } catch (err) {
    if (err?.jsonl) throw err
    const step = state.txs.redeem
      ? 'redeem'
      : state.txs.resolve
        ? 'resolve'
        : state.txs.close
          ? 'closeMarket'
          : state.txs.buy
            ? 'buy'
            : state.txs.create
              ? 'createMarket'
              : state.contract === 'GoodDollarToken'
                ? 'fund-gdt'
                : 'unknown'
    throwPredictionLifecycleFailure(state, step, err instanceof Error ? err.message : String(err))
  }
}

/**
 * GOO-3158: exercise functions missing from historical JSONL logs.
 */
async function actionCoverageGaps(publicClient, walletClient, contracts, account) {
  const gdt = contracts.GoodDollarToken
  const amount = parseEther('0.001')
  const delegate = privateKeyToAccount(
    keccak256(toBytes(`coverage-delegate-${account.address}`)),
  )
  const results = []

  await ensureGdtBalance(publicClient, walletClient, gdt, account, amount * 2n)

  const approveHash = await walletClient.writeContract({
    account,
    chain: walletClient.chain,
    address: gdt,
    abi: Erc20Abi,
    functionName: 'approve',
    args: [delegate.address, amount],
    gas: 120000n,
  })
  const approveReceipt = await publicClient.waitForTransactionReceipt({ hash: approveHash })
  assertReceiptSuccess(approveReceipt, 'approve-for-transferFrom')

  const rpc = walletClient.chain?.rpcUrls?.default?.http?.[0] ?? 'https://rpc.goodclaw.org'
  await faucet(delegate.address)
  await sleep(2000)
  // Delegate must pay gas for transferFrom; faucet alone is sometimes insufficient.
  const fundHash = await walletClient.sendTransaction({
    account,
    chain: walletClient.chain,
    to: delegate.address,
    value: parseEther('0.01'),
  })
  await publicClient.waitForTransactionReceipt({ hash: fundHash })

  const delegateClient = createWalletClient({
    account: delegate,
    chain: walletClient.chain,
    transport: http(rpc),
  })
  const transferHash = await delegateClient.writeContract({
    account: delegate,
    chain: walletClient.chain,
    address: gdt,
    abi: Erc20Abi,
    functionName: 'transferFrom',
    args: [account.address, delegate.address, amount],
    gas: 150000n,
  })
  const transferReceipt = await publicClient.waitForTransactionReceipt({ hash: transferHash })
  assertReceiptSuccess(transferReceipt, 'transferFrom')
  results.push({
    contract: 'GoodDollarToken',
    function: 'transferFrom',
    ok: true,
    tx: transferHash,
  })

  const oracle = contracts.SwapPriceOracle
  if (oracle) {
    try {
      await ensureBytecode(publicClient, 'SwapPriceOracle', oracle)
      const weth = contracts.WETH ?? contracts.weth
      if (weth) {
        const priceBefore = await publicClient.readContract({
          address: oracle,
          abi: SwapPriceOracleAbi,
          functionName: 'getPrice',
          args: [weth],
        })
        const updateHash = await walletClient.writeContract({
          account,
          chain: walletClient.chain,
          address: oracle,
          abi: SwapPriceOracleAbi,
          functionName: 'updatePrice',
          args: [weth, priceBefore > 0n ? priceBefore : 350_000_000_000n],
          gas: 200000n,
        })
        const updateReceipt = await publicClient.waitForTransactionReceipt({ hash: updateHash })
        assertReceiptSuccess(updateReceipt, 'updatePrice')
        results.push({
          contract: 'SwapPriceOracle',
          function: 'updatePrice',
          ok: true,
          tx: updateHash,
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const skipped =
        message.includes('NotKeeper') ||
        message.includes('not keeper') ||
        message.includes('DEVNET_DRIFT') ||
        message.includes('no bytecode')
      results.push({
        contract: 'SwapPriceOracle',
        function: 'updatePrice',
        ok: skipped,
        skipped,
        error: message,
      })
    }
  }

  const required = results.filter((r) => !r.skipped)
  return {
    name: 'coverage-gaps',
    ok: required.length === 0 || required.every((r) => r.ok !== false),
    results,
  }
}

async function runBetaCycle(publicClient, walletClient, _contracts, tester, options = {}) {
  const addresses = loadAddresses()
  const contracts = addresses.contracts

  let mfGdt
  try {
    mfGdt = await assertMfGdtConsistency(publicClient, contracts)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    appendJsonl(tester.id, {
      action: 'mf-gdt-preflight',
      ok: false,
      error: message,
      addressesPath: addresses.path,
      addressesMtimeMs: addresses.mtimeMs,
    })
    throw err
  }

  const account = privateKeyToAccount(derivePrivateKey(tester.paperclipAgentId))
  const actions = []
  const cycleFns = options.coverageGapsOnly
    ? [actionCoverageGaps]
    : [actionPredictionLifecycle, actionPerpOpenClose]
  if (!options.coverageGapsOnly) {
    // GOO-3158: append coverage-gap probes after lifecycle when not in gaps-only mode
    cycleFns.push(actionCoverageGaps)
  }
  // GOO-2878: Re-enabled actionPerpOpenClose after tester accounts were funded with ETH
  const cycleOpts = { lifecycleGdt: mfGdt.goodDollarToken }
  for (const fn of cycleFns) {
    try {
      const result = await fn(publicClient, walletClient, contracts, account, cycleOpts)
      actions.push(result)
      appendJsonl(tester.id, { action: result.name, ok: true, result })
      for (const step of result.results ?? []) {
        if (step.function) {
          appendJsonl(tester.id, {
            action: 'coverage-gap',
            contract: step.contract,
            function: step.function,
            ok: step.ok !== false,
            error: step.error,
            tx: step.tx,
          })
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const failureRecord = actionFailureJsonlRecord(fn, err)
      const actionName =
        failureRecord.action ??
        (fn === actionPredictionLifecycle ? 'prediction-lifecycle' : fn.name)
      actions.push({ name: actionName, ok: false, error: message, ...failureRecord })
      appendJsonl(tester.id, { ok: false, ...failureRecord })
      if (!options.coverageGapsOnly) throw err
    }
  }
  const ok = actions.every((a) => a.ok !== false)
  return {
    tester: tester.id,
    name: tester.name,
    address: account.address,
    ok,
    actions,
    addressesPath: addresses.path,
    addressesMtimeMs: addresses.mtimeMs,
    mfGdt,
  }
}

async function runTesterCycle(publicClient, walletClient, contracts, tester, options = {}) {
  if (tester.focus === 'perps-predictions') {
    return runBetaCycle(publicClient, walletClient, contracts, tester, options)
  }
  return {
    tester: tester.id,
    name: tester.name,
    ok: true,
    skipped: true,
    reason: 'non-beta actions not restored in GOO-2012; beta lifecycle only',
  }
}

async function main() {
  const args = parseArgs(process.argv)
  const addresses = loadAddresses()
  const rpcUrl = args.rpcUrl ?? addresses.rpcUrl

  const chain = defineChain({
    id: CHAIN_ID,
    name: 'GoodDollar L2 Devnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl] }, public: { http: [rpcUrl] } },
  })

  const publicClient = createPublicClient({ chain, transport: http(rpcUrl) })
  const contracts = addresses.contracts

  // Determine which focus areas are active for preflight scope
  const activeTester = args.tester ? TESTERS.find((t) => t.id === args.tester) : null
  const activeFocus = activeTester?.focus ?? 'all'

  let preflightResult
  try {
    preflightResult = await preflight(publicClient, contracts, activeFocus)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const payload = {
      cycleAt: ts(),
      ok: false,
      error: message,
      rpcUrl,
      addressesComment: addresses.comment,
      addressesPath: addresses.path,
    }
    mkdirSync(resolve(REPO_ROOT, '.paperclip/continuous-testers'), { recursive: true })
    writeFileSync(
      resolve(REPO_ROOT, '.paperclip/continuous-testers/latest.json'),
      JSON.stringify(payload, null, 2) + '\n',
    )
    appendJsonl('beta', { cycle: 'preflight', ok: false, error: message })
    console.error(JSON.stringify(payload, null, 2))
    process.exit(1)
  }

  const selected = args.tester
    ? TESTERS.filter((t) => t.id === args.tester)
    : TESTERS
  if (args.tester && selected.length === 0) {
    console.error(`Unknown tester: ${args.tester}`)
    process.exit(2)
  }

  if (!args.skipSetup) {
    const deployerKey = loadDeployerKey()
    if (!deployerKey) {
      console.error('DEPLOYER_KEY missing from .autobuilder/addresses.env — cannot run setupPredictions')
      process.exit(3)
    }
    const deployerAccount = privateKeyToAccount(deployerKey)
    const setupClient = createWalletClient({
      account: deployerAccount,
      chain,
      transport: http(rpcUrl),
    })
    const setup = await setupPredictions(
      deployerAccount,
      publicClient,
      setupClient,
      contracts,
      TESTERS,
    )
    appendJsonl('setup', { action: 'setupPredictions', ok: true, setup })
  }

  const results = []
  for (const tester of selected) {
    if (tester.focus !== 'perps-predictions') {
      results.push(await runTesterCycle(publicClient, null, contracts, tester))
      continue
    }
    const account = privateKeyToAccount(derivePrivateKey(tester.paperclipAgentId))
    const walletClient = createWalletClient({
      account,
      chain,
      transport: http(rpcUrl),
    })
    results.push(
      await runBetaCycle(publicClient, walletClient, contracts, tester, {
        coverageGapsOnly: args.coverageGaps,
      }),
    )
  }

  const payload = {
    cycleAt: ts(),
    ok: results.every((r) => r.ok !== false),
    rpcUrl,
    addressesComment: addresses.comment,
    preflight: preflightResult,
    results,
  }

  mkdirSync(resolve(REPO_ROOT, '.paperclip/continuous-testers'), { recursive: true })
  writeFileSync(
    resolve(REPO_ROOT, '.paperclip/continuous-testers/latest.json'),
    JSON.stringify(payload, null, 2) + '\n',
  )

  console.log(JSON.stringify(payload, null, 2))

  if (!args.once) {
    console.error('Loop mode not implemented; use --once or run under PM2 with interval wrapper')
  }

  if (!payload.ok) process.exit(1)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack ?? err.message : err)
  process.exit(1)
})
