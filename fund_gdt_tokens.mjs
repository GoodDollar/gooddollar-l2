#!/usr/bin/env node

import {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
  parseEther,
  formatEther,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Anvil default account (has deployment authority)
const ANVIL_DEPLOYER_KEY = 'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

const goodDollarL2 = defineChain({
  id: 42069,
  name: 'GoodDollar L2',
  network: 'gooddollar-l2',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['http://localhost:8545'] } },
})

// ERC20 + Minting functions ABI
const GoodDollarTokenAbi = [
  {
    type: 'function',
    name: 'mint',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ type: 'uint8' }],
    stateMutability: 'view',
  },
]

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
  // Load contract addresses
  const addressesPath = resolve(process.cwd(), 'op-stack/addresses.json')
  const addresses = JSON.parse(readFileSync(addressesPath, 'utf8'))
  const gdtAddress = addresses.contracts.GoodDollarToken

  console.log('Funding tester accounts with G$ tokens...')
  console.log('GoodDollarToken address:', gdtAddress)

  // Use Anvil deployer account (should have minting authority)
  const deployerAccount = privateKeyToAccount(`0x${ANVIL_DEPLOYER_KEY}`)
  console.log('Deployer account:', deployerAccount.address)

  const publicClient = createPublicClient({
    chain: goodDollarL2,
    transport: http(),
  })

  const walletClient = createWalletClient({
    account: deployerAccount,
    chain: goodDollarL2,
    transport: http(),
  })

  // Check token info
  try {
    const name = await publicClient.readContract({
      address: gdtAddress,
      abi: GoodDollarTokenAbi,
      functionName: 'name',
    })

    const symbol = await publicClient.readContract({
      address: gdtAddress,
      abi: GoodDollarTokenAbi,
      functionName: 'symbol',
    })

    const totalSupply = await publicClient.readContract({
      address: gdtAddress,
      abi: GoodDollarTokenAbi,
      functionName: 'totalSupply',
    })

    console.log(`Token: ${name} (${symbol})`)
    console.log(`Total supply: ${formatEther(totalSupply)} ${symbol}`)

    // Check deployer's current G$ balance
    const deployerBalance = await publicClient.readContract({
      address: gdtAddress,
      abi: GoodDollarTokenAbi,
      functionName: 'balanceOf',
      args: [deployerAccount.address],
    })

    console.log(`Deployer G$ balance: ${formatEther(deployerBalance)} ${symbol}`)

  } catch (error) {
    console.error('Error reading token info:', error.message)
  }

  for (const tester of TESTERS) {
    try {
      const testerPrivateKey = derivePrivateKey(tester.paperclipAgentId)
      const testerAccount = privateKeyToAccount(testerPrivateKey)

      console.log(`\nFunding ${tester.id} (${tester.focus}): ${testerAccount.address}`)

      // Check current G$ balance
      const currentBalance = await publicClient.readContract({
        address: gdtAddress,
        abi: GoodDollarTokenAbi,
        functionName: 'balanceOf',
        args: [testerAccount.address],
      })

      console.log(`Current G$ balance: ${formatEther(currentBalance)} G$`)

      // Try to mint 1000 G$ to tester account
      const mintAmount = parseEther('1000')

      try {
        console.log(`Attempting to mint 1000 G$ to ${tester.id}...`)

        const hash = await walletClient.writeContract({
          address: gdtAddress,
          abi: GoodDollarTokenAbi,
          functionName: 'mint',
          args: [testerAccount.address, mintAmount],
        })

        console.log(`Mint transaction hash: ${hash}`)

        const receipt = await publicClient.waitForTransactionReceipt({ hash })
        console.log(`Mint confirmed in block ${receipt.blockNumber}`)

        // Check new balance
        const newBalance = await publicClient.readContract({
          address: gdtAddress,
          abi: GoodDollarTokenAbi,
          functionName: 'balanceOf',
          args: [testerAccount.address],
        })

        console.log(`New G$ balance: ${formatEther(newBalance)} G$`)

      } catch (mintError) {
        console.log(`Mint failed (${mintError.message}), trying transfer instead...`)

        // If minting fails, try transferring from deployer account
        try {
          const hash = await walletClient.writeContract({
            address: gdtAddress,
            abi: GoodDollarTokenAbi,
            functionName: 'transfer',
            args: [testerAccount.address, mintAmount],
          })

          console.log(`Transfer transaction hash: ${hash}`)

          const receipt = await publicClient.waitForTransactionReceipt({ hash })
          console.log(`Transfer confirmed in block ${receipt.blockNumber}`)

          const newBalance = await publicClient.readContract({
            address: gdtAddress,
            abi: GoodDollarTokenAbi,
            functionName: 'balanceOf',
            args: [testerAccount.address],
          })

          console.log(`New G$ balance: ${formatEther(newBalance)} G$`)

        } catch (transferError) {
          console.error(`Both mint and transfer failed for ${tester.id}:`, transferError.message)
        }
      }

    } catch (error) {
      console.error(`Error funding ${tester.id} with G$:`, error.message)
    }
  }

  console.log('\nG$ funding complete!')
}

main().catch(console.error)