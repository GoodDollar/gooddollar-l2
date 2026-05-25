/**
 * Faucet recipient address guard.
 *
 * Shared between the API route (`src/app/api/faucet/route.ts`) and the page
 * component (`src/app/(app)/faucet/page.tsx`) so client and server cannot
 * drift in what they treat as a "claimable" address.
 *
 * The faucet sends three real on-chain transactions per claim (gas ETH,
 * G$ ERC-20, WETH ERC-20). Sending those to a burn / null address or to
 * one of our own contract addresses silently drains the faucet's float
 * and is unrecoverable, so we reject the following classes before any
 * chain call is made:
 *
 *   1. Anything that is not a syntactically valid 20-byte hex address
 *      (per `viem.isAddress`).
 *   2. The zero address `0x0000…0000`.
 *   3. The canonical `0x000…dEaD` burn address.
 *   4. The repeated `0xdEaD…dEaD` burn pattern.
 *   5. The repeated `0xdeadbeef…` burn pattern.
 *   6. All-`F` addresses (`0xFFFF…FFFF`) — not a true burn address but a
 *      common "should never validate" sentinel that also blows up viem's
 *      EIP-55 checksum validator.
 *   7. Any address whose **last 20 hex characters** are all `0` or all
 *      `f` (catches close variants like `0x…00000` and `0x…fffff`).
 *   8. Any address that is one of our own deployed contracts (token,
 *      router, vault, etc.) as listed in `CONTRACTS` from `./devnet`.
 *
 * All comparisons are case-insensitive.
 */

import { isAddress } from 'viem'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const DEAD_ADDRESS_SHORT = '0x000000000000000000000000000000000000dead'
const DEAD_ADDRESS_REPEAT = '0xdeaddeaddeaddeaddeaddeaddeaddeaddeaddead'
const DEAD_BEEF_REPEAT = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef'
const ALL_F_ADDRESS = '0xffffffffffffffffffffffffffffffffffffffff'

const STATIC_DENY_LIST = new Set<string>([
  ZERO_ADDRESS,
  DEAD_ADDRESS_SHORT,
  DEAD_ADDRESS_REPEAT,
  DEAD_BEEF_REPEAT,
  ALL_F_ADDRESS,
])

// Precompute lowercase contract addresses once at module load.
// Read addresses directly from JSON to avoid import issues.
function loadContractDenyList(): Set<string> {
  try {
    // Try multiple possible paths since process.cwd() varies by context
    const possiblePaths = [
      resolve(process.cwd(), 'op-stack', 'addresses.json'),
      resolve(process.cwd(), '..', 'op-stack', 'addresses.json'),
      resolve(process.cwd(), '../../op-stack', 'addresses.json'),
    ]

    let addressesData = null
    for (const addressesPath of possiblePaths) {
      try {
        addressesData = JSON.parse(readFileSync(addressesPath, 'utf8'))
        break
      } catch (e) {
        // Try next path
      }
    }

    if (!addressesData) {
      throw new Error('Could not find addresses.json in any expected location')
    }

    const contractAddresses = Object.values(addressesData.contracts) as string[]
    return new Set(contractAddresses.map((addr) => addr.toLowerCase()))
  } catch (error) {
    console.warn('[addressGuard] Failed to load contract addresses:', error)
    // Return empty set as fallback - will only check static deny list
    return new Set<string>()
  }
}

const CONTRACT_DENY_LIST = loadContractDenyList()

/**
 * Returns true if `addr` is a syntactically valid Ethereum address AND is
 * not in the burn / contract deny-list. Safe to call from both client and
 * server with arbitrary input.
 */
export function isClaimableFaucetAddress(addr: unknown): boolean {
  if (typeof addr !== 'string' || addr.length !== 42) return false
  if (!isAddress(addr, { strict: false })) return false

  const lower = addr.toLowerCase()

  if (STATIC_DENY_LIST.has(lower)) return false
  if (CONTRACT_DENY_LIST.has(lower)) return false

  // Catch close variants where only the last 20 hex characters are all-zero
  // or all-`f` (e.g. anything ending in `…00000000000000000000` or
  // `…ffffffffffffffffffff`). The first two hex chars (`0x`) are skipped.
  const tail = lower.slice(-20)
  if (/^0{20}$/.test(tail)) return false
  if (/^f{20}$/.test(tail)) return false

  return true
}

/**
 * Discriminates the reason an address was rejected so the UI can show a
 * specific inline message. Returns `'ok'` when the address is claimable.
 */
export type FaucetAddressStatus = 'ok' | 'invalid' | 'unsupported'

export function getFaucetAddressStatus(addr: string): FaucetAddressStatus {
  if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) return 'invalid'
  if (!isClaimableFaucetAddress(addr)) return 'unsupported'
  return 'ok'
}
