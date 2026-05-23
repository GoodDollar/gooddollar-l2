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

async function handleGet(_req: NextRequest) {
  const proofPath = path.join(resolveProofDir(), 'latest.json')
  try {
    const raw = await fs.readFile(proofPath, 'utf8')
    const proof = JSON.parse(raw)
    return NextResponse.json(
      { proof, source: proofPath },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json(
        { error: 'no_proof', message: 'No hedge proof has been recorded yet.', source: proofPath },
        { status: 404, headers: { 'Cache-Control': 'no-store' } },
      )
    }
    return NextResponse.json(
      { error: 'read_failed', message: (err as Error).message, source: proofPath },
      { status: 500 },
    )
  }
}

export const GET = withApiRateLimit(handleGet)
