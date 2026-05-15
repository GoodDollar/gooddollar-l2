#!/usr/bin/env node
/**
 * Regression guard for `frontend/src/middleware.ts`.
 *
 * In Next.js 14.2.35 on Node 22+, any registered middleware is loaded inside
 * the Edge Runtime sandbox. Production mode sets the sandbox's `codeGeneration`
 * option to `undefined`, which V8 treats as "disallow `eval` and
 * `new Function`". Next's middleware loader itself uses `eval()` (see
 * `node_modules/next/dist/server/web/sandbox/context.js`), so every matched
 * request crashes with:
 *
 *   EvalError: Code generation from strings disallowed for this context
 *
 * This breaks every page in `next start` mode (HTTP 500 site-wide).
 *
 * Until either Next.js is upgraded to a version where the Edge sandbox does
 * not crash on Node 22, or middleware logic is moved into a Cloudflare Worker
 * / nginx layer in front of Next, this repo MUST NOT contain a
 * `src/middleware.ts` (or `.js`).
 *
 * Reuse the rate-limit helper at `src/lib/rateLimit.ts` from inside Node-runtime
 * route handlers instead.
 *
 * Tracking: `.autobuilder/initiatives/0002-security-hardening/tasks/0021-fix-middleware-evalerror-crashes-next-start.md`
 */

import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const candidates = [
  'src/middleware.ts',
  'src/middleware.js',
  'src/middleware.tsx',
  'src/middleware.jsx',
  'middleware.ts',
  'middleware.js',
]

const found = candidates.filter((rel) => existsSync(join(root, rel)))

if (found.length > 0) {
  console.error(
    [
      '[check-middleware-absent] FAIL: Forbidden middleware file detected:',
      ...found.map((f) => `  - ${f}`),
      '',
      'Next.js middleware crashes `next start` in production with',
      "  EvalError: Code generation from strings disallowed for this context",
      'because the Edge Runtime sandbox is configured without code generation in',
      'production mode (Next 14.2.35 + Node 22+).',
      '',
      'See .autobuilder/initiatives/0002-security-hardening/tasks/0021-fix-middleware-evalerror-crashes-next-start.md',
      '',
      'If you need rate limiting, import `checkRateLimit` from `src/lib/rateLimit.ts`',
      "inside a Node-runtime API route (set `export const runtime = 'nodejs'`).",
    ].join('\n'),
  )
  process.exit(1)
}

console.log('[check-middleware-absent] OK: no middleware.ts present.')
