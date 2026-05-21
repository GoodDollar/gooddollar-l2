import test from 'node:test'
import assert from 'node:assert/strict'

import {
  computeDivergenceBps,
  validateSymbolRebalance,
  validateTwoConsecutiveBlocks,
} from '../price_rebalance_invariant.mjs'

test('computeDivergenceBps returns 0 for identical values', () => {
  assert.equal(computeDivergenceBps(100_000_000n, 100_000_000n), 0)
})

test('validateSymbolRebalance passes for same-block aligned symbol', () => {
  const result = validateSymbolRebalance({
    symbol: 'AAPL',
    currentBlock: 120,
    normalizedQuotePriceE8: 21827000000n,
    oraclePriceE8: 21830000000n,
    oracleBlock: 120,
    riskAction: { id: 'open-perp', riskIncreasing: true },
    products: {
      amm: { lastSyncedBlock: 120, oracleBlock: 120 },
      perps: { lastSyncedBlock: 120, oracleBlock: 120 },
      prediction: { lastSyncedBlock: 120, oracleBlock: 120 },
      lend: { lastSyncedBlock: 120, oracleBlock: 120 },
      yield: { lastSyncedBlock: 120, oracleBlock: 120 },
    },
    debugLogs: ['info: sync complete'],
  })

  assert.equal(result.ok, true)
  assert.deepEqual(result.stopReasons, [])
})

test('validateSymbolRebalance blocks risk-increasing action when stale sync exists', () => {
  const result = validateSymbolRebalance({
    symbol: 'AAPL',
    currentBlock: 121,
    normalizedQuotePriceE8: 21827000000n,
    oraclePriceE8: 21827000000n,
    oracleBlock: 121,
    riskAction: { id: 'open-amm', riskIncreasing: true },
    products: {
      amm: { lastSyncedBlock: 120, oracleBlock: 120 },
      perps: { lastSyncedBlock: 121, oracleBlock: 121 },
      prediction: { lastSyncedBlock: 121, oracleBlock: 121 },
      lend: { lastSyncedBlock: 121, oracleBlock: 121 },
      yield: { lastSyncedBlock: 121, oracleBlock: 121 },
    },
    debugLogs: ['warn: stale amm sync'],
  })

  assert.equal(result.ok, false)
  assert.match(result.stopReasons.join(','), /STALE_PROPAGATION/)
  assert.match(result.failures.join(','), /amm/) 
})

test('validateSymbolRebalance raises divergence stop rule above 0.5%', () => {
  const result = validateSymbolRebalance({
    symbol: 'TSLA',
    currentBlock: 500,
    normalizedQuotePriceE8: 100_00000000n,
    oraclePriceE8: 101_00000000n,
    oracleBlock: 500,
    riskAction: { id: 'open-lend', riskIncreasing: true },
    products: {
      amm: { lastSyncedBlock: 500, oracleBlock: 500 },
      perps: { lastSyncedBlock: 500, oracleBlock: 500 },
      prediction: { lastSyncedBlock: 500, oracleBlock: 500 },
      lend: { lastSyncedBlock: 500, oracleBlock: 500 },
      yield: { lastSyncedBlock: 500, oracleBlock: 500 },
    },
    debugLogs: ['info'],
  })

  assert.equal(result.ok, false)
  assert.match(result.stopReasons.join(','), /DIVERGENCE_ABOVE_0_5_PCT/)
})

test('validateSymbolRebalance flags secret leakage markers', () => {
  const result = validateSymbolRebalance({
    symbol: 'NVDA',
    currentBlock: 9,
    normalizedQuotePriceE8: 9000000000n,
    oraclePriceE8: 9000000000n,
    oracleBlock: 9,
    riskAction: { id: 'close-only', riskIncreasing: false },
    products: {
      amm: { lastSyncedBlock: 9, oracleBlock: 9 },
      perps: { lastSyncedBlock: 9, oracleBlock: 9 },
      prediction: { lastSyncedBlock: 9, oracleBlock: 9 },
      lend: { lastSyncedBlock: 9, oracleBlock: 9 },
      yield: { lastSyncedBlock: 9, oracleBlock: 9 },
    },
    debugLogs: ['API_KEY=topsecret'],
  })

  assert.equal(result.ok, false)
  assert.match(result.stopReasons.join(','), /SECRET_LEAKAGE/)
})

test('validateTwoConsecutiveBlocks enforces N then N+1 sequencing', () => {
  const blockN = {
    symbol: 'AAPL',
    currentBlock: 700,
    normalizedQuotePriceE8: 20000000000n,
    oraclePriceE8: 20010000000n,
    oracleBlock: 700,
    riskAction: { id: 'open-perp', riskIncreasing: true },
    products: {
      amm: { lastSyncedBlock: 700, oracleBlock: 700 },
      perps: { lastSyncedBlock: 700, oracleBlock: 700 },
      prediction: { lastSyncedBlock: 700, oracleBlock: 700 },
      lend: { lastSyncedBlock: 700, oracleBlock: 700 },
      yield: { lastSyncedBlock: 700, oracleBlock: 700 },
    },
    debugLogs: [],
  }

  const blockN1 = {
    ...blockN,
    currentBlock: 701,
    oracleBlock: 701,
    products: {
      amm: { lastSyncedBlock: 701, oracleBlock: 701 },
      perps: { lastSyncedBlock: 701, oracleBlock: 701 },
      prediction: { lastSyncedBlock: 701, oracleBlock: 701 },
      lend: { lastSyncedBlock: 701, oracleBlock: 701 },
      yield: { lastSyncedBlock: 701, oracleBlock: 701 },
    },
  }

  const sequence = validateTwoConsecutiveBlocks([blockN, blockN1])
  assert.equal(sequence.ok, true)
  assert.equal(sequence.blockResults.length, 2)
})
