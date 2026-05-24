import { realpath } from 'node:fs/promises'
import * as path from 'node:path'

/**
 * Lane 5 — shared helpers for the hedge-proof routes.
 *
 * Two `/api/hedge/proof/latest{,.json}` routes both need to resolve a
 * pointer path inside `HEDGE_PROOF_DIR_FRONTEND`, time out engine
 * fetches, and reject path traversal. Centralising the helpers here
 * stops the two routes drifting on the security boundary.
 */

const PROOF_DIR_RAW =
  process.env.HEDGE_PROOF_DIR_FRONTEND ??
  process.env.HEDGE_PROOF_DIR ??
  '.autobuilder/initiatives/0007e-hedging-demo/proofs'

export const PROOF_DIR_ABS = path.resolve(PROOF_DIR_RAW)
export const PROOF_URL =
  process.env.HEDGE_PROOF_URL ?? 'http://localhost:9116/hedge/proof/latest'
export const PROOF_TIMEOUT_MS = 5_000

/**
 * Builds the candidate engine URLs for a per-receipt proof lookup.
 *
 * The engine's per-id endpoint lives outside this lane's worktree, so
 * the route is defensive: try path-style first (`/proof/<id>`), fall
 * back to query-style (`/proof/latest?id=<id>`). The first endpoint
 * that returns 200 (or a clean 404) wins; 5xx falls through to the
 * next; both failing returns engine_down.
 *
 * Exported (and pure) so the proof route's tests can pin the exact URLs.
 */
export function proofUrlsForReceipt(id: string): string[] {
  const safeId = encodeURIComponent(id)
  const base = PROOF_URL.replace(/\/+$/, '').replace(/\/proof\/latest$/, '')
  return [`${base}/proof/${safeId}`, `${PROOF_URL}?id=${safeId}`]
}

export interface ProofPointer {
  path: string
  timestamp: number
  summary: string
}

export async function timedFetch(
  url: string,
  timeoutMs: number = PROOF_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { signal: controller.signal, cache: 'no-store' })
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Resolves a raw path to an absolute path inside `PROOF_DIR_ABS`, or
 * `null` if the path escapes the proof directory or is the directory
 * itself. Symbolic links are followed via `realpath` so a malicious
 * proof pointer cannot use a link to break out.
 */
export async function resolveSafePath(
  rawPath: string,
  dir: string = PROOF_DIR_ABS,
): Promise<string | null> {
  const candidate = path.resolve(rawPath)
  let resolved: string
  try {
    resolved = await realpath(candidate)
  } catch {
    resolved = candidate
  }
  if (resolved === dir) return null
  if (resolved.startsWith(dir + path.sep)) return resolved
  return null
}
