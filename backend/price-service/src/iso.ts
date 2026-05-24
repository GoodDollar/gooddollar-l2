/**
 * Pair every absolute unix-ms timestamp with its ISO 8601 companion so
 * a fresh user reading `1779547903356` doesn't have to reach for
 * `date -d @<secs>` (and remember to divide by 1000) to know when
 * something happened. Null-safe so callers can pass nullable
 * timestamps (`firstAt`/`lastAt`, `source.lastAttachAt`) directly
 * without conditionals.
 *
 * Lives in its own module so both `server.ts` (REST envelope) and
 * `source-status.ts` (sanitiser) can import it without forming a
 * circular dependency through `envelope.ts`.
 */
export function isoFromMs(ms: number | null): string | null {
  return ms === null ? null : new Date(ms).toISOString();
}
