/**
 * Strict JSON-RPC POST helper for the bare-fetch transport used by the Live
 * Activity page (and any future page that wants raw RPC without pulling in the
 * full wagmi/viem stack).
 *
 * Background — task 0069: the previous inline `rpcCall` in
 * `frontend/src/app/activity/page.tsx` swallowed every error path silently:
 *
 *   - no `res.ok` check     → 5xx surfaced as `data.result === undefined`
 *   - no `data.error` check → JSON-RPC errors surfaced as `undefined`
 *   - no timeout            → a hanging service-worker intercept hung forever
 *   - no `Accept: application/json` / `Cache-Control: no-store`
 *                           → the registered service worker could serve a
 *                             cached HTML 404 for a POST, making `res.json()`
 *                             throw and the page anchor at "Block #0"
 *
 * `hexToNumber(undefined)` coerces to `NaN` and then `0`, which rendered as
 * `Block #0` beside a green "Live" pulse — the most misleading possible
 * combination. This helper makes every failure mode loud and typed so callers
 * can render a real error banner.
 */

export class RpcError extends Error {
  constructor(
    public method: string,
    public code: number | string,
    message: string,
    public url: string,
  ) {
    super(message)
    this.name = 'RpcError'
  }
}

export interface RpcOptions {
  timeoutMs?: number
}

export async function rpcCall<T = unknown>(
  url: string,
  method: string,
  params: unknown[] = [],
  options: RpcOptions = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? 4_000
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    let res: Response
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-store',
        },
        body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
        signal: ctrl.signal,
      })
    } catch (e) {
      const err = e as Error
      const code = err.name === 'AbortError' ? 'timeout' : 'network-error'
      throw new RpcError(method, code, err.message || String(err), url)
    }

    if (!res.ok) {
      throw new RpcError(method, res.status, `HTTP ${res.status}`, url)
    }

    let data: { result?: unknown; error?: { code?: number; message?: string } }
    try {
      data = await res.json()
    } catch (e) {
      throw new RpcError(method, 'invalid-json', (e as Error).message || 'response was not valid JSON', url)
    }

    if (data?.error) {
      throw new RpcError(
        method,
        data.error.code ?? 'rpc-error',
        data.error.message ?? 'unknown JSON-RPC error',
        url,
      )
    }
    if (data?.result === undefined) {
      throw new RpcError(method, 'no-result', 'response missing result field', url)
    }
    return data.result as T
  } finally {
    clearTimeout(t)
  }
}
