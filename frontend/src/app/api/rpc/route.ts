import { NextResponse } from 'next/server'
import { DEVNET_RPC_URL } from '@/lib/devnet'

const TIMEOUT_MS = 8_000

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' }, id: null },
      { status: 400 },
    )
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json(
      { jsonrpc: '2.0', error: { code: -32600, message: 'Invalid Request' }, id: null },
      { status: 400 },
    )
  }

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)

  try {
    const upstream = await fetch(DEVNET_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    })

    const data = await upstream.text()

    return new Response(data, {
      status: upstream.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    const message = err instanceof Error && err.name === 'AbortError'
      ? 'Upstream RPC timeout'
      : 'Upstream RPC unreachable'
    return NextResponse.json(
      { jsonrpc: '2.0', error: { code: -32000, message }, id: null },
      { status: 502 },
    )
  } finally {
    clearTimeout(timer)
  }
}
