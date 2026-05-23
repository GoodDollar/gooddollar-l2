/**
 * Lane 5 — proof-response envelope + branded error-copy resolution.
 *
 * Split from `HedgeProofViewer.tsx` so the viewer module stays a
 * components-only file (Fast Refresh / `react-doctor/only-export-
 * components`) and the exhaustive switch is easy to unit-test in
 * isolation.
 *
 * `ProofResponse` must stay a superset of every status emitted by
 * `/api/hedge/proof/latest.json` AND `/api/hedge/proof/[receiptId]`.
 * The `default` branch in `copyForResponse` is intentionally
 * defensive — it returns a branded `ErrorCopy` instead of `undefined`
 * so a wire-shape skew (engine version emits a new status, response
 * cast through `as`) never crashes render with `Cannot read
 * properties of undefined (reading 'title')`. The `const _exhaustive:
 * never = res` pattern simultaneously forces every known status to
 * be handled at compile time.
 */

export type ProofResponse =
  | {
      status: 'ok'
      markdown: string
      pointer: { path: string; timestamp: number; summary: string }
    }
  | { status: 'engine_down'; reason: string }
  | { status: 'no_proof' }
  | { status: 'engine_error'; reason: string; httpStatus: number }
  | { status: 'unreadable'; reason: string }
  | { status: 'forbidden'; reason: string }
  | { status: 'missing'; reason: string }
  | { status: 'invalid_id'; reason: string }

export interface ErrorCopy {
  title: string
  detail: string
}

export function copyForResponse(res: ProofResponse): ErrorCopy {
  switch (res.status) {
    case 'ok':
    case 'no_proof':
      return {
        title: 'Hedge proof unavailable',
        detail: 'No further detail available.',
      }
    case 'engine_down':
      return {
        title: 'Hedge engine unreachable',
        detail: 'Could not fetch the latest proof pointer from the hedge engine.',
      }
    case 'engine_error':
      return {
        title: 'Hedge engine returned an error',
        detail: `Proof pointer endpoint returned HTTP ${res.httpStatus}.`,
      }
    case 'unreadable':
      return {
        title: 'Hedge engine returned an unreadable response',
        detail: res.reason,
      }
    case 'forbidden':
      return { title: 'Proof path forbidden', detail: res.reason }
    case 'missing':
      return { title: 'Hedge proof file missing', detail: res.reason }
    case 'invalid_id':
      return { title: 'Receipt id was rejected', detail: res.reason }
    default: {
      const _exhaustive: never = res
      void _exhaustive
      return {
        title: 'Hedge proof unavailable',
        detail:
          'The proof endpoint returned an unexpected response. Retry, or open the dashboard to pick another receipt.',
      }
    }
  }
}
