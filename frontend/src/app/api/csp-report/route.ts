import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
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
