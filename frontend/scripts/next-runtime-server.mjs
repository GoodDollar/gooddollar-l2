#!/usr/bin/env node

import { createServer } from 'node:http'
import { parse } from 'node:url'
import process from 'node:process'
import next from 'next'
import { normalizeMalformedStocksPath } from './safe-route-normalizer.mjs'

function parseCliArgs(argv) {
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

const { dev, port } = parseCliArgs(process.argv.slice(2))
const app = next({ dev, hostname: '0.0.0.0', port })
const handle = app.getRequestHandler()

app
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
      process.stdout.write(
        `[next-runtime-server] ready on http://0.0.0.0:${port} (${dev ? 'dev' : 'start'})\n`,
      )
    })
  })
  .catch((err) => {
    process.stderr.write(`[next-runtime-server] failed to boot: ${err?.stack || err}\n`)
    process.exit(1)
  })
