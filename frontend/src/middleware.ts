import { NextRequest, NextResponse } from 'next/server';

import { checkRateLimit } from '@/lib/rate-limit';

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  if (process.env.RATE_LIMIT_ENABLED === 'false') {
    return NextResponse.next();
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.ip ||
    'unknown';

  const { allowed, retryAfterSeconds } = checkRateLimit(ip);

  if (!allowed) {
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfterSeconds),
        },
      },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
