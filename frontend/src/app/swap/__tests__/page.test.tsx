import { describe, it, expect } from 'vitest'
import nextConfig from '../../../../next.config.js'

describe('Swap route redirect', () => {
  it('routes /swap → / via next.config.js (not a prerendered server-component redirect)', async () => {
    // Why this test exists:
    // Previously, `/swap` was a server component calling `redirect('/')`
    // from `next/navigation`. During Next.js static prerender, this baked
    // a 307 status into `.next/server/app/swap.meta` with NO `Location`
    // header, and a `__next_error__` HTML body. Direct navigation to
    // `/swap` was therefore broken (CRITICAL bug 0034).
    //
    // The fix moved the redirect to `next.config.js` `async redirects()`,
    // which is handled by the framework's request pipeline and emits a
    // proper `Location` header at request time. This test guards the
    // configuration so we never regress to a server-component redirect.

    expect(nextConfig.redirects).toBeTypeOf('function')

    const redirects = await nextConfig.redirects!()
    const swapRedirect = redirects.find((r) => r.source === '/swap')

    expect(swapRedirect).toBeDefined()
    expect(swapRedirect).toMatchObject({
      source: '/swap',
      destination: '/',
      permanent: false, // 307, matches prior semantics
    })
  })
})
