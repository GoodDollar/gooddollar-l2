import { QuoteCache } from './quote-cache';
import { SourceStatus } from './types';
import {
  sanitizeSourceStatus,
  SanitizedSourceStatus,
} from './source-status';

export type SourceStatusGetter = () => SourceStatus;
export type WsStatusGetter = () => {
  listening: boolean;
  bindError: string | null;
  port: number | null;
};

/**
 * Wire-contract literal shipped when (cache empty AND source dead).
 * Used by `GET /quotes` (`server.ts`) and the WS on-connect snapshot
 * frame (`ws-broadcaster.ts`) so the two surfaces are byte-equal for
 * the exact same upstream state. Modifying this string is a wire
 * change — the drift-gate test asserts both surfaces import this
 * constant. See task 0076.
 */
export const DEGRADED_NO_CACHE_MESSAGE =
  'no cached quotes — upstream source is degraded ' +
  '(see source.reason / source.nextStep)';

/**
 * Single source of truth for the healthy/degraded verdict shipped on
 * `/health`, `/quotes`, `/quotes/fresh/all`, `/status/quotes`, and
 * the WS on-connect snapshot. Two endpoints reading the same inputs
 * must always agree, otherwise downstream consumers (oracle-signer,
 * frontend) get conflicting signals.
 *
 * The cache alone is not enough: an empty cache during warmup is
 * fine when the source is connected, but the same empty cache with a
 * dead source is "we will never tick" — degraded. A failed WS bind
 * is also degraded: live-tick subscribers can't connect, so the
 * service is read-only at best.
 */
export function computeDegraded(
  cache: QuoteCache,
  sourceStatusGetter?: SourceStatusGetter,
  wsStatusGetter?: WsStatusGetter,
): { degraded: boolean; src?: SanitizedSourceStatus } {
  const fresh = cache.getFresh();
  const cacheHealthy = fresh.length > 0 || cache.size === 0;
  let degraded = !cacheHealthy;
  let src: SanitizedSourceStatus | undefined;
  if (sourceStatusGetter) {
    src = sanitizeSourceStatus(sourceStatusGetter());
    if (!src.connected) degraded = true;
  }
  if (wsStatusGetter && !wsStatusGetter().listening) degraded = true;
  return { degraded, src };
}
