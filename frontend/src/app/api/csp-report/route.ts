import { NextResponse, type NextRequest } from 'next/server'

import { methodNotAllowed } from '@/lib/api-error'
import { withApiRateLimit } from '@/lib/withApiRateLimit'

export const runtime = 'nodejs'

async function handlePost(request: NextRequest) {
  try {
    const body = await request.json()

    const violation =
      body['csp-report'] ?? // application/csp-report (legacy)
      (Array.isArray(body) ? body[0]?.body : body) // application/reports+json (Reporting API v1)

    if (violation) {
      console.log(
        JSON.stringify({
          level: 'warn',
          type: 'csp-violation',
          blockedUri: violation['blocked-uri'] ?? violation.blockedURL,
          violatedDirective:
            violation['violated-directive'] ?? violation.effectiveDirective,
          documentUri: violation['document-uri'] ?? violation.documentURL,
          timestamp: new Date().toISOString(),
        }),
      )
    }
  } catch {
    // Malformed body — silently drop
  }

  return new NextResponse(null, { status: 204 })
}

export const POST = withApiRateLimit(handlePost)

// Reject unsupported methods with a structured JSON envelope (405).
// Without these handlers Next.js would return its default HTML 405 page.
const ALLOWED = ['POST'] as const
const reject = (req: NextRequest) => methodNotAllowed(req, [...ALLOWED])
export const GET = reject
export const PUT = reject
export const DELETE = reject
export const PATCH = reject
