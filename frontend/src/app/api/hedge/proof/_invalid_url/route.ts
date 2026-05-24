import { NextResponse, type NextRequest } from 'next/server'

import { methodNotAllowed } from '@/lib/api-error'
import { withApiRateLimit } from '@/lib/withApiRateLimit'

/**
 * Lane 5 — synthesised JSON envelope for malformed-percent-encoded
 * `/api/hedge/proof/<id>` URLs (task 0074).
 *
 * Next.js's framework-level pathname decoder runs before any route
 * handler and rejects requests with malformed `%` escapes (lonely `%`,
 * `%ZZ`, truncated multibyte) by returning its built-in HTML 400 page.
 * That violates the JSON-only contract every other handled rejection on
 * `/api/hedge/proof/*` honours.
 *
 * `normalizeMalformedHedgeProofApiPath` in the custom server
 * (`frontend/scripts/safe-route-normalizer.mjs`) rewrites those
 * requests to this route BEFORE Next.js sees the URL. Because this is
 * a static segment (`_invalid_url`), it wins Next.js's match precedence
 * over the dynamic `[receiptId]` sibling, so any literal request to
 * this path also lands here and gets the same JSON envelope. The
 * leading underscore visually separates the internal-only path from a
 * real receipt id.
 *
 * Returns the canonical `ProofResponse`-shaped envelope at HTTP 400
 * with `Content-Type: application/json` and `Cache-Control: no-store`.
 */

export const runtime = 'nodejs'

async function handleGet(): Promise<NextResponse> {
  return NextResponse.json(
    {
      status: 'invalid_id',
      reason: 'Receipt id has malformed URL encoding',
    },
    { status: 400, headers: { 'Cache-Control': 'no-store' } },
  )
}

export const GET = withApiRateLimit(handleGet)

const ALLOWED = ['GET'] as const
const reject = (req: NextRequest) => methodNotAllowed(req, [...ALLOWED])
export const POST = reject
export const PUT = reject
export const DELETE = reject
export const PATCH = reject
