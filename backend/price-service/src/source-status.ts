import { SourceStatus } from './types';

/**
 * Convert an arbitrary thrown value (typically the `err` from a failed
 * source attach) into a single-line, path-stripped diagnostic suitable
 * for storage in `SourceStatus.reason`.
 *
 * The output:
 *   - is at most one line (no `\n`)
 *   - never carries an absolute filesystem path (`/home/...`, `C:\...`)
 *   - never carries a Node `Require stack:` trailer
 *   - is bounded to a sane length so a runaway error message can't
 *     bloat the `/health` and `/status/quotes` JSON bodies
 *
 * For Node `MODULE_NOT_FOUND` failures we collapse to the stable code
 * `etoro-client-not-installed` so monitoring can match on it.
 */
export function redactSourceReason(err: unknown): string {
  if (!(err instanceof Error)) return 'source-unavailable';
  const code = (err as NodeJS.ErrnoException).code;
  if (code === 'MODULE_NOT_FOUND') return 'etoro-client-not-installed';
  const firstLine = err.message.split('\n', 1)[0]?.trim() ?? '';
  const stripped = firstLine.replace(/(?:\/|[A-Za-z]:\\)[^\s'"]+/g, '<path>');
  if (stripped.length === 0) return 'source-unavailable';
  return stripped.length > 120 ? `${stripped.slice(0, 117)}...` : stripped;
}

/**
 * Defense-in-depth wrapper applied at the read sites (`/health`,
 * `/status/quotes`, WS snapshot). Keeps the HTTP/WS surface clean
 * even if a future caller bypasses `redactSourceReason` at the
 * write site.
 */
export function sanitizeSourceStatus(status: SourceStatus): SourceStatus {
  if (status.connected) return status;
  return { ...status, reason: redactSourceReason(new Error(status.reason)) };
}
