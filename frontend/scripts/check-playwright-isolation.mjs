#!/usr/bin/env node
/**
 * check-playwright-isolation.mjs
 *
 * Guard against Playwright `webServer` clobbering the production `.next/`
 * build directory used by the PM2-managed `goodswap` service.
 *
 * This script enforces that:
 *   1. `playwright.config.ts` either disables `webServer` entirely
 *      (SKIP_DEV_SERVER) OR sets `webServer.env.NEXT_DIST_DIR = '.next.e2e'`
 *      so the dev server writes to an isolated directory.
 *   2. `playwright.config.ts` does NOT use the legacy `--dist-dir` CLI flag.
 *      Next 14.2.x's `next dev` rejects that flag with `unknown option` and
 *      iter19 silently shipped with isolation effectively disabled. The
 *      poison-pill assertion catches anyone who tries to revert.
 *   3. `next.config.js` actually bridges `process.env.NEXT_DIST_DIR` into
 *      Next's `distDir` config. Without this bridge the env var in
 *      playwright.config.ts is a no-op.
 *   4. `.next.e2e/` is listed in `.gitignore`.
 *
 * Exits non-zero with a clear message if any invariant is violated.
 *
 * Run via `npm run check:playwright-isolation` or as part of `prebuild`.
 *
 * Background:
 *   - Task 0029 (iter19) — original distDir isolation attempt; used the
 *     unsupported `next dev --dist-dir` CLI flag.
 *   - Task 0032 (iter21) — moved isolation to the env-var bridge that this
 *     script enforces.
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const frontendRoot = resolve(__dirname, '..')

const configPath = resolve(frontendRoot, 'playwright.config.ts')
const nextConfigPath = resolve(frontendRoot, 'next.config.js')
const runtimeServerPath = resolve(frontendRoot, 'scripts', 'next-runtime-server.mjs')
const gitignorePath = resolve(frontendRoot, '.gitignore')

const errors = []

// 1 + 2: playwright.config.ts shape
if (!existsSync(configPath)) {
  errors.push(`playwright.config.ts not found at ${configPath}`)
} else {
  const config = readFileSync(configPath, 'utf8')
  const hasWebServerBlock = /webServer\s*:/m.test(config)
  const hasSkipPattern = /SKIP_DEV_SERVER/.test(config)

  // Poison pill: catch the iter19-style legacy flag before it ships again.
  // It silently fails on Next 14.2.x and re-opens recurrence-3.
  const hasLegacyDistDirFlag = /next\s+dev[^`'"]*--dist-dir/.test(config)
  if (hasLegacyDistDirFlag) {
    errors.push(
      'playwright.config.ts uses `next dev --dist-dir` — this flag is NOT supported by `next dev` in Next 14.2.x.\n' +
        '       The webServer will silently fail to start and isolation will be off, re-opening the\n' +
        '       iter11/iter14/iter19 production .next/ clobber outage. Use `webServer.env.NEXT_DIST_DIR`\n' +
        '       instead and let next.config.js bridge it into Next\'s `distDir` config.\n' +
        '       See .autobuilder/initiatives/0004-testnet-readiness-gate/tasks/0032-*.md',
    )
  }

  if (hasWebServerBlock) {
    const hasEnvBridge = /NEXT_DIST_DIR\s*:\s*['"]\.next\.e2e['"]/.test(config)
    if (!hasEnvBridge) {
      errors.push(
        'playwright.config.ts has a webServer block but does NOT set\n' +
          '       `webServer.env.NEXT_DIST_DIR = \'.next.e2e\'`. Without the env bridge,\n' +
          '       `next dev` writes to the production `.next/` directory used by PM2-managed\n' +
          '       goodswap and clobbers the public site (recurrence-3 outage class).\n' +
          '       See .autobuilder/initiatives/0004-testnet-readiness-gate/tasks/0029-*.md\n' +
          '       and .../tasks/0032-*.md',
      )
    }
    if (!hasSkipPattern) {
      console.warn(
        '[check-playwright-isolation] note: SKIP_DEV_SERVER escape hatch missing from playwright.config.ts',
      )
    }
  }
}

// 3: next.config.js reads NEXT_DIST_DIR into distDir
if (!existsSync(nextConfigPath)) {
  errors.push(`next.config.js not found at ${nextConfigPath}`)
} else {
  const nextConfig = readFileSync(nextConfigPath, 'utf8')
  const readsEnvVar = /process\.env\.NEXT_DIST_DIR/.test(nextConfig)
  const setsDistDir = /\bdistDir\s*:/.test(nextConfig)
  if (!readsEnvVar || !setsDistDir) {
    errors.push(
      'next.config.js does NOT bridge `process.env.NEXT_DIST_DIR` into the `distDir` config option.\n' +
        '       Without this bridge, the env var set by Playwright\'s webServer is a no-op and `next dev`\n' +
        '       will write to the default `.next/` directory, clobbering production.\n' +
        '       Add to nextConfig: `distDir: process.env.NEXT_DIST_DIR || \'.next\'`.\n' +
        '       See .autobuilder/initiatives/0004-testnet-readiness-gate/tasks/0032-*.md',
    )
  }
}

// 4: .gitignore lists .next.e2e/
if (!existsSync(gitignorePath)) {
  errors.push(`.gitignore not found at ${gitignorePath}`)
} else {
  const gitignore = readFileSync(gitignorePath, 'utf8')
  const ignoresE2EDir = /^\.next\.e2e\/?\s*$/m.test(gitignore)
  if (!ignoresE2EDir) {
    errors.push(
      '.gitignore does NOT include `.next.e2e/`.\n' +
        '       Playwright build artifacts must not be committed.',
    )
  }
}

// 5: next-runtime-server dev mode must not write to production `.next/`
if (!existsSync(runtimeServerPath)) {
  errors.push(`next-runtime-server.mjs not found at ${runtimeServerPath}`)
} else {
  const runtimeServer = readFileSync(runtimeServerPath, 'utf8')
  const hasDevIsolationGuard =
    /if\s*\(\s*env\.NEXT_DIST_DIR\s*\)\s*return\s+env\.NEXT_DIST_DIR[\s\S]*env\.NEXT_DIST_DIR\s*=\s*['"]\.next\.runtime-dev['"]/.test(runtimeServer) ||
    /if\s*\(\s*dev\s*&&\s*!process\.env\.NEXT_DIST_DIR\s*\)\s*\{[\s\S]*NEXT_DIST_DIR[\s\S]*\.next\.runtime-dev/.test(runtimeServer)
  if (!hasDevIsolationGuard) {
    errors.push(
      'scripts/next-runtime-server.mjs does NOT isolate dev artifacts from production `.next/`.\n' +
        '       Add a dev-mode guard that defaults `NEXT_DIST_DIR` to `.next.runtime-dev`\n' +
        '       when callers do not provide one.',
    )
  }
}

if (errors.length > 0) {
  console.error('[check-playwright-isolation] FAIL')
  for (const err of errors) {
    console.error(`  - ${err}`)
  }
  process.exit(1)
}

console.log(
  '[check-playwright-isolation] OK — Playwright dev-server build dir is isolated from production `.next/` via NEXT_DIST_DIR env bridge',
)
