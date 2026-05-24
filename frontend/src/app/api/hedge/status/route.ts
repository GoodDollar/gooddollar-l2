import { NextResponse, type NextRequest } from 'next/server';

import { methodNotAllowed } from '@/lib/api-error';
import { withApiRateLimit } from '@/lib/withApiRateLimit';

/**
 * Lane 5 — observability surface for the hedge engine.
 *
 * Fans out to three engine endpoints (snapshot, receipts, proof) in parallel
 * with `Promise.allSettled`, then composes the response:
 *
 *   - snapshot is authoritative: if it fails or 5xxs (other than the
 *     "no snapshot yet" 503), the whole envelope returns 503.
 *   - receipts and proof are best-effort: their failures are reported via
 *     a `degraded` map so the dashboard can render the rest of the card
 *     and surface a small "receipts source degraded: <reason>" chip.
 *   - 404 from /hedge/proof/latest is NOT a degradation — first-run
 *     engines legitimately have no proof yet.
 */

export const runtime = 'nodejs';

const SNAPSHOT_URL =
  process.env.HEDGE_STATUS_URL ?? 'http://localhost:9116/hedge/snapshot';
const RECEIPTS_URL_BASE =
  process.env.HEDGE_RECEIPTS_URL ?? 'http://localhost:9116/hedge/receipts';
const PROOF_URL =
  process.env.HEDGE_PROOF_URL ?? 'http://localhost:9116/hedge/proof/latest';

const DEFAULT_TIMEOUT_MS = 5_000;

function resolveTimeoutMs(): number {
  const raw = process.env.HEDGE_STATUS_TIMEOUT_MS;
  if (!raw) return DEFAULT_TIMEOUT_MS;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_TIMEOUT_MS;
  return parsed;
}

async function timedFetch(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal, cache: 'no-store' });
  } finally {
    clearTimeout(timer);
  }
}

type ClassifyOpts = { allow404?: boolean };
type ClassifyResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: string };

function reasonFromRejection(err: unknown): string {
  if (err && typeof err === 'object' && 'name' in err) {
    const name = (err as { name?: string }).name;
    if (name === 'AbortError') return 'timeout';
  }
  return 'unreachable';
}

async function classifyJson<T>(
  result: PromiseSettledResult<Response>,
  opts: ClassifyOpts = {},
): Promise<ClassifyResult<T>> {
  if (result.status === 'rejected') {
    return { ok: false, reason: reasonFromRejection(result.reason) };
  }
  const res = result.value;
  if (opts.allow404 && res.status === 404) {
    return { ok: false, reason: 'not_found' };
  }
  if (!res.ok) {
    return { ok: false, reason: `http_${res.status}` };
  }
  try {
    const value = (await res.json()) as T;
    return { ok: true, value };
  } catch {
    return { ok: false, reason: 'parse_error' };
  }
}

interface SnapshotEnvelope {
  snapshot?: unknown;
  capSnapshot?: unknown;
  breakerState?: unknown;
  killSwitchEngaged?: unknown;
  mode?: 'sandbox' | 'real' | 'demo' | 'unknown' | null;
  error?: string;
}

async function handleGet(_req: NextRequest): Promise<NextResponse> {
  const timeoutMs = resolveTimeoutMs();

  const [snapSettled, receiptsSettled, proofSettled] = await Promise.allSettled([
    timedFetch(SNAPSHOT_URL, timeoutMs),
    timedFetch(`${RECEIPTS_URL_BASE}?limit=5`, timeoutMs),
    timedFetch(PROOF_URL, timeoutMs),
  ]);

  if (snapSettled.status === 'rejected') {
    return NextResponse.json(
      {
        error: 'Hedge engine unreachable',
        snapshot: null,
        mode: null,
        receipts: [],
        proof: null,
      },
      { status: 503 },
    );
  }
  const snapRes = snapSettled.value;
  if (!snapRes.ok && snapRes.status !== 503) {
    return NextResponse.json(
      { error: 'Hedge engine returned an error', httpStatus: snapRes.status },
      { status: 502 },
    );
  }

  let snapshotEnvelope: SnapshotEnvelope | null = null;
  if (snapRes.ok) {
    try {
      snapshotEnvelope = (await snapRes.json()) as SnapshotEnvelope;
    } catch {
      return NextResponse.json(
        { error: 'Hedge engine returned malformed snapshot' },
        { status: 502 },
      );
    }
  }

  const receiptsClassified = await classifyJson<{ receipts?: unknown[] }>(
    receiptsSettled,
  );
  const proofClassified = await classifyJson<unknown>(proofSettled, {
    allow404: true,
  });

  const degraded: Record<string, string> = {};
  let receipts: unknown[] = [];
  if (receiptsClassified.ok) {
    receipts = receiptsClassified.value.receipts ?? [];
  } else {
    degraded.receipts = receiptsClassified.reason;
  }

  let proof: unknown = null;
  if (proofClassified.ok) {
    proof = proofClassified.value;
  } else if (proofClassified.reason !== 'not_found') {
    degraded.proof = proofClassified.reason;
  }

  const body: Record<string, unknown> = {
    snapshot: snapshotEnvelope?.snapshot ?? null,
    capSnapshot: snapshotEnvelope?.capSnapshot ?? null,
    breakerState: snapshotEnvelope?.breakerState ?? null,
    killSwitchEngaged: Boolean(snapshotEnvelope?.killSwitchEngaged),
    mode: snapshotEnvelope?.mode ?? null,
    receipts,
    proof,
  };
  if (Object.keys(degraded).length > 0) {
    body.degraded = degraded;
  }
  return NextResponse.json(body);
}

export const GET = withApiRateLimit(handleGet);

const ALLOWED = ['GET'] as const;
const reject = (req: NextRequest) => methodNotAllowed(req, [...ALLOWED]);
export const POST = reject;
export const PUT = reject;
export const DELETE = reject;
export const PATCH = reject;
