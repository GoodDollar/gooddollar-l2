import { NextResponse } from 'next/server'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { createPublicClient, createWalletClient, defineChain, formatEther, http, parseEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { CONTRACTS, DEVNET_CHAIN_ID, DEVNET_EXPLORER_URL, DEVNET_RPC_URL } from '@/lib/devnet'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const COOLDOWN_MS = 60 * 60 * 1000 // 1 hour
const CLAIMS_FILE = process.env.FAUCET_CLAIMS_FILE ?? '/tmp/gooddollar-l2-faucet-claims.json'

class FaucetRateLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FaucetRateLimitError'
  }
}

async function readClaimTimes(): Promise<Record<string, number>> {
  try {
    const raw = await readFile(CLAIMS_FILE, 'utf8')
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, number] => typeof entry[1] === 'number'),
    )
  } catch {
    return {}
  }
}

async function writeClaimTime(addressKey: string, timestamp: number): Promise<void> {
  const claims = await readClaimTimes()
  claims[addressKey] = timestamp
  await mkdir(dirname(CLAIMS_FILE), { recursive: true })
  await writeFile(CLAIMS_FILE, JSON.stringify(claims, null, 2))
}

const NATIVE_ETH_AMOUNT = parseEther(process.env.FAUCET_NATIVE_ETH_AMOUNT ?? '0.1')
const GDT_NET_AMOUNT = parseEther(process.env.FAUCET_GDT_AMOUNT ?? '10000')
const WETH_AMOUNT = parseEther(process.env.FAUCET_WETH_AMOUNT ?? '1')

const erc20Abi = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'mint',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
] as const

const goodDollarL2 = defineChain({
  id: DEVNET_CHAIN_ID,
  name: 'GoodDollar L2 Devnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.FAUCET_RPC_URL ?? DEVNET_RPC_URL] },
    public: { http: [process.env.FAUCET_RPC_URL ?? DEVNET_RPC_URL] },
  },
  blockExplorers: {
    default: { name: 'GoodDollar Explorer', url: DEVNET_EXPLORER_URL },
  },
})

function normalizePrivateKey(raw: string | undefined): `0x${string}` | null {
  if (!raw) return null
  const key = raw.startsWith('0x') ? raw : `0x${raw}`
  return /^0x[0-9a-fA-F]{64}$/.test(key) ? (key as `0x${string}`) : null
}

function asAddress(address: string): `0x${string}` {
  return address as `0x${string}`
}

let faucetQueue: Promise<unknown> = Promise.resolve()

function serializeFaucetClaim<T>(fn: () => Promise<T>): Promise<T> {
  const run = faucetQueue.then(fn, fn)
  faucetQueue = run.catch(() => undefined)
  return run
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? requestUrl.host
  const proto = request.headers.get('x-forwarded-proto') ?? requestUrl.protocol.replace(':', '')
  return NextResponse.redirect(`${proto}://${host}/faucet`)
}

export async function POST(request: Request) {
  try {
    const { address } = await request.json()

    if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
    }

    const key = address.toLowerCase()
    const privateKey = normalizePrivateKey(process.env.FAUCET_PRIVATE_KEY)
    if (!privateKey) {
      return NextResponse.json(
        { error: 'Faucet is not configured yet — missing server private key' },
        { status: 503 },
      )
    }

    const result = await serializeFaucetClaim(async () => {
      const claims = await readClaimTimes()
      const lastClaim = claims[key] ?? 0
      const now = Date.now()

      if (now - lastClaim < COOLDOWN_MS) {
        const remaining = Math.ceil((COOLDOWN_MS - (now - lastClaim)) / 60_000)
        throw new FaucetRateLimitError(`Rate limited — try again in ${remaining} minutes`)
      }

      const account = privateKeyToAccount(privateKey)
      const rpcUrl = process.env.FAUCET_RPC_URL ?? DEVNET_RPC_URL
      const publicClient = createPublicClient({ chain: goodDollarL2, transport: http(rpcUrl) })
      const walletClient = createWalletClient({ account, chain: goodDollarL2, transport: http(rpcUrl) })
      const recipient = asAddress(address)

      const [nativeBalance, gdtBalance] = await Promise.all([
        publicClient.getBalance({ address: account.address }),
        publicClient.readContract({
          address: CONTRACTS.GoodDollarToken,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [account.address],
        }),
      ])

      if (nativeBalance < NATIVE_ETH_AMOUNT) {
        throw new Error(`Faucet has insufficient gas ETH (${formatEther(nativeBalance)} ETH available)`)
      }
      if (gdtBalance < GDT_NET_AMOUNT) {
        throw new Error(`Faucet has insufficient G$ (${formatEther(gdtBalance)} G$ available)`)
      }

      const nativeTxHash = await walletClient.sendTransaction({
        account,
        to: recipient,
        value: NATIVE_ETH_AMOUNT,
      })
      await publicClient.waitForTransactionReceipt({ hash: nativeTxHash })

      const gdtTxHash = await walletClient.writeContract({
        account,
        address: CONTRACTS.GoodDollarToken,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [recipient, GDT_NET_AMOUNT],
      })
      await publicClient.waitForTransactionReceipt({ hash: gdtTxHash })

      const wethTxHash = await walletClient.writeContract({
        account,
        address: CONTRACTS.MockWETH,
        abi: erc20Abi,
        functionName: 'mint',
        args: [recipient, WETH_AMOUNT],
      })
      await publicClient.waitForTransactionReceipt({ hash: wethTxHash })

      await writeClaimTime(key, Date.now())

      return {
        nativeTxHash,
        gdtTxHash,
        wethTxHash,
        txHashes: [nativeTxHash, gdtTxHash, wethTxHash],
        amounts: {
          nativeEth: formatEther(NATIVE_ETH_AMOUNT),
          gdt: formatEther(GDT_NET_AMOUNT),
          weth: formatEther(WETH_AMOUNT),
        },
      }
    })

    console.log(`[faucet] Real claim for ${address} → ${result.txHashes.join(', ')}`)

    return NextResponse.json({ ok: true, ...result, txHash: result.gdtTxHash })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Faucet request failed'
    if (error instanceof FaucetRateLimitError) {
      return NextResponse.json({ error: message }, { status: 429 })
    }
    console.error('[faucet] Claim failed:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
