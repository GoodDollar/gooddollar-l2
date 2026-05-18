import { NextResponse, type NextRequest } from 'next/server';

import { withApiRateLimit } from '@/lib/withApiRateLimit';

export const runtime = 'nodejs';

const STATUS_URL = process.env.STATUS_AGGREGATOR_URL ?? 'http://localhost:9200/status.json';
const TIMEOUT_MS = 5000;

async function handleGet(_req: NextRequest) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(STATUS_URL, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(timer);

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Status aggregator returned an error', httpStatus: res.status },
        { status: 502 },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Status aggregator unreachable', overall: 'unknown', services: [] },
      { status: 503 },
    );
  }
}

export const GET = withApiRateLimit(handleGet);
