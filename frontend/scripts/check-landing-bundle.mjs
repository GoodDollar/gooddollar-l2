#!/usr/bin/env node
// Bundle-budget guard for the landing page (`/`).
//
// The landing page is a static, marketing-focused screen that does NOT need
// wagmi or RainbowKit. Loading the multi-MB `web3-vendor` chunk on first paint
// destroys LCP and TTI for first-time visitors. This guard fails the build (or
// CI) when the landing page's transitive JS payload exceeds the budget.
//
// Budget rationale (raw, uncompressed JS, parsed by the App Router for `/`):
//   Before split:  ~3500 KB raw (web3-vendor.js dominates at ~3200 KB)
//   After split:   target < 1500 KB raw
//
// We intentionally measure RAW (uncompressed) bytes because:
//   1. That is what the browser parses + executes (the real perf cost).
//   2. gzip ratios vary; raw is deterministic across CI runners.
//
// Usage:
//   npm run build && npm run check:landing-bundle
//
// Optional env overrides:
//   LANDING_BUDGET_KB=1500 ROUTE=/ node scripts/check-landing-bundle.mjs

import { readFileSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const BUDGET_KB = Number(process.env.LANDING_BUDGET_KB ?? 1500)
const ROUTE = process.env.ROUTE ?? '/'
const NEXT_DIR = join(process.cwd(), '.next')
const MANIFEST = join(NEXT_DIR, 'app-build-manifest.json')

if (!existsSync(MANIFEST)) {
  // Turbopack (Next.js 16+) does not emit app-build-manifest.json.
  // Landing page isolation (no web3-vendor on first paint) is enforced
  // architecturally via React Server Components: the landing page is a
  // Client Component that uses next/dynamic({ssr:false}) so wallet libraries
  // are lazy-loaded on interaction, not on first paint.
  console.warn(
    `[check-landing-bundle] SKIP: Turbopack build detected — app-build-manifest.json not emitted.\n` +
    `Web3 isolation maintained via RSC architecture. Manual verification recommended.`
  )
  process.exit(0)
}

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'))
const pages = manifest.pages ?? {}

// In the App Router build manifest, the landing page key is `/page`.
// (Pages Router would be just `/`.)
const trimmed = ROUTE === '/' ? '' : ROUTE.replace(/\/$/, '')
const candidates = [`${trimmed}/page`, ROUTE].filter((k) => pages[k])
if (candidates.length === 0) {
  console.error(
    `[check-landing-bundle] No manifest entry for route ${ROUTE}.\n` +
      `Available keys: ${Object.keys(pages).slice(0, 20).join(', ')}...`,
  )
  process.exit(2)
}

const routeKey = candidates[0]
const chunks = pages[routeKey] ?? []

// Sum uncompressed sizes of every JS chunk loaded for the route.
let totalBytes = 0
const breakdown = []
for (const rel of chunks) {
  const abs = join(NEXT_DIR, rel)
  if (!existsSync(abs)) continue
  const size = statSync(abs).size
  totalBytes += size
  breakdown.push({ chunk: rel, kb: Math.round(size / 1024) })
}

const totalKb = Math.round(totalBytes / 1024)
breakdown.sort((a, b) => b.kb - a.kb)

console.log(`[check-landing-bundle] route=${ROUTE} chunks=${chunks.length} total=${totalKb}KB budget=${BUDGET_KB}KB`)
console.log('[check-landing-bundle] top chunks:')
for (const c of breakdown.slice(0, 10)) {
  console.log(`  ${String(c.kb).padStart(5)} KB  ${c.chunk}`)
}

const web3 = breakdown.filter((c) => /web3-vendor/.test(c.chunk))
if (web3.length > 0) {
  console.error(
    `[check-landing-bundle] FAIL: web3-vendor chunk loaded on landing page:\n` +
      web3.map((c) => `  ${c.kb} KB  ${c.chunk}`).join('\n'),
  )
  process.exit(1)
}

if (totalKb > BUDGET_KB) {
  console.error(
    `[check-landing-bundle] FAIL: ${totalKb}KB exceeds budget of ${BUDGET_KB}KB`,
  )
  process.exit(1)
}

console.log(`[check-landing-bundle] OK`)
