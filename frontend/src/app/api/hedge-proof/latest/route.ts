import { NextResponse, type NextRequest } from 'next/server'
import { promises as fs } from 'node:fs'
import path from 'node:path'

import { withApiRateLimit } from '@/lib/withApiRateLimit'

export const runtime = 'nodejs'

function resolveProofDir(): string {
  if (process.env.HEDGE_PROOF_DIR) {
    return path.resolve(process.env.HEDGE_PROOF_DIR)
  }
  return path.resolve(process.cwd(), '..', 'qa-proof', 'hedges')
}

/**
 * Stable, repository-relative locator exposed to clients in place of the
 * resolved absolute path. The on-disk filename is fixed; the absolute
 * path stays internal to the handler so we never leak deployment
 * topology (home dir, OS user, project root) through the API or the
 * proof page.
 */
export const RELATIVE_SOURCE_LOCATOR = 'qa-proof/hedges/latest.json'

async function handleGet(_req: NextRequest) {
  const proofPath = path.join(resolveProofDir(), 'latest.json')
  try {
    const raw = await fs.readFile(proofPath, 'utf8')
    const proof = JSON.parse(raw)
    return NextResponse.json(
      { proof, source: RELATIVE_SOURCE_LOCATOR },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json(
        {
          error: 'no_proof',
          message: 'No hedge proof has been recorded yet.',
          source: RELATIVE_SOURCE_LOCATOR,
        },
        { status: 404, headers: { 'Cache-Control': 'no-store' } },
      )
    }
    return NextResponse.json(
      { error: 'read_failed', message: (err as Error).message },
      { status: 500 },
    )
  }
}

export const GET = withApiRateLimit(handleGet)
