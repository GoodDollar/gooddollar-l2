import { NextResponse, type NextRequest } from 'next/server';
import { readFile, realpath } from 'node:fs/promises';
import * as path from 'node:path';

import { methodNotAllowed } from '@/lib/api-error';
import { withApiRateLimit } from '@/lib/withApiRateLimit';

/**
 * Lane 5 — `latest proof` markdown artifact viewer.
 *
 * The hedge-engine writes a markdown proof file per cycle and exposes a
 * pointer at `/hedge/proof/latest` with `{ path, timestamp, summary }`.
 * That route returns JSON; operators need the actual markdown body so the
 * dashboard's "latest proof →" link is useful without SSHing into a host.
 *
 * This route:
 *   1. Reads the pointer from the engine.
 *   2. Resolves the pointer's `path`, then confirms (via `realpath`) that
 *      the resolved file sits inside `HEDGE_PROOF_DIR_FRONTEND`. This is
 *      the only directory we ever read from — path traversal is rejected.
 *   3. Streams the file body as `text/markdown` so the browser renders
 *      it as plain text.
 *
 * Failure semantics are markdown bodies (not JSON) so the dashboard link
 * never sends a reviewer to a JSON dump.
 */

export const runtime = 'nodejs';

const PROOF_URL =
  process.env.HEDGE_PROOF_URL ?? 'http://localhost:9116/hedge/proof/latest';
const PROOF_DIR_RAW =
  process.env.HEDGE_PROOF_DIR_FRONTEND ??
  process.env.HEDGE_PROOF_DIR ??
  '.autobuilder/initiatives/0007e-hedging-demo/proofs';
const PROOF_DIR_ABS = path.resolve(PROOF_DIR_RAW);
const TIMEOUT_MS = 5_000;

function markdown(body: string, status: number): NextResponse {
  return new NextResponse(body, {
    status,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

async function timedFetch(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal, cache: 'no-store' });
  } finally {
    clearTimeout(timer);
  }
}

interface ProofPointer {
  path: string;
  timestamp: number;
  summary: string;
}

async function resolveSafePath(rawPath: string): Promise<string | null> {
  const candidate = path.resolve(rawPath);
  let resolved: string;
  try {
    resolved = await realpath(candidate);
  } catch {
    resolved = candidate;
  }
  const dir = PROOF_DIR_ABS;
  if (resolved === dir) return null;
  if (resolved.startsWith(dir + path.sep)) return resolved;
  return null;
}

async function handleGet(_req: NextRequest): Promise<NextResponse> {
  let pointerRes: Response;
  try {
    pointerRes = await timedFetch(PROOF_URL);
  } catch {
    return markdown(
      '# Hedge engine unreachable\n\nCould not reach the hedge-engine to fetch the proof pointer.\n',
      502,
    );
  }

  if (pointerRes.status === 404) {
    return markdown('# No hedge proof yet\n\nThe hedge-engine has not written any proof artifacts yet.\n', 404);
  }
  if (!pointerRes.ok) {
    return markdown(
      `# Hedge engine error\n\nProof pointer endpoint returned HTTP ${pointerRes.status}.\n`,
      502,
    );
  }

  let pointer: ProofPointer;
  try {
    pointer = (await pointerRes.json()) as ProofPointer;
  } catch {
    return markdown('# Hedge engine error\n\nProof pointer was not valid JSON.\n', 502);
  }

  if (typeof pointer?.path !== 'string' || pointer.path.length === 0) {
    return markdown('# Hedge engine error\n\nProof pointer is missing a `path`.\n', 502);
  }

  const safePath = await resolveSafePath(pointer.path);
  if (!safePath) {
    return markdown(
      '# Forbidden\n\nThe proof pointer resolved to a path outside the allowed proof directory.\n',
      403,
    );
  }

  try {
    const body = await readFile(safePath, 'utf8');
    return markdown(body, 200);
  } catch {
    return markdown(
      `# Hedge proof unavailable\n\nCould not read the proof file at \`${path.basename(safePath)}\`.\n`,
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
