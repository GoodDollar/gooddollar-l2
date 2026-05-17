import { NextResponse } from 'next/server'

export async function POST(request: Request) {
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
