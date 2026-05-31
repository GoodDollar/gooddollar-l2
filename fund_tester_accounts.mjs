#!/usr/bin/env node

import {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
  parseEther,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { createHash } from 'node:crypto'

// Anvil default accounts (first account has tons of ETH)
const ANVIL_ACCOUNTS = [
  'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', // Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
  '59c6995e998f97a5a0044966f0945389dc9e86dae88c6a2ee15e6a4c8a0b9b9e', // Account #1
  // ... more default accounts available
]

const goodDollarL2 = defineChain({
  id: 42069,
  name: 'GoodDollar L2',
  network: 'gooddollar-l2',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['http://localhost:8545'] } },
})

function derivePrivateKey(paperclipAgentId) {
  const seed = createHash('sha256')
    .update(`gooddollar-paperclip-${paperclipAgentId}`)
    .digest('hex')
  return `0x${seed}`
}

const TESTERS = [
  { id: 'beta', paperclipAgentId: 'ffa98f54-9cc3-4ea9-b015-e800fb7b7465', focus: 'perps-predictions' },
  { id: 'alpha', paperclipAgentId: '089cacf1-77ca-4229-b58b-0ab2eb2abe3f', focus: 'swap-lending' },
  { id: 'gamma', paperclipAgentId: '90b1b646-453a-4249-90a7-5a944e4419d8', focus: 'stocks-stress' },
  { id: 'delta', paperclipAgentId: '3ecb6b00-2c97-4d69-95f4-f89d3ec0363f', focus: 'e2e-ux' },
  { id: 'epsilon', paperclipAgentId: 'f6eba1c8-58a9-47b5-9592-6957c4d396fa', focus: 'revenue-ubi' },
]

async function main() {
  console.log('Funding tester accounts with ETH from Anvil default account...')

  // Use first Anvil default account as funder
  const funderAccount = privateKeyToAccount(`0x${ANVIL_ACCOUNTS[0]}`)
  console.log('Funder account:', funderAccount.address)

  const publicClient = createPublicClient({
    chain: goodDollarL2,
    transport: http(),
  })

  const walletClient = createWalletClient({
    account: funderAccount,
    chain: goodDollarL2,
    transport: http(),
  })

  // Check funder balance
  const funderBalance = await publicClient.getBalance({ address: funderAccount.address })
  console.log('Funder balance:', funderBalance.toString(), 'wei (' + (funderBalance / BigInt(1e18)) + ' ETH)')

  for (const tester of TESTERS) {
    try {
      const testerPrivateKey = derivePrivateKey(tester.paperclipAgentId)
      const testerAccount = privateKeyToAccount(testerPrivateKey)

      console.log(`\nFunding ${tester.id} (${tester.focus}): ${testerAccount.address}`)

      // Check current balance
      const currentBalance = await publicClient.getBalance({ address: testerAccount.address })
      console.log(`Current balance: ${currentBalance.toString()} wei (${Number(currentBalance) / 1e18} ETH)`)

      // Send 10 ETH to tester account
      const fundAmount = parseEther('10')
      const hash = await walletClient.sendTransaction({
        to: testerAccount.address,
        value: fundAmount,
      })

      console.log(`Sent 10 ETH to ${tester.id}, tx hash: ${hash}`)

      // Wait for transaction and check new balance
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`)

      const newBalance = await publicClient.getBalance({ address: testerAccount.address })
      console.log(`New balance: ${newBalance.toString()} wei (${Number(newBalance) / 1e18} ETH)`)

    } catch (error) {
      console.error(`Error funding ${tester.id}:`, error.message)
    }
  }

  console.log('\\nFunding complete!')
}

main().catch(console.error)