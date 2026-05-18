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
 * Reuse the rate-limit helpers in `src/lib/rate-limit.ts` from inside
 * Node-runtime route handlers instead (see `src/lib/withApiRateLimit.ts`).
 *
 * Tracking:
 *   - .autobuilder/initiatives/0002-security-hardening/tasks/0021-fix-middleware-evalerror-crashes-next-start.md
 *   - .autobuilder/initiatives/0004-testnet-readiness-gate/tasks/0023-iter11-followup-middleware-reintroduced-fails-perf-gate.md
 */

import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DEFAULT_ROOT = join(__dirname, '..')

const CANDIDATES = [
  'src/middleware.ts',
  'src/middleware.js',
  'src/middleware.tsx',
  'src/middleware.jsx',
  'middleware.ts',
  'middleware.js',
]

/**
 * Check whether any forbidden middleware files exist under `root`.
 *
 * @param {{ root?: string, candidates?: string[], existsImpl?: (p: string) => boolean }} [opts]
 * @returns {{ exitCode: number, message: string, found: string[] }}
 */
export function checkMiddlewareAbsent({
  root = DEFAULT_ROOT,
  candidates = CANDIDATES,
  existsImpl = existsSync,
} = {}) {
  const found = candidates.filter((rel) => existsImpl(join(root, rel)))

  if (found.length > 0) {
    return {
      exitCode: 1,
      found,
      message: [
        '[check-middleware-absent] FAIL: Forbidden middleware file detected:',
        ...found.map((f) => `  - ${f}`),
        '',
        'Next.js middleware crashes `next start` in production with',
        "  EvalError: Code generation from strings disallowed for this context",
        'because the Edge Runtime sandbox is configured without code generation in',
        'production mode (Next 14.2.35 + Node 22+).',
        '',
        'See:',
        '  - .autobuilder/initiatives/0002-security-hardening/tasks/0021-fix-middleware-evalerror-crashes-next-start.md',
        '  - .autobuilder/initiatives/0004-testnet-readiness-gate/tasks/0023-iter11-followup-middleware-reintroduced-fails-perf-gate.md',
        '',
        'If you need rate limiting, wrap your route handler with',
        '`withApiRateLimit` from `src/lib/withApiRateLimit.ts` and set',
        "`export const runtime = 'nodejs'` on the route.",
      ].join('\n'),
    }
  }

  return {
    exitCode: 0,
    found: [],
    message: '[check-middleware-absent] OK: no middleware.ts present.',
  }
}

const invokedAsScript =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('check-middleware-absent.mjs')

if (invokedAsScript) {
  const result = checkMiddlewareAbsent()
  if (result.exitCode === 0) {
    console.log(result.message)
  } else {
    console.error(result.message)
  }
  process.exit(result.exitCode)
}
