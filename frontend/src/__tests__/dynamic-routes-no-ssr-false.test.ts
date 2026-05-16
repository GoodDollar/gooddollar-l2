import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Regression test for task 0090 — `next/dynamic({ ssr: false })` inside an
// App Router dynamic route segment (`[param]/page.tsx`) produces a broken
// client-reference manifest in production builds, leading to HTTP 500 with
// `TypeError: Cannot read properties of undefined (reading 'call')` at
// runtime. The fix is to static-import the component and gate rendering
// behind `useMounted()` instead. See
// .autobuilder/initiatives/0002-security-hardening/tasks/0090-*.md.
const DYNAMIC_ROUTE_PAGES = [
  'src/app/(app)/predict/[marketId]/page.tsx',
  'src/app/(app)/explore/[symbol]/page.tsx',
  'src/app/(app)/stocks/[ticker]/page.tsx',
] as const

describe('dynamic route segments do not use next/dynamic({ ssr: false })', () => {
  for (const rel of DYNAMIC_ROUTE_PAGES) {
    it(`${rel} does not import or call next/dynamic`, () => {
      const abs = resolve(__dirname, '..', '..', rel)
      const src = readFileSync(abs, 'utf8')
      expect(
        src,
        `${rel} must not \`import dynamic from 'next/dynamic'\` — see task 0090`,
      ).not.toMatch(/import\s+dynamic\s+from\s+['"]next\/dynamic['"]/)
      expect(
        src,
        `${rel} must not call \`dynamic(...)\` — use static import + useMounted instead`,
      ).not.toMatch(/=\s*dynamic\s*\(/)
      expect(
        src,
        `${rel} must not use \`ssr: false\` (App Router dynamic-segment bug)`,
      ).not.toMatch(/ssr:\s*false/)
    })
  }
})
