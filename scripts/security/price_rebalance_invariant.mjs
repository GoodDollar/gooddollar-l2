import fs from 'node:fs'

const DIVERGENCE_STOP_BPS = 50

const SECRET_PATTERNS = [
  /api[_-]?key\s*[:=]/i,
  /private[_-]?key\s*[:=]/i,
  /secret\s*[:=]/i,
  /bearer\s+[A-Za-z0-9._-]+/i,
]

function toBigInt(value) {
  return typeof value === 'bigint' ? value : BigInt(value)
}

export function computeDivergenceBps(a, b) {
  const left = toBigInt(a)
  const right = toBigInt(b)
  if (left === 0n) {
    return right === 0n ? 0 : Number.MAX_SAFE_INTEGER
  }
  const diff = left > right ? left - right : right - left
  return Number((diff * 10_000n) / left)
}

export function validateSymbolRebalance(snapshot) {
  const failures = []
  const stopReasons = new Set()

  const divergenceBps = computeDivergenceBps(
    snapshot.normalizedQuotePriceE8,
    snapshot.oraclePriceE8,
  )

  if (divergenceBps > DIVERGENCE_STOP_BPS) {
    failures.push(
      `${snapshot.symbol}: quote/oracle divergence ${divergenceBps}bps > ${DIVERGENCE_STOP_BPS}bps`,
    )
    stopReasons.add('DIVERGENCE_ABOVE_0_5_PCT')
  }

  for (const [productName, state] of Object.entries(snapshot.products ?? {})) {
    if (state.lastSyncedBlock < snapshot.currentBlock) {
      failures.push(
        `${snapshot.symbol}:${productName} stale sync ${state.lastSyncedBlock} < ${snapshot.currentBlock}`,
      )
      stopReasons.add('STALE_PROPAGATION')
      if (snapshot.riskAction?.riskIncreasing) {
        failures.push(
          `${snapshot.symbol}:${productName} blocks risk-increasing action ${snapshot.riskAction.id}`,
        )
      }
    }

    if (state.oracleBlock !== snapshot.oracleBlock) {
      failures.push(
        `${snapshot.symbol}:${productName} oracleBlock ${state.oracleBlock} != canonical ${snapshot.oracleBlock}`,
      )
      stopReasons.add('STALE_PROPAGATION')
    }
  }

  const debugLines = snapshot.debugLogs ?? []
  if (debugLines.some((line) => SECRET_PATTERNS.some((pattern) => pattern.test(line)))) {
    failures.push(`${snapshot.symbol}: secret leakage marker found in debug logs`)
    stopReasons.add('SECRET_LEAKAGE')
  }

  return {
    symbol: snapshot.symbol,
    block: snapshot.currentBlock,
    divergenceBps,
    ok: failures.length === 0,
    failures,
    stopReasons: [...stopReasons],
  }
}

export function validateTwoConsecutiveBlocks(blockSnapshots) {
  if (!Array.isArray(blockSnapshots) || blockSnapshots.length !== 2) {
    throw new Error('validateTwoConsecutiveBlocks expects exactly two snapshots')
  }

  const [a, b] = blockSnapshots
  if (b.currentBlock !== a.currentBlock + 1) {
    throw new Error(`blocks must be consecutive: got ${a.currentBlock} and ${b.currentBlock}`)
  }

  const resultA = validateSymbolRebalance(a)
  const resultB = validateSymbolRebalance(b)

  return {
    ok: resultA.ok && resultB.ok,
    blockResults: [resultA, resultB],
    stopReasons: [...new Set([...resultA.stopReasons, ...resultB.stopReasons])],
  }
}

export function runInvariantProofFromFile(fixturePath) {
  const payload = JSON.parse(fs.readFileSync(fixturePath, 'utf8'))
  const proof = {
    generatedAt: new Date().toISOString(),
    fixture: fixturePath,
    symbols: {},
    overallOk: true,
    stopReasons: new Set(),
  }

  for (const [symbol, snapshots] of Object.entries(payload.symbols ?? {})) {
    const result = validateTwoConsecutiveBlocks(snapshots)
    proof.symbols[symbol] = result
    if (!result.ok) {
      proof.overallOk = false
    }
    for (const reason of result.stopReasons) {
      proof.stopReasons.add(reason)
    }
  }

  proof.stopReasons = [...proof.stopReasons]
  return proof
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const fixturePath = process.argv[2]
  const outputPath = process.argv[3]

  if (!fixturePath || !outputPath) {
    console.error('Usage: node scripts/security/price_rebalance_invariant.mjs <fixture.json> <output.json>')
    process.exit(1)
  }

  const proof = runInvariantProofFromFile(fixturePath)
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`)
  console.log(`wrote ${outputPath}`)
}
