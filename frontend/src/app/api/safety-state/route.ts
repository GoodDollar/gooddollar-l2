import { NextResponse, type NextRequest } from 'next/server'

import { withApiRateLimit } from '@/lib/withApiRateLimit'
import { REAL_TRADING_ENABLED, SAFETY_STATE_VERSION, type SafetyStateResponse } from '@/lib/safety'

export const runtime = 'nodejs'

async function handleGet(_req: NextRequest) {
  const body: SafetyStateResponse = {
    realTradingEnabled: REAL_TRADING_ENABLED,
    etoroMode: process.env.ETORO_MODE ?? 'sandbox',
    version: SAFETY_STATE_VERSION,
  }
  return NextResponse.json(body, {
    headers: { 'Cache-Control': 'no-store' },
  })
}

export const GET = withApiRateLimit(handleGet)
