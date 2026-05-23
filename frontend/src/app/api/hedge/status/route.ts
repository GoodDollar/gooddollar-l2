import { NextResponse, type NextRequest } from 'next/server';

import { methodNotAllowed } from '@/lib/api-error';
import { withApiRateLimit } from '@/lib/withApiRateLimit';

export const runtime = 'nodejs';

const SNAPSHOT_URL =
  process.env.HEDGE_STATUS_URL ?? 'http://localhost:9116/hedge/snapshot';
const RECEIPTS_URL_BASE =
  process.env.HEDGE_RECEIPTS_URL ?? 'http://localhost:9116/hedge/receipts';
const PROOF_URL =
  process.env.HEDGE_PROOF_URL ?? 'http://localhost:9116/hedge/proof/latest';
const TIMEOUT_MS = 5_000;

async function timedFetch(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal, cache: 'no-store' });
  } finally {
    clearTimeout(timer);
  }
}

async function handleGet(_req: NextRequest) {
  try {
    const [snapRes, receiptsRes, proofRes] = await Promise.all([
      timedFetch(SNAPSHOT_URL),
      timedFetch(`${RECEIPTS_URL_BASE}?limit=5`),
      timedFetch(PROOF_URL),
    ]);

    if (!snapRes.ok && snapRes.status !== 503) {
      return NextResponse.json(
        { error: 'Hedge engine returned an error', httpStatus: snapRes.status },
        { status: 502 },
      );
    }

    const snapshotEnvelope = snapRes.ok ? await snapRes.json() : null;
    const receipts = receiptsRes.ok ? (await receiptsRes.json()).receipts ?? [] : [];
    const proof = proofRes.ok ? await proofRes.json() : null;

    return NextResponse.json({
      snapshot: snapshotEnvelope?.snapshot ?? null,
      capSnapshot: snapshotEnvelope?.capSnapshot ?? null,
      breakerState: snapshotEnvelope?.breakerState ?? null,
      killSwitchEngaged: Boolean(snapshotEnvelope?.killSwitchEngaged),
      receipts,
      proof,
    });
  } catch {
    return NextResponse.json(
      {
        error: 'Hedge engine unreachable',
        snapshot: null,
        receipts: [],
        proof: null,
      },
      { status: 503 },
    );
  }
}

export const GET = withApiRateLimit(handleGet);

const ALLOWED = ['GET'] as const;
const reject = (req: NextRequest) => methodNotAllowed(req, [...ALLOWED]);
export const POST = reject;
export const PUT = reject;
export const DELETE = reject;
export const PATCH = reject;
