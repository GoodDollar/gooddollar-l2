/**
 * Minimal Ethereum JSON-RPC response types used by the bare-fetch RPC
 * helper in `lib/rpc.ts`.
 *
 * Background — task 0089: the Live Activity page (and any other page
 * that wants raw RPC without pulling in the full wagmi/viem stack) was
 * calling `rpcCall(...)` without explicit generic arguments. With
 * `rpcCall<T = unknown>`, the awaited values were typed as `unknown`,
 * which after a falsy narrow became `{}`, and TypeScript correctly
 * refused to compile `block.number` / `receipt.gasUsed` / etc.
 *
 * This module defines only the fields the application actually reads
 * — not a full Ethereum JSON-RPC type universe. If a new RPC method
 * is consumed elsewhere, extend this file rather than reinventing the
 * `unknown`-trap inline.
 *
 * All numeric fields stay as their wire form (`0x`-prefixed hex
 * strings). Conversion to `number` / `bigint` is the caller's
 * responsibility via `hexToNumber` / `BigInt` — keeping the types
 * faithful to the JSON-RPC wire format avoids hidden coercions.
 */

/** A 0x-prefixed hex string as returned on the JSON-RPC wire. */
export type EthHex = string

/**
 * A 20-byte Ethereum address, lower- or mixed-case hex string with `0x`
 * prefix. Kept as `EthHex` for now — promote to a branded type if/when
 * callers need stronger guarantees.
 */
export type EthAddress = EthHex

/** A 32-byte transaction hash. */
export type EthHash = EthHex

/**
 * A full transaction object as returned inside
 * `eth_getBlockByNumber(..., true)`. Only the fields the Live Activity
 * page reads are typed. `to` is `null` for contract-creation txs.
 */
export interface EthTransactionFull {
  hash: EthHash
  from: EthAddress
  to: EthAddress | null
  value: EthHex
}

/**
 * A block as returned by `eth_getBlockByNumber(..., true)`. Only the
 * fields the Live Activity page reads are typed.
 */
export interface EthBlock {
  number: EthHex
  timestamp: EthHex
  transactions: EthTransactionFull[]
}

/**
 * A transaction receipt as returned by `eth_getTransactionReceipt`.
 * Only the fields the Live Activity page reads are typed. `status` is
 * `'0x0'` (failed) or `'0x1'` (success) post-Byzantium.
 */
export interface EthReceipt {
  status: EthHex
  gasUsed: EthHex
}
