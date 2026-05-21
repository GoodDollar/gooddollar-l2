/**
 * POST /api/feedback — accept rich client feedback safely.
 *
 * Iteration 29 (testnet-readiness gate) hardening:
 *   - Rate-limited via `withApiRateLimit`.
 *   - Schema-validated against the canonical `FeedbackPayload` shape.
 *   - Body size is capped before parsing (DoS guard).
 *   - String leaves are redacted (`@/lib/redactSecrets`) so users who paste
 *     a private key, mnemonic, JWT, or `Bearer …` token cannot leak it.
 *   - Persisted as JSON Lines to `FEEDBACK_LOG_FILE` (defaults to
 *     `frontend/data/feedback.jsonl`). Each line is one record, prefixed
 *     by an ISO timestamp and the IP for triage. Failures to write are
 *     logged but never break the response — feedback should never 5xx.
 *
 * Tracking:
 *   .autobuilder/initiatives/0004-testnet-readiness-gate/tasks/
 *     0040-iter29-feedback-pipeline.md
 */

import { mkdirSync, appendFileSync } from 'node:fs'
import { dirname } from 'node:path'

import { NextResponse, type NextRequest } from 'next/server'

import {
  FEEDBACK_LIMITS,
  isFeedbackType,
  type ConsoleEntry,
  type FeedbackPayload,
} from '@/lib/feedbackContext'
import { methodNotAllowed } from '@/lib/api-error'
import { getRealIp } from '@/lib/rate-limit'
import { redactDeep } from '@/lib/redactSecrets'
import { withApiRateLimit } from '@/lib/withApiRateLimit'

export const runtime = 'nodejs'

const DEFAULT_LOG_PATH = 'data/feedback.jsonl'

function logPath(): string {
  return process.env.FEEDBACK_LOG_FILE || DEFAULT_LOG_PATH
}

function isString(v: unknown): v is string {
  return typeof v === 'string'
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

interface ValidationOk {
  ok: true
  value: FeedbackPayload
}
interface ValidationErr {
  ok: false
  error: string
}
type Validation = ValidationOk | ValidationErr

function validatePayload(input: unknown): Validation {
  if (!input || typeof input !== 'object') return { ok: false, error: 'Body must be a JSON object' }
  const o = input as Record<string, unknown>

  if (!isFeedbackType(o.type)) {
    return { ok: false, error: 'Invalid feedback type' }
  }
  if (!isString(o.description) || o.description.trim().length === 0) {
    return { ok: false, error: 'Description is required' }
  }
  if (o.description.length > FEEDBACK_LIMITS.descriptionMax) {
    return { ok: false, error: 'Description too long' }
  }
  if (!isString(o.pathname) || !o.pathname.startsWith('/')) {
    return { ok: false, error: 'pathname must be a string starting with /' }
  }
  if (o.wallet !== null && !(isString(o.wallet) && /^0x[a-fA-F0-9]{40}$/.test(o.wallet))) {
    return { ok: false, error: 'wallet must be null or a 0x-prefixed address' }
  }
  const vp = o.viewport
  if (
    !vp ||
    typeof vp !== 'object' ||
    !isFiniteNumber((vp as Record<string, unknown>).w) ||
    !isFiniteNumber((vp as Record<string, unknown>).h) ||
    !isFiniteNumber((vp as Record<string, unknown>).dpr)
  ) {
    return { ok: false, error: 'viewport must be { w:number, h:number, dpr:number }' }
  }
  if (!isString(o.sessionId) || o.sessionId.length === 0 || o.sessionId.length > 64) {
    return { ok: false, error: 'sessionId required (1..64 chars)' }
  }
  if (!isString(o.buildSha) || o.buildSha.length === 0 || o.buildSha.length > 64) {
    return { ok: false, error: 'buildSha required (1..64 chars)' }
  }
  if (!isString(o.timestamp) || Number.isNaN(Date.parse(o.timestamp))) {
    return { ok: false, error: 'timestamp must be an ISO date string' }
  }
  if (!Array.isArray(o.recentConsole)) {
    return { ok: false, error: 'recentConsole must be an array' }
  }
  if (o.recentConsole.length > FEEDBACK_LIMITS.consoleMaxEntries) {
    return { ok: false, error: 'recentConsole exceeds max entries' }
  }
  for (const e of o.recentConsole) {
    if (
      !e ||
      typeof e !== 'object' ||
      ((e as Record<string, unknown>).level !== 'error' &&
        (e as Record<string, unknown>).level !== 'warn') ||
      !isString((e as Record<string, unknown>).message) ||
      !isString((e as Record<string, unknown>).at)
    ) {
      return { ok: false, error: 'recentConsole entry malformed' }
    }
    if (((e as ConsoleEntry).message as string).length > FEEDBACK_LIMITS.consoleEntryMax) {
      return { ok: false, error: 'recentConsole message too long' }
    }
  }

  const vpObj = vp as Record<string, number>
  const value: FeedbackPayload = {
    type: o.type,
    description: o.description,
    pathname: o.pathname,
    wallet: (o.wallet as string | null) ?? null,
    viewport: { w: vpObj.w, h: vpObj.h, dpr: vpObj.dpr },
    sessionId: o.sessionId,
    buildSha: o.buildSha,
    timestamp: o.timestamp,
    recentConsole: o.recentConsole as ConsoleEntry[],
  }
  return { ok: true, value }
}

function persist(record: Record<string, unknown>): void {
  const path = logPath()
  try {
    mkdirSync(dirname(path), { recursive: true })
    appendFileSync(path, JSON.stringify(record) + '\n', 'utf8')
  } catch (err) {
    // Never let persistence failures block the user's feedback round-trip.
    console.error('[feedback] failed to persist', err)
  }
}

async function handlePost(request: NextRequest): Promise<Response> {
  // Body-size guard. We read text first so the cap applies before JSON.parse
  // allocates a deep object graph.
  let raw: string
  try {
    raw = await request.text()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (raw.length > FEEDBACK_LIMITS.totalBodyMaxBytes) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }
  if (raw.length === 0) {
    return NextResponse.json({ error: 'Empty body' }, { status: 400 })
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const validation = validatePayload(parsed)
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const redacted = redactDeep(validation.value)
  const record = {
    receivedAt: new Date().toISOString(),
    ip: getRealIp(request),
    ...redacted,
  }

  persist(record)
  // Keep a stdout breadcrumb so PM2 logs still surface incoming feedback
  // for live triage, but never the unredacted form.
  console.log('[feedback]', JSON.stringify({ type: record.type, pathname: record.pathname }))

  return NextResponse.json({ ok: true })
}

export const POST = withApiRateLimit(handlePost)

// Reject unsupported methods with a structured JSON envelope (405).
const ALLOWED = ['POST'] as const
const reject = (req: NextRequest) => methodNotAllowed(req, [...ALLOWED])
export const GET = reject
export const PUT = reject
export const DELETE = reject
export const PATCH = reject
