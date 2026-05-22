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
  // Do not advertise Multicall3 here unless the devnet actually has code at
  // the canonical address. After the latest reset, 0xcA11… returns empty code;
  // wagmi/viem then routes `useReadContracts` through a dead multicall and all
  // reads resolve as `0x`. Omitting the entry lets wagmi fall back to direct
  // eth_call reads, which keeps E2E/devnet pages functional.
  testnet: true,
})

// Re-export CONTRACTS from devnet.ts so existing imports of `{ CONTRACTS } from './chain'` continue to work.
export { CONTRACTS }
