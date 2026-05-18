#!/usr/bin/env node
/**
 * check-playwright-isolation.mjs
 *
 * Guard against Playwright `webServer` clobbering the production `.next/`
 * build directory used by the PM2-managed `goodswap` service.
 *
 * This script enforces that:
 *   1. `playwright.config.ts` uses `--dist-dir .next.e2e` in its dev-server
 *      command, OR has `webServer` disabled entirely.
 *   2. `.next.e2e/` is listed in `.gitignore`.
 *
 * Exits non-zero with a clear message if either invariant is violated.
 *
 * Run via `npm run check:playwright-isolation` or as part of `prebuild`.
 *
 * Background: task 0029 documents three separate incidents of `next dev`
 * (launched by Playwright) writing into the shared `.next/` directory while
 * `next start` was serving production traffic. The fix is to give Playwright
 * its own build dir; this script makes the fix non-removable without an
 * explicit, intentional change.
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const frontendRoot = resolve(__dirname, '..')

const configPath = resolve(frontendRoot, 'playwright.config.ts')
const gitignorePath = resolve(frontendRoot, '.gitignore')

const errors = []

if (!existsSync(configPath)) {
  errors.push(`playwright.config.ts not found at ${configPath}`)
} else {
  const config = readFileSync(configPath, 'utf8')
  // Extract the webServer block. If it's entirely undefined (SKIP_DEV_SERVER)
  // we don't need --dist-dir. Otherwise, the command must use --dist-dir.
  const hasWebServerBlock = /webServer\s*:/m.test(config)
  if (hasWebServerBlock) {
    const hasDistDirFlag = /next dev[^`'"]*--dist-dir\s+\.next\.e2e/.test(config)
    const hasSkipPattern = /SKIP_DEV_SERVER/.test(config)
    if (!hasDistDirFlag) {
      errors.push(
        'playwright.config.ts has a webServer that runs `next dev` but does NOT pass `--dist-dir .next.e2e`.\n' +
          '       This will clobber the production .next/ directory used by PM2-managed goodswap.\n' +
          '       See .autobuilder/initiatives/0004-testnet-readiness-gate/tasks/0029-*.md',
      )
    }
    if (!hasSkipPattern) {
      // Not strictly required, but warns about losing the manual SKIP_DEV_SERVER escape hatch.
      console.warn('[check-playwright-isolation] note: SKIP_DEV_SERVER escape hatch missing from playwright.config.ts')
    }
  }
}

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

if (errors.length > 0) {
  console.error('[check-playwright-isolation] FAIL')
  for (const err of errors) {
    console.error(`  - ${err}`)
  }
  process.exit(1)
}

console.log('[check-playwright-isolation] OK — Playwright is isolated from production .next/ directory')
