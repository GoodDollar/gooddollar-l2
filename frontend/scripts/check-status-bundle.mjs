#!/usr/bin/env node

/**
 * Budget guard for the /status route. Mirrors `check-stocks-bundles.mjs`
 * — delegates to the per-route helper. The status page is mostly text
 * plus small tables; 600 kB has ample headroom against the stocks pages'
 * 1150 kB. Task 0059.
 */

import { spawnSync } from 'node:child_process'

const child = spawnSync(
  'node',
  ['scripts/check-route-bundle.mjs'],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      ROUTE: '/(app)/status/page',
      ROUTE_BUDGET_KB: String(Number(process.env.STATUS_PAGE_BUDGET_KB ?? 600)),
    },
  },
)

process.exit(child.status ?? 0)
