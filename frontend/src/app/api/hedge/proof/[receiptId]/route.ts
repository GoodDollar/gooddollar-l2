import { NextResponse, type NextRequest } from 'next/server';
import { readFile } from 'node:fs/promises';
import * as path from 'node:path';

import { methodNotAllowed } from '@/lib/api-error';
import {
  proofUrlsForReceipt,
  resolveSafePath,
  timedFetch,
  type ProofPointer,
} from '@/lib/hedge-proof';
import { withApiRateLimit } from '@/lib/withApiRateLimit';

/**
 * Lane 5 — per-receipt JSON proof route (task 0045).
 *
 * Mirrors `latest.json` structurally but resolves a per-receipt id
 * against the engine instead of `latest`. The engine's per-id endpoint
 * shape varies by engine version, so we probe path-style first
 * (`/proof/<id>`) then fall back to query-style (`/proof/latest?id=<id>`)
 * before reporting engine_down. The unified `ProofResponse` JSON shape
 * matches `latest.json`'s contract so the shared `HedgeProofViewer`
 * component composes both surfaces.
 */

export const runtime = 'nodejs';

type ProofResponse =
  | {
      status: 'ok';
      markdown: string;
      pointer: { path: string; timestamp: number; summary: string };
    }
  | { status: 'engine_down'; reason: string }
  | { status: 'no_proof' }
  | { status: 'engine_error'; reason: string; httpStatus: number }
  | { status: 'unreadable'; reason: string }
  | { status: 'forbidden'; reason: string }
  | { status: 'missing'; reason: string }
  | { status: 'invalid_id'; reason: string };

function json(body: ProofResponse, status: number): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

interface FetchOutcome {
  ok: boolean;
  response: Response | null;
  /** All transport errors collected across the probe — used for engine_down detail. */
  errors: unknown[];
  /** Last upstream 5xx, surfaced as engine_error when no candidate succeeded. */
  lastError: { httpStatus: number } | null;
  /** True if any candidate returned a clean 404 (no_proof). */
  sawNotFound: boolean;
}

async function probeEngine(urls: string[]): Promise<FetchOutcome> {
  const errors: unknown[] = [];
  let lastError: { httpStatus: number } | null = null;
  let sawNotFound = false;
  for (const url of urls) {
    try {
      const res = await timedFetch(url);
      if (res.ok) {
        return { ok: true, response: res, errors, lastError, sawNotFound };
      }
      if (res.status === 404) {
        sawNotFound = true;
        continue;
      }
      lastError = { httpStatus: res.status };
    } catch (err) {
      errors.push(err);
    }
  }
  return { ok: false, response: null, errors, lastError, sawNotFound };
}

interface RouteContext {
  params: Promise<{ receiptId: string }> | { receiptId: string };
}

async function handleGet(
  _req: NextRequest,
  ctx?: unknown,
): Promise<NextResponse> {
  // Next 16's `params` arrives as a Promise; older versions ship a
  // plain object. Detect both shapes so the route stays portable.
  const params = ctx ? (ctx as RouteContext).params : undefined;
  const resolved = params ? await Promise.resolve(params) : { receiptId: '' };
  const decoded = (() => {
    try {
      return decodeURIComponent(resolved.receiptId ?? '');
    } catch {
      return '';
    }
  })();
  if (!decoded || decoded.length === 0) {
    return json(
      { status: 'invalid_id', reason: 'Missing or empty receipt id' },
      400,
    );
  }

  const outcome = await probeEngine(proofUrlsForReceipt(decoded));

  if (!outcome.ok) {
    if (outcome.sawNotFound && outcome.errors.length === 0 && !outcome.lastError) {
      return json({ status: 'no_proof' }, 404);
    }
    if (outcome.lastError) {
      return json(
        {
          status: 'engine_error',
          reason: 'Hedge engine returned an error',
          httpStatus: outcome.lastError.httpStatus,
        },
        502,
      );
    }
    return json(
      { status: 'engine_down', reason: 'Hedge engine unreachable' },
      502,
    );
  }

  let pointer: ProofPointer;
  try {
    pointer = (await outcome.response!.json()) as ProofPointer;
  } catch {
    return json(
      { status: 'unreadable', reason: 'Proof pointer was not valid JSON' },
      502,
    );
  }

  if (typeof pointer?.path !== 'string' || pointer.path.length === 0) {
    return json(
      { status: 'unreadable', reason: 'Proof pointer is missing a `path`' },
      502,
    );
  }

  const safePath = await resolveSafePath(pointer.path);
  if (!safePath) {
    return json(
      {
        status: 'forbidden',
        reason: 'Proof pointer resolved outside the allowed proof directory',
      },
      403,
    );
  }

  try {
    const markdown = await readFile(safePath, 'utf8');
    return json(
      {
        status: 'ok',
        markdown,
        pointer: {
          path: pointer.path,
          timestamp: pointer.timestamp,
          summary: pointer.summary,
        },
      },
      200,
    );
  } catch {
    return json(
      {
        status: 'missing',
        reason: `Could not read proof file ${path.basename(safePath)}`,
      },
      502,
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
