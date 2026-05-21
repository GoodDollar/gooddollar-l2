#!/usr/bin/env node

import { spawnSync } from 'node:child_process'

const checks = [
  {
    route: '/(app)/stocks/page',
    budgetKb: Number(process.env.STOCKS_MARKETS_BUDGET_KB ?? 1150),
  },
  {
    route: '/(app)/stocks/[ticker]/page',
    budgetKb: Number(process.env.STOCKS_DETAIL_BUDGET_KB ?? 1250),
  },
  {
    route: '/(app)/stocks/portfolio/page',
    budgetKb: Number(process.env.STOCKS_PORTFOLIO_BUDGET_KB ?? 1200),
  },
]

for (const check of checks) {
  const child = spawnSync(
    'node',
    ['scripts/check-route-bundle.mjs'],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        ROUTE: check.route,
        ROUTE_BUDGET_KB: String(check.budgetKb),
      },
    },
  )

  if ((child.status ?? 1) !== 0) {
    process.exit(child.status ?? 1)
  }
}

console.log('[check-stocks-bundles] OK')
