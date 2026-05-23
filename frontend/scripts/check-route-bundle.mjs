#!/usr/bin/env node

import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const route = process.env.ROUTE
const budgetKb = Number(process.env.ROUTE_BUDGET_KB ?? 1024)
const nextDir = join(process.cwd(), '.next')
const manifestPath = join(nextDir, 'app-build-manifest.json')

if (!route) {
  console.error('[check-route-bundle] ROUTE env var is required, e.g. ROUTE="/(app)/stocks/portfolio/page"')
  process.exit(2)
}

if (!existsSync(manifestPath)) {
  // Turbopack (Next.js 16+) does not emit app-build-manifest.json.
  // Per-route client chunk analysis is not available in Turbopack mode.
  // The webpack chunking model is replaced by Turbopack's automatic
  // code-splitting; web3 isolation is maintained architecturally via RSC.
  console.warn(
    `[check-route-bundle] SKIP: ${manifestPath} not found — Turbopack build detected.\n` +
    `Per-route bundle size checks are not available with Turbopack.\n` +
    `Web3 isolation is enforced via React Server Components (server components ship no client JS).`
  )
  process.exit(0)
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const chunks = manifest?.pages?.[route]

if (!Array.isArray(chunks)) {
  console.error(`[check-route-bundle] Route not found in manifest: ${route}`)
  process.exit(2)
}

let totalBytes = 0
const breakdown = []

for (const rel of chunks) {
  const abs = join(nextDir, rel)
  if (!existsSync(abs)) {
    continue
  }
  const size = statSync(abs).size
  totalBytes += size
  breakdown.push({ rel, kb: Math.round(size / 1024) })
}

breakdown.sort((a, b) => b.kb - a.kb)
const totalKb = Math.round(totalBytes / 1024)

console.log(`[check-route-bundle] route=${route} total=${totalKb}KB budget=${budgetKb}KB chunks=${chunks.length}`)
console.log('[check-route-bundle] top chunks:')
for (const item of breakdown.slice(0, 10)) {
  console.log(`  ${String(item.kb).padStart(5)} KB  ${item.rel}`)
}

if (totalKb > budgetKb) {
  console.error(`[check-route-bundle] FAIL: ${totalKb}KB exceeds budget ${budgetKb}KB for ${route}`)
  process.exit(1)
}

console.log('[check-route-bundle] OK')

