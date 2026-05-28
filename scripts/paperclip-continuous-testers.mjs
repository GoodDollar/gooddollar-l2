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
import { readFileSync, writeFileSync, mkdirSync, appendFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')

const CHAIN_ID = 42069
const FAUCET_URL = 'https://goodswap.goodclaw.org/api/faucet'
const LIFECYCLE_DEADLINE_SEC = 300 // Increased from 90s to 5min to account for transaction delays
const LIFECYCLE_BUFFER_SEC = 30 // Increased from 5s to 30s for more reliable timing

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

const Erc20Abi = [
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
    tester: null,
    rpcUrl: process.env.RPC_URL ?? null,
  }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--once') args.once = true
    else if (a === '--skip-setup') args.skipSetup = true
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
  const raw = JSON.parse(readFileSync(path, 'utf8'))
  return {
    path,
    comment: raw._comment ?? '',
    rpcUrl: process.env.RPC_URL ?? raw.rpc_url ?? 'https://rpc.goodclaw.org',
    contracts: raw.contracts,
  }
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
function assertReceiptSuccess(receipt, step) {
  if (receipt.status === 'success') return
  const tx = receipt.transactionHash ?? 'unknown'
  throw new Error(`${step} transaction reverted (tx=${tx})`)
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

async function ensureGdtBalance(publicClient, walletClient, gdt, account, minWei) {
  const bal = await publicClient.readContract({
    address: gdt,
    abi: Erc20Abi,
    functionName: 'balanceOf',
    args: [account.address],
  })
  if (bal >= minWei) return { balance: bal, faucet: null }
  const faucetResult = await faucet(account.address)
  await sleep(3000)
  const balAfter = await publicClient.readContract({
    address: gdt,
    abi: Erc20Abi,
    functionName: 'balanceOf',
    args: [account.address],
  })
  return { balance: balAfter, faucet: faucetResult }
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
  const minVault = margin + parseEther('1')

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

  await ensureGdtBalance(publicClient, walletClient, contracts.GoodDollarToken, account, parseEther('50'))
  await ensureAllowance(
    publicClient,
    walletClient,
    contracts.GoodDollarToken,
    account,
    contracts.MarginVault,
    parseEther('1000'),
  )

  const vaultBal = await publicClient.readContract({
    address: contracts.MarginVault,
    abi: MarginVaultAbi,
    functionName: 'balances',
    args: [account.address],
  })
  if (vaultBal < minVault) {
    const depHash = await walletClient.writeContract({
      account,
      chain: walletClient.chain,
      address: contracts.MarginVault,
      abi: MarginVaultAbi,
      functionName: 'deposit',
      args: [parseEther('1000')],
      gas: 200000n, // Explicit gas limit to prevent "gas required exceeds allowance: 0" errors
      maxFeePerGas: 20000000000n, // 20 gwei max fee for devnet chain (id: 42069)
      maxPriorityFeePerGas: 1000000000n, // 1 gwei priority fee for devnet
    })
    await publicClient.waitForTransactionReceipt({ hash: depHash })
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

async function actionPredictionLifecycle(publicClient, walletClient, contracts, account) {
  const buyAmount = parseEther('2')
  const block = await publicClient.getBlock()
  const now = Number(block.timestamp)
  const endTime = BigInt(now + LIFECYCLE_DEADLINE_SEC)
  const question = `GOO-2012 continuous lifecycle ${Date.now()}`

  await ensureGdtBalance(publicClient, walletClient, contracts.GoodDollarToken, account, buyAmount)
  await ensureAllowance(
    publicClient,
    walletClient,
    contracts.GoodDollarToken,
    account,
    contracts.MarketFactory,
    buyAmount,
  )

  const createHash = await walletClient.writeContract({
    account,
    chain: walletClient.chain,
    address: contracts.MarketFactory,
    abi: MarketFactoryAbi,
    functionName: 'createMarket',
    args: [question, endTime, account.address],
  })
  const createReceipt = await publicClient.waitForTransactionReceipt({ hash: createHash })
  assertReceiptSuccess(createReceipt, 'createMarket')
  const created = parseEventLogs({
    abi: MarketFactoryAbi,
    logs: createReceipt.logs,
    eventName: 'MarketCreated',
  })
  if (!created.length) throw new Error('MarketCreated event not found')
  const marketId = created[0].args.marketId

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
  const buyReceipt = await publicClient.waitForTransactionReceipt({ hash: buyHash })
  assertReceiptSuccess(buyReceipt, 'buy')

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
  const closeReceipt = await publicClient.waitForTransactionReceipt({ hash: closeHash })
  assertReceiptSuccess(closeReceipt, 'closeMarket')

  const resolveHash = await walletClient.writeContract({
    account,
    chain: walletClient.chain,
    address: contracts.MarketFactory,
    abi: MarketFactoryAbi,
    functionName: 'resolve',
    args: [marketId, true],
  })
  const resolveReceipt = await publicClient.waitForTransactionReceipt({ hash: resolveHash })
  assertReceiptSuccess(resolveReceipt, 'resolve')

  const balBefore = await publicClient.readContract({
    address: contracts.GoodDollarToken,
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
  const redeemReceipt = await publicClient.waitForTransactionReceipt({ hash: redeemHash })
  assertReceiptSuccess(redeemReceipt, 'redeem')

  const balAfter = await publicClient.readContract({
    address: contracts.GoodDollarToken,
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
}

async function runBetaCycle(publicClient, walletClient, contracts, tester) {
  const account = privateKeyToAccount(derivePrivateKey(tester.paperclipAgentId))
  const actions = []
  // GOO-2878: Re-enabled actionPerpOpenClose after tester accounts were funded with ETH
  for (const fn of [actionPredictionLifecycle, actionPerpOpenClose]) {
    try {
      const result = await fn(publicClient, walletClient, contracts, account)
      actions.push(result)
      appendJsonl(tester.id, { action: result.name, ok: true, result })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      actions.push({ name: fn.name, ok: false, error: message })
      appendJsonl(tester.id, { action: fn.name, ok: false, error: message })
      throw err
    }
  }
  return { tester: tester.id, name: tester.name, address: account.address, ok: true, actions }
}

async function runTesterCycle(publicClient, walletClient, contracts, tester) {
  if (tester.focus === 'perps-predictions') {
    return runBetaCycle(publicClient, walletClient, contracts, tester)
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
    results.push(await runBetaCycle(publicClient, walletClient, contracts, tester))
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
