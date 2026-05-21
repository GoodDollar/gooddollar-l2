import { NextResponse, type NextRequest } from 'next/server'

import { withApiRateLimit } from '@/lib/withApiRateLimit'

export const runtime = 'nodejs'

const PRICE_SERVICE_URL = process.env.PRICE_SERVICE_URL ?? process.env.NEXT_PUBLIC_PRICE_SERVICE_URL ?? 'http://localhost:9300'
const TIMEOUT_MS = 5000

async function handleGet(_req: NextRequest) {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    const res = await fetch(`${PRICE_SERVICE_URL}/status/quotes`, {
      signal: controller.signal,
      cache: 'no-store',
    })
    clearTimeout(timer)

    if (!res.ok) {
      return NextResponse.json(
        { error: `Oracle status endpoint returned ${res.status}` },
        { status: 502 },
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: 'Oracle status unavailable', healthy: false, freshCount: 0, totalCount: 0, quotes: [], timestamp: Date.now() },
      { status: 503 },
    )
  }
}

export const GET = withApiRateLimit(handleGet)
