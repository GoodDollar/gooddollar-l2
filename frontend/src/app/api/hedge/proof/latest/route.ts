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
 * Lane 5 — `latest proof` markdown artifact endpoint.
 *
 * Returns the most recent hedge proof markdown body as
 * `text/markdown`. Failure semantics are markdown-shaped so existing
 * automation / curl flows keep working unchanged. The in-app proof
 * viewer at `/analytics/hedge/proof/latest` consumes the JSON
 * companion route (`./latest.json`) instead.
 */

export const runtime = 'nodejs';

function markdown(body: string, status: number): NextResponse {
  return new NextResponse(body, {
    status,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
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
