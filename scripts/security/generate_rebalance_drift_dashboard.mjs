import fs from 'node:fs'

function toBlockWindow(results) {
  if (!results.length) {
    return 'n/a'
  }
  return `${results[0].block}->${results[results.length - 1].block}`
}

function extractStaleProducts(blockResults) {
  const stale = new Set()
  for (const block of blockResults) {
    for (const failure of block.failures ?? []) {
      const match = failure.match(/:(\w+) stale sync/i)
      if (match) {
        stale.add(match[1])
      }
    }
  }
  return stale.size ? [...stale].join(',') : 'none'
}

function collectStopReasons(blockResults) {
  const reasons = new Set()
  for (const block of blockResults) {
    for (const reason of block.stopReasons ?? []) {
      reasons.add(reason)
    }
  }
  return [...reasons]
}

export function buildDashboard(proofPayload) {
  const symbolRows = []
  const stopMatrix = {
    divergenceAbove0_5Pct: false,
    stalePropagation: false,
    secretLeakage: false,
  }

  for (const [symbol, result] of Object.entries(proofPayload.symbols ?? {})) {
    const blockResults = result.blockResults ?? []
    const maxDivergenceBps = blockResults.reduce(
      (max, block) => Math.max(max, block.divergenceBps ?? 0),
      0,
    )
    const reasons = collectStopReasons(blockResults)

    if (maxDivergenceBps > 50 || reasons.includes('DIVERGENCE_ABOVE_0_5_PCT')) {
      stopMatrix.divergenceAbove0_5Pct = true
    }
    if (reasons.includes('STALE_PROPAGATION')) {
      stopMatrix.stalePropagation = true
    }
    if (reasons.includes('SECRET_LEAKAGE')) {
      stopMatrix.secretLeakage = true
    }

    symbolRows.push({
      symbol,
      blockWindow: toBlockWindow(blockResults),
      maxDivergenceBps,
      staleProducts: extractStaleProducts(blockResults),
      stopReasons: reasons.length ? reasons.join(',') : 'none',
      status: result.ok ? 'PASS' : 'FAIL',
    })
  }

  symbolRows.sort((a, b) => a.symbol.localeCompare(b.symbol))

  return {
    generatedAt: proofPayload.generatedAt,
    symbolRows,
    stopMatrix,
  }
}

export function renderDashboardMarkdown(dashboard) {
  const p0Rows = [
    ['divergence > 0.5%', dashboard.stopMatrix.divergenceAbove0_5Pct ? 'TRIGGERED' : 'clear'],
    ['stale propagation', dashboard.stopMatrix.stalePropagation ? 'TRIGGERED' : 'clear'],
    ['secret leakage', dashboard.stopMatrix.secretLeakage ? 'TRIGGERED' : 'clear'],
  ]

  const symbolHeader = '| Symbol | Block Window | Max Divergence (bps) | Stale Products | Stop Reasons | Status |'
  const symbolDivider = '|---|---|---:|---|---|---|'
  const symbolLines = dashboard.symbolRows.map((row) =>
    `| ${row.symbol} | ${row.blockWindow} | ${row.maxDivergenceBps} | ${row.staleProducts} | ${row.stopReasons} | ${row.status} |`,
  )

  const p0Header = '| P0 Rule | State |'
  const p0Divider = '|---|---|'
  const p0Lines = p0Rows.map(([rule, state]) => `| ${rule} | ${state} |`)

  return [
    '# Rebalance Drift Dashboard (Iter36)',
    '',
    `Generated: ${dashboard.generatedAt}`,
    '',
    '## Symbol Drift Table',
    '',
    symbolHeader,
    symbolDivider,
    ...symbolLines,
    '',
    '## P0 Stop Rule Matrix',
    '',
    p0Header,
    p0Divider,
    ...p0Lines,
    '',
  ].join('\n')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const proofPath = process.argv[2]
  const markdownPath = process.argv[3]
  const summaryPath = process.argv[4]

  if (!proofPath || !markdownPath || !summaryPath) {
    console.error('Usage: node scripts/security/generate_rebalance_drift_dashboard.mjs <proof.json> <dashboard.md> <summary.json>')
    process.exit(1)
  }

  const proof = JSON.parse(fs.readFileSync(proofPath, 'utf8'))
  const dashboard = buildDashboard(proof)
  const markdown = renderDashboardMarkdown(dashboard)

  fs.writeFileSync(markdownPath, markdown)
  fs.writeFileSync(summaryPath, `${JSON.stringify(dashboard, null, 2)}\n`)
  console.log(`wrote ${markdownPath}`)
  console.log(`wrote ${summaryPath}`)
}
