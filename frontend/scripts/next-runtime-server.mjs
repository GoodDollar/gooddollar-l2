#!/usr/bin/env node

import { createServer } from 'node:http'
import { parse } from 'node:url'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import next from 'next'
import { normalizeMalformedStocksPath } from './safe-route-normalizer.mjs'

export function parseCliArgs(argv) {
  let dev = false
  let port = Number(process.env.PORT || 3100)

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--dev' || arg === '-d') {
      dev = true
      continue
    }
    if (arg === '--port' || arg === '-p') {
      const nextValue = argv[i + 1]
      if (nextValue) {
        port = Number(nextValue)
        i += 1
      }
    }
  }

  return { dev, port }
}

export function applyRuntimeDistDir({ dev, env = process.env } = {}) {
  if (!dev) return env.NEXT_DIST_DIR || null
  if (env.NEXT_DIST_DIR) return env.NEXT_DIST_DIR

  // Keep dev-server artifacts isolated from the production/start build tree.
  env.NEXT_DIST_DIR = '.next.runtime-dev'
  return env.NEXT_DIST_DIR
}

export function createNextRuntimeServer({ argv = process.argv.slice(2), env = process.env } = {}) {
  const { dev, port } = parseCliArgs(argv)
  const distDir = applyRuntimeDistDir({ dev, env })
  const app = next({ dev, hostname: '0.0.0.0', port })
  const handle = app.getRequestHandler()

  return app
    .prepare()
    .then(() => {
      createServer((req, res) => {
        const incomingUrl = req.url || '/'
        const normalizedUrl = normalizeMalformedStocksPath(incomingUrl)
        if (normalizedUrl !== incomingUrl) {
          req.url = normalizedUrl
        }
        const parsedUrl = parse(req.url || '/', true)
        handle(req, res, parsedUrl)
      }).listen(port, '0.0.0.0', () => {
        const distMsg = distDir ? ` distDir=${distDir}` : ''
        process.stdout.write(
          `[next-runtime-server] ready on http://0.0.0.0:${port} (${dev ? 'dev' : 'start'})${distMsg}\n`,
        )
      })
    })
}

const invokedDirectly =
  typeof process.argv[1] === 'string' && process.argv[1] === fileURLToPath(import.meta.url)

if (invokedDirectly) {
  createNextRuntimeServer().catch((err) => {
    process.stderr.write(`[next-runtime-server] failed to boot: ${err?.stack || err}\n`)
    process.exit(1)
  })
}
