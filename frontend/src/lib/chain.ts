import { defineChain } from 'viem'
import { DEVNET_CHAIN_ID, DEVNET_RPC_URL, DEVNET_EXPLORER_URL, CONTRACTS } from './devnet'

export const gooddollarL2 = defineChain({
  id: DEVNET_CHAIN_ID,
  name: 'GoodDollar L2',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: [DEVNET_RPC_URL],
    },
  },
  blockExplorers: {
    default: { name: 'Blockscout', url: DEVNET_EXPLORER_URL },
  },
  // Canonical Multicall3 (https://github.com/mds1/multicall). Installed on
  // our Anvil devnet via `script/deploy-multicall3-devnet.sh` (uses
  // `anvil_setCode` to land the runtime bytecode at the canonical address).
  // Without this entry wagmi's `useReadContracts` silently falls back to
  // N parallel `eth_call`s — see task 0059.
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
    },
  },
  testnet: true,
})

// Re-export CONTRACTS from devnet.ts so existing imports of `{ CONTRACTS } from './chain'` continue to work.
export { CONTRACTS }
