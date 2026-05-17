import { NextResponse } from 'next/server'

const COOLDOWN_MS = 60 * 60 * 1000 // 1 hour
const claimTimes = new Map<string, number>()

export async function POST(request: Request) {
  try {
    const { address } = await request.json()

    if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
    }

    const key = address.toLowerCase()
    const lastClaim = claimTimes.get(key) ?? 0
    const now = Date.now()

    if (now - lastClaim < COOLDOWN_MS) {
      const remaining = Math.ceil((COOLDOWN_MS - (now - lastClaim)) / 60_000)
      return NextResponse.json(
        { error: `Rate limited — try again in ${remaining} minutes` },
        { status: 429 },
      )
    }

    claimTimes.set(key, now)

    // In production this would call ethers to send tokens.
    // For now, log the claim and return a mock tx hash.
    const mockTxHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
    console.log(`[faucet] Claim for ${address} → ${mockTxHash}`)

    return NextResponse.json({ ok: true, txHash: mockTxHash })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
