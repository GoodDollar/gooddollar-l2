import { NextResponse, type NextRequest } from 'next/server'

import { methodNotAllowed } from '@/lib/api-error'
import { DEVNET_RPC_URL } from '@/lib/devnet'

export const runtime = 'nodejs'

const TIMEOUT_MS = 8_000

async function handlePost(request: NextRequest) {
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

// Do not wrap the JSON-RPC proxy in the generic 60 RPM API limiter. A single
// wagmi page load can legitimately issue dozens of batched reads followed by
// write-path polling; applying the public API bucket here turns normal wallet
// flows into 429s and leaves contract state stale. The upstream devnet remains
// bounded by the small proxy timeout above and by the node itself.
export const POST = handlePost

// Reject unsupported methods with a structured JSON envelope (405).
const ALLOWED = ['POST'] as const
const reject = (req: NextRequest) => methodNotAllowed(req, [...ALLOWED])
export const GET = reject
export const PUT = reject
export const DELETE = reject
export const PATCH = reject
