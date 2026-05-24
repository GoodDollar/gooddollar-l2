import { NextResponse, type NextRequest } from 'next/server';

import { methodNotAllowed } from '@/lib/api-error';
import { withApiRateLimit } from '@/lib/withApiRateLimit';

export const runtime = 'nodejs';

const STATUS_URL = process.env.STATUS_AGGREGATOR_URL ?? 'http://localhost:9200/status.json';
const TIMEOUT_MS = 5000;

async function handleGet(_req: NextRequest) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(STATUS_URL, { signal: controller.signal, cache: 'no-store' });
    } finally {
      clearTimeout(timer);
    }

    const data = await readJson(res);
    if (!data) {
      return NextResponse.json(
        { error: 'Status aggregator returned an unparseable response', httpStatus: res.status },
        { status: 502 },
      );
    }

    if (!res.ok && !hasServices(data)) {
      return NextResponse.json(
        { error: 'Status aggregator returned an error', httpStatus: res.status },
        { status: 502 },
      );
    }

    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: 'Status aggregator unreachable', overall: 'unknown', services: [] },
      { status: 503 },
    );
  }
}

async function readJson(res: Response): Promise<Record<string, unknown> | null> {
  try {
    const data = await res.json();
    return data && typeof data === 'object' && !Array.isArray(data)
      ? data as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

function hasServices(data: Record<string, unknown>): boolean {
  return Array.isArray(data.services);
}

export const GET = withApiRateLimit(handleGet);

// Reject unsupported methods with a structured JSON envelope (405).
const ALLOWED = ['GET'] as const;
const reject = (req: NextRequest) => methodNotAllowed(req, [...ALLOWED]);
export const POST = reject;
export const PUT = reject;
export const DELETE = reject;
export const PATCH = reject;
