#!/usr/bin/env node
/**
 * Regression guard: detect Next.js BUILD_ID drift between the latest
 * `next build` artifact on disk and the still-running PM2 process.
 *
 * Failure mode
 * ------------
 * In production the `goodswap` PM2 app runs `next start -p 3100` and caches
 * its `BUILD_ID` (read from `.next/BUILD_ID` at boot) into every rendered
 * HTML page and every `<link>` to a hashed CSS bundle under
 * `_next/static/css/<hash>.css`. Running `next build` rotates BUTH the
 * BUILD_ID file AND the CSS hashes. The PM2 process keeps serving HTML that
 * references the OLD hashes; Next's static handler then returns HTTP 400 for
 * those stale asset paths and every page renders unstyled.
 *
 * The only fix after a build is `pm2 reload goodswap --update-env`. This
 * script makes that requirement enforceable: it compares the disk BUILD_ID
 * against the live `buildId` field inside the running process's
 * `__NEXT_DATA__` payload and fails loudly on mismatch.
 *
 * Tracking:
 *   .autobuilder/initiatives/0002-security-hardening/tasks/
 *     0060-fix-frontend-deploy-stale-buildid-pm2-reload.md
 *
 * Modes
 * -----
 * - strict (CLI flag --strict, or NEXT_LIVE_URL set): live process MUST be
 *   reachable. Reachability failure ⇒ exit 1.
 * - non-strict (default for `check:perf` during build): if the live process
 *   is unreachable (e.g. CI build phase where nothing is bound to :3100),
 *   exit 0 with a SKIP message. The deploy script always runs in strict
 *   mode because by then PM2 has been reloaded.
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// Formats seen in live Next.js HTML depending on router/version:
//   - Pages Router (legacy): `"buildId":"<id>"` inside __NEXT_DATA__.
//   - App Router (Next 13+): `buildId\":\"<id>\"` in the RSC payload.
//   - App Router (Next 16/Turbopack): compact RSC root key `"b":"<id>"`
//     (or JSON-escaped `b\":\"<id>\"`).
// We match all known variants. The captured group is the BUILD_ID.
const BUILD_ID_REGEX = /(?:"buildId":"|buildId\\":\\"|,"b":"|b\\":\\")([^"\\]+)/

export async function checkBuildIdSync({
  cwd = process.cwd(),
  liveUrl = process.env.NEXT_LIVE_URL ?? 'http://localhost:3100/',
  strict = false,
  fetchImpl = globalThis.fetch,
  timeoutMs = 5000,
} = {}) {
  // --- Disk side: load on-disk BUILD_ID -------------------------------------
  const buildIdPath = join(cwd, '.next', 'BUILD_ID')
  if (!existsSync(buildIdPath)) {
    return {
      exitCode: 1,
      message: [
        '[check-buildid-sync] FAIL: missing .next/BUILD_ID',
        `  expected at: ${buildIdPath}`,
        '  run `npm run build` first (next build writes .next/BUILD_ID).',
        '',
        'Tracking: 0060-fix-frontend-deploy-stale-buildid-pm2-reload',
      ].join('\n'),
    }
  }
  const diskBuildId = readFileSync(buildIdPath, 'utf8').trim()

  // --- Live side: fetch __NEXT_DATA__.buildId from running process ---------
  let liveHtml
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)
    try {
      const res = await fetchImpl(liveUrl, { signal: ctrl.signal })
      liveHtml = await res.text()
    } finally {
      clearTimeout(timer)
    }
  } catch (err) {
    const msg = String(err?.message ?? err)
    if (strict) {
      return {
        exitCode: 1,
        message: [
          '[check-buildid-sync] FAIL: live process is unreachable',
          `  url: ${liveUrl}`,
          `  reason: ${msg}`,
          '  the goodswap PM2 process is not running (or not bound to that port).',
          '  fix: `pm2 reload goodswap --update-env` (or `pm2 start pm2-ecosystem.config.js`).',
          '',
          'Tracking: 0060-fix-frontend-deploy-stale-buildid-pm2-reload',
        ].join('\n'),
      }
    }
    return {
      exitCode: 0,
      message: [
        `[check-buildid-sync] SKIP: live process at ${liveUrl} unreachable (${msg}).`,
        '  Non-strict mode: assuming CI build phase. Run with --strict (or set',
        '  NEXT_LIVE_URL) after `pm2 reload goodswap` to enforce.',
      ].join('\n'),
    }
  }

  // --- Extract live buildId (Pages Router __NEXT_DATA__ or App Router RSC payload)
  const match = BUILD_ID_REGEX.exec(liveHtml)
  if (!match) {
    return {
      exitCode: 1,
      message: [
        '[check-buildid-sync] FAIL: no buildId in live HTML.',
        `  url: ${liveUrl}`,
        '  expected Pages Router `"buildId":"..."`, App Router `buildId\\":\\"..."`,',
        '  or Next 16/Turbopack App Router compact `"b":"..."` in the RSC payload.',
        '  the live response does not look like a Next.js page —',
        '  is the wrong process bound to that port?',
        '',
        'Tracking: 0060-fix-frontend-deploy-stale-buildid-pm2-reload',
      ].join('\n'),
    }
  }
  const liveBuildId = match[1]

  // --- Compare --------------------------------------------------------------
  if (diskBuildId !== liveBuildId) {
    return {
      exitCode: 1,
      message: [
        '[check-buildid-sync] FAIL: BUILD_ID drift detected',
        `  disk (.next/BUILD_ID): ${diskBuildId}`,
        `  live (__NEXT_DATA__):  ${liveBuildId}`,
        '',
        '  The PM2-managed Next.js process is serving HTML that references CSS',
        '  bundles from a previous build. Every page is unstyled (HTTP 400 on',
        '  stale _next/static/css/*.css paths).',
        '',
        '  fix: `pm2 reload goodswap --update-env`',
        '',
        'Tracking: 0060-fix-frontend-deploy-stale-buildid-pm2-reload',
      ].join('\n'),
    }
  }

  return {
    exitCode: 0,
    message: `[check-buildid-sync] OK — disk BUILD_ID matches live: ${diskBuildId}`,
  }
}

// CLI entry point: only run when executed directly (not when imported by tests).
const invokedAsScript =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('check-buildid-sync.mjs')

if (invokedAsScript) {
  const strict = process.argv.includes('--strict') || !!process.env.NEXT_LIVE_URL_STRICT
  const result = await checkBuildIdSync({ strict })
  if (result.exitCode === 0) {
    console.log(result.message)
  } else {
    console.error(result.message)
  }
  process.exit(result.exitCode)
}
