#!/usr/bin/env node
/**
 * ensure-e2e-build.mjs
 *
 * Produces a production Next.js build in `.next.e2e/` (via NEXT_DIST_DIR).
 * Playwright's full suite uses `next start` against this directory so the
 * webServer stays stable for 800+ tests. Dev-mode `next dev` on `.next.e2e`
 * does not emit BUILD_ID and tends to OOM / die mid-run.
 *
 * Skips rebuild when `.next.e2e/BUILD_ID` exists unless E2E_FORCE_BUILD=1.
 */

import { existsSync, statSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const frontendRoot = resolve(__dirname, '..')
const distDirName = process.env.NEXT_DIST_DIR || '.next.e2e'
const buildIdPath = join(frontendRoot, distDirName, 'BUILD_ID')
const force = process.env.E2E_FORCE_BUILD === '1'

function resolveNextBin(cwd) {
  try {
    const req = createRequire(join(cwd, 'package.json'))
    return req.resolve('next/dist/bin/next')
  } catch {
    return null
  }
}

function buildIdReady() {
  if (!existsSync(buildIdPath)) return false
  try {
    return statSync(buildIdPath).size > 0
  } catch {
    return false
  }
}

function log(msg) {
  process.stdout.write(`[ensure-e2e-build] ${msg}\n`)
}

if (!force && buildIdReady()) {
  log(`OK — ${distDirName}/ already has a production BUILD_ID`)
  process.exit(0)
}

const nextBin = resolveNextBin(frontendRoot)
if (!nextBin) {
  process.stderr.write('[ensure-e2e-build] could not resolve next CLI; run npm install\n')
  process.exit(1)
}

log(`building production bundle into ${distDirName}/ (this may take several minutes)…`)

const result = spawnSync(process.execPath, [nextBin, 'build'], {
  cwd: frontendRoot,
  env: { ...process.env, NEXT_DIST_DIR: distDirName },
  stdio: 'inherit',
})

if (result.status !== 0) {
  process.stderr.write(
    `[ensure-e2e-build] next build failed (status=${result.status ?? 'null'} signal=${result.signal ?? 'none'})\n`,
  )
  process.exit(result.status ?? 1)
}

if (!buildIdReady()) {
  process.stderr.write(
    `[ensure-e2e-build] build finished but ${distDirName}/BUILD_ID is missing — not a production build\n`,
  )
  process.exit(1)
}

log(`OK — ${distDirName}/ production build ready`)
process.exit(0)
