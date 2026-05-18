import { NextResponse, type NextRequest } from 'next/server'

import { withApiRateLimit } from '@/lib/withApiRateLimit'

export const runtime = 'nodejs'

async function handlePost(request: NextRequest) {
  try {
    const body = await request.json()
    const entry = {
      ...body,
      receivedAt: new Date().toISOString(),
    }
    // Log to stdout — in production this would go to a persistent store
    console.log('[feedback]', JSON.stringify(entry))
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export const POST = withApiRateLimit(handlePost)
