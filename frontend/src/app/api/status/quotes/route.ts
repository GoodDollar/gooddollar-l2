import { NextResponse, type NextRequest } from 'next/server'

import { withApiRateLimit } from '@/lib/withApiRateLimit'

export const runtime = 'nodejs'

const QUOTE_STATUS_URL = process.env.PRICE_SERVICE_URL ?? 'http://localhost:9300/status/quotes'
const TIMEOUT_MS = 5000

async function handleGet(_req: NextRequest) {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    const res = await fetch(QUOTE_STATUS_URL, { signal: controller.signal, cache: 'no-store' })
    clearTimeout(timer)

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Quote status endpoint returned an error', httpStatus: res.status },
        { status: 502 },
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: 'Quote status unavailable', healthy: false, freshCount: 0, totalCount: 0, quotes: [], timestamp: Date.now() },
      { status: 503 },
    )
  }
}

export const GET = withApiRateLimit(handleGet)
