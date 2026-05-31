#!/usr/bin/env node

// Calculate addresses for all tester accounts
import { createHash } from 'node:crypto'
import { privateKeyToAccount } from 'viem/accounts'

function derivePrivateKey(paperclipAgentId) {
  const seed = createHash('sha256')
    .update(`gooddollar-paperclip-${paperclipAgentId}`)
    .digest('hex')
  return `0x${seed}`
}

const TESTERS = [
  {
    id: 'alpha',
    paperclipAgentId: '089cacf1-77ca-4229-b58b-0ab2eb2abe3f',
    name: 'Tester Alpha — Swap & Lending',
    focus: 'swap-lending',
  },
  {
    id: 'beta',
    paperclipAgentId: 'ffa98f54-9cc3-4ea9-b015-e800fb7b7465',
    name: 'Tester Beta — Perps & Predictions',
    focus: 'perps-predictions',
  },
  {
    id: 'gamma',
    paperclipAgentId: '90b1b646-453a-4249-90a7-5a944e4419d8',
    name: 'Tester Gamma — Stocks & Stress',
    focus: 'stocks-stress',
  },
  {
    id: 'delta',
    paperclipAgentId: '3ecb6b00-2c97-4d69-95f4-f89d3ec0363f',
    name: 'Tester Delta — E2E & UX Validator',
    focus: 'e2e-ux',
  },
  {
    id: 'epsilon',
    paperclipAgentId: 'f6eba1c8-58a9-47b5-9592-6957c4d396fa',
    name: 'Quality Champion / Tester Epsilon — Revenue & UBI',
    focus: 'revenue-ubi',
  },
]

console.log('Tester Account Addresses:')
console.log('========================')

for (const tester of TESTERS) {
  const privateKey = derivePrivateKey(tester.paperclipAgentId)
  const account = privateKeyToAccount(privateKey)

  console.log(`${tester.id}: ${account.address} (${tester.focus})`)
  if (tester.id === 'beta') {
    console.log(`  ^^ PRIMARY TARGET - failing actionPredictionLifecycle and actionPerpOpenClose`)
  }
}

console.log('\nFaucet URL: https://goodswap.goodclaw.org/api/faucet')