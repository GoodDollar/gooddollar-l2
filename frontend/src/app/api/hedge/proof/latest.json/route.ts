import { NextResponse, type NextRequest } from 'next/server';
import { readFile } from 'node:fs/promises';
import * as path from 'node:path';

import { methodNotAllowed } from '@/lib/api-error';
import {
  PROOF_URL,
  resolveSafePath,
  timedFetch,
  type ProofPointer,
} from '@/lib/hedge-proof';
import { withApiRateLimit } from '@/lib/withApiRateLimit';

/**
 * Lane 5 — JSON companion to `/api/hedge/proof/latest`.
 *
 * The in-app proof viewer at `/analytics/hedge/proof/latest` needs the
 * markdown body alongside pointer metadata (timestamp, summary) so it
 * can render a styled, branded page rather than a raw-markdown
 * dead-end. Returning JSON here keeps the existing markdown route
 * intact for automation/curl flows.
 *
 * Status discriminants are explicit so the client can render branded
 * copy per failure mode without parsing a HTTP status:
 *   - ok          → markdown + pointer
 *   - engine_down → engine fetch rejected/timed out
 *   - no_proof    → engine returned 404 (no artifacts yet)
 *   - engine_error→ engine returned 5xx with no body / wrong shape
 *   - unreadable  → pointer JSON parse failed or shape was wrong
 *   - forbidden   → pointer escapes the allowed proof directory
 *   - missing     → file does not exist on disk
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
  | { status: 'missing'; reason: string };

function json(body: ProofResponse, status: number): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

async function handleGet(_req: NextRequest): Promise<NextResponse> {
  let pointerRes: Response;
  try {
    pointerRes = await timedFetch(PROOF_URL);
  } catch {
    return json(
      { status: 'engine_down', reason: 'Hedge engine unreachable' },
      502,
    );
  }

  if (pointerRes.status === 404) {
    return json({ status: 'no_proof' }, 404);
  }
  if (!pointerRes.ok) {
    return json(
      {
        status: 'engine_error',
        reason: 'Hedge engine returned an error',
        httpStatus: pointerRes.status,
      },
      502,
    );
  }

  let pointer: ProofPointer;
  try {
    pointer = (await pointerRes.json()) as ProofPointer;
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
