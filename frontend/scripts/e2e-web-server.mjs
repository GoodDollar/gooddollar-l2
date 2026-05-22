#!/usr/bin/env node
/**
 * Playwright webServer entrypoint.
 *
 * Default (E2E_PROD_SERVER=1): ensure production `.next.e2e` build, then `next start`.
 * Fast iteration (E2E_DEV_SERVER=1): `next dev` into `.next.e2e` (shorter runs only).
 */

import { spawnSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const frontendRoot = resolve(__dirname, '..')

function parsePort(argv) {
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '-p' || argv[i] === '--port') {
      const value = Number(argv[i + 1])
      if (Number.isFinite(value) && value > 0) return value
    }
  }
  const fromEnv = Number(process.env.E2E_PORT ?? process.env.PORT)
  if (Number.isFinite(fromEnv) && fromEnv > 0) return fromEnv
  return 3119
}

const port = parsePort(process.argv.slice(2))
const devMode = process.env.E2E_DEV_SERVER === '1'
const distDir = process.env.NEXT_DIST_DIR || '.next.e2e'

const serverEnv = {
  ...process.env,
  NEXT_DIST_DIR: distDir,
  PORT: String(port),
}

if (!devMode) {
  const build = spawnSync(process.execPath, ['scripts/ensure-e2e-build.mjs'], {
    cwd: frontendRoot,
    env: serverEnv,
    stdio: 'inherit',
  })
  if (build.status !== 0) {
    process.exit(build.status ?? 1)
  }
}

const serverArgs = [
  'scripts/next-runtime-server.mjs',
  ...(devMode ? ['--dev'] : []),
  '-p',
  String(port),
]

const server = spawnSync(process.execPath, serverArgs, {
  cwd: frontendRoot,
  env: serverEnv,
  stdio: 'inherit',
})

process.exit(server.status ?? (server.signal ? 1 : 0))
