import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildDashboard,
  renderDashboardMarkdown,
} from '../generate_rebalance_drift_dashboard.mjs'

test('buildDashboard computes P0 stop summary from proof payload', () => {
  const dashboard = buildDashboard({
    generatedAt: '2026-05-21T00:00:00Z',
    symbols: {
      AAPL: {
        ok: true,
        blockResults: [
          { block: 1200, divergenceBps: 12, stopReasons: [] },
          { block: 1201, divergenceBps: 14, stopReasons: [] },
        ],
      },
      TSLA: {
        ok: false,
        blockResults: [
          { block: 1200, divergenceBps: 20, stopReasons: [] },
          { block: 1201, divergenceBps: 3, stopReasons: ['STALE_PROPAGATION', 'SECRET_LEAKAGE'] },
        ],
      },
    },
  })

  assert.equal(dashboard.symbolRows.length, 2)
  assert.equal(dashboard.stopMatrix.stalePropagation, true)
  assert.equal(dashboard.stopMatrix.secretLeakage, true)
  assert.equal(dashboard.stopMatrix.divergenceAbove0_5Pct, false)
})

test('renderDashboardMarkdown includes required stop-rule section and symbol rows', () => {
  const markdown = renderDashboardMarkdown({
    generatedAt: '2026-05-21T00:00:00Z',
    symbolRows: [
      {
        symbol: 'AAPL',
        blockWindow: '1200->1201',
        maxDivergenceBps: 14,
        staleProducts: 'none',
        stopReasons: 'none',
        status: 'PASS',
      },
    ],
    stopMatrix: {
      divergenceAbove0_5Pct: false,
      stalePropagation: false,
      secretLeakage: false,
    },
  })

  assert.match(markdown, /P0 Stop Rule Matrix/)
  assert.match(markdown, /AAPL/)
  assert.match(markdown, /divergence > 0.5%/)
})
