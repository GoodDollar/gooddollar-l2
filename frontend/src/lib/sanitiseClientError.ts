export type ClientErrorContext =
  | 'price-service'
  | 'price-service-shape'
  | 'oracle-multicall'
  | 'hedge-proof'
  | 'hedge-proof-shape'

/**
 * Convert a raw client-side error (fetch, wagmi, JSON parser, etc.) into a
 * fixed, user-safe one-liner for the proof-page degraded panels. The
 * underlying error is forwarded to console.error so operators can still
 * dig into it from the browser devtools.
 *
 * The function deliberately returns canned strings only: no fields from
 * `err` ever flow back to the caller. This keeps deployment-topology
 * strings (RPC URLs, hostnames, errno codes, parser internals) out of
 * the rendered DOM.
 */
export function sanitiseClientError(
  ctx: ClientErrorContext,
  err: unknown,
): string {
  console.error('[proof-panel]', ctx, err)
  switch (ctx) {
    case 'price-service':
      return 'Live quotes feed is unreachable. The price-service may be offline or restarting.'
    case 'price-service-shape':
      return 'Live quotes feed returned an unexpected payload shape.'
    case 'oracle-multicall':
      return 'On-chain oracle reads are unavailable. The RPC endpoint may be unreachable.'
    case 'hedge-proof':
      return 'Hedge proof endpoint is unreachable. The /api/hedge-proof/latest route may be restarting.'
    case 'hedge-proof-shape':
      return 'Hedge proof file has an unexpected shape. Re-run the hedge engine to regenerate it.'
  }
}
