import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Intercepts malformed percent-encoded `/stocks/<ticker>` paths before
 * Next.js tries to decode them for route matching.  An incomplete sequence
 * like `%`, `%2`, or `%E0%A4%A` causes Next.js to throw a 500 because
 * `decodeURIComponent` raises a URIError.  Rewriting to
 * `/stocks/--invalid--` lets the `[...invalid]` catch-all render the
 * branded "Stock Not Found" page instead.
 *
 * Middleware runs on the edge before the App Router, so it sees the raw
 * (un-decoded) URL.
 */
export function middleware(request: NextRequest) {
  let pathname: string
  try {
    pathname = request.nextUrl.pathname
  } catch {
    // URL construction failed — redirect to safe stocks error page
    const url = new URL('/stocks/--invalid--', request.url)
    return NextResponse.redirect(url, 307)
  }

  // Only act on /stocks/<something>
  if (!pathname.startsWith('/stocks/')) return NextResponse.next()

  // Extract the segment after /stocks/
  const segment = pathname.slice('/stocks/'.length)

  // Try to decode; if it throws the encoding is malformed
  try {
    decodeURIComponent(segment)
  } catch {
    // Redirect to a safe path the [...invalid] catch-all will serve.
    // Using a redirect (not a rewrite) so the browser navigates to the new URL
    // and Next.js never tries to decode the original malformed segment.
    const url = new URL('/stocks/--invalid--', request.url)
    return NextResponse.redirect(url, 307)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/stocks/:path*'],
}
