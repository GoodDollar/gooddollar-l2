/**
 * Pure helpers that build the payload sent to `POST /api/feedback`.
 *
 * Kept dependency-free and side-effect-free so unit tests can run in plain
 * jsdom without mocking wagmi, next/navigation, or sessionStorage. Browser
 * data (pathname, wallet, viewport, sessionId, buildSha, recentConsole)
 * is gathered by the calling React component and passed in as the
 * `FeedbackContextInput` argument.
 *
 * Caps mirror the server-side limits enforced in
 * `frontend/src/app/api/feedback/route.ts` so the client never POSTs a
 * payload the server is going to reject for size.
 *
 * Tracking:
 *   .autobuilder/initiatives/0004-testnet-readiness-gate/tasks/
 *     0040-iter29-feedback-pipeline.md
 */

export const FEEDBACK_TYPES = ['bug', 'ux', 'feature', 'other'] as const
export type FeedbackType = (typeof FEEDBACK_TYPES)[number]

export const FEEDBACK_LIMITS = {
  descriptionMax: 2_000,
  consoleEntryMax: 500,
  consoleMaxEntries: 20,
  totalBodyMaxBytes: 16 * 1024,
} as const

export interface ConsoleEntry {
  level: 'error' | 'warn'
  message: string
  at: string
}

export interface FeedbackContextInput {
  pathname: string
  wallet: string | null
  viewport: { w: number; h: number; dpr: number }
  sessionId: string
  buildSha: string
  recentConsole: ReadonlyArray<ConsoleEntry>
}

export interface FeedbackPayload extends FeedbackContextInput {
  type: FeedbackType
  description: string
  timestamp: string
}

export function isFeedbackType(value: unknown): value is FeedbackType {
  return typeof value === 'string' && (FEEDBACK_TYPES as readonly string[]).includes(value)
}

/**
 * Truncates a string at `max` characters, appending an ellipsis marker
 * so reviewers can spot truncated reports. The marker counts toward the
 * final length so the result is always ≤ `max` characters.
 */
export function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  const marker = '…[truncated]'
  if (max <= marker.length) return s.slice(0, max)
  return s.slice(0, max - marker.length) + marker
}

/**
 * Caps a console-entry ring buffer to the most recent `max` entries and
 * trims each message to `FEEDBACK_LIMITS.consoleEntryMax` characters.
 */
export function capConsoleEntries(
  entries: ReadonlyArray<ConsoleEntry>,
  max: number = FEEDBACK_LIMITS.consoleMaxEntries,
): ConsoleEntry[] {
  const recent = entries.length > max ? entries.slice(entries.length - max) : entries.slice()
  return recent.map((e) => ({
    level: e.level,
    message: truncate(e.message, FEEDBACK_LIMITS.consoleEntryMax),
    at: e.at,
  }))
}

/**
 * Builds the final POST body. Description is truncated, console entries
 * are capped, and the optional `now` callback exists so unit tests can
 * pin the timestamp deterministically.
 */
export function buildFeedbackPayload(
  type: FeedbackType,
  description: string,
  ctx: FeedbackContextInput,
  now: () => string = () => new Date().toISOString(),
): FeedbackPayload {
  return {
    type,
    description: truncate(description, FEEDBACK_LIMITS.descriptionMax),
    pathname: ctx.pathname,
    wallet: ctx.wallet,
    viewport: { w: ctx.viewport.w, h: ctx.viewport.h, dpr: ctx.viewport.dpr },
    sessionId: ctx.sessionId,
    buildSha: ctx.buildSha,
    recentConsole: capConsoleEntries(ctx.recentConsole),
    timestamp: now(),
  }
}
