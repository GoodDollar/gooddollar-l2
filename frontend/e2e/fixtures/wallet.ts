/**
 * Mock EIP-1193 wallet provider for Playwright E2E tests.
 *
 * Injects `window.ethereum` with a pre-funded account before the page loads,
 * so RainbowKit's `injectedWallet` connector picks it up automatically.
 * All JSON-RPC requests are proxied to the Anvil devnet RPC.
 */

import { type Page } from '@playwright/test'

const TESTER_PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const TESTER_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
const CHAIN_ID = 42069
const RPC_URL = 'http://127.0.0.1:8545'

/**
 * Injects a mock `window.ethereum` into the page before any scripts run.
 * The mock forwards all JSON-RPC calls to the Anvil devnet, responds to
 * `eth_accounts` / `eth_requestAccounts` with the tester address, and
 * handles `eth_chainId` / `wallet_switchEthereumChain` locally.
 */
export async function injectMockWallet(page: Page) {
  await page.addInitScript(
    ({ address, chainId, rpcUrl }) => {
      const chainHex = `0x${chainId.toString(16)}`

      const listeners: Record<string, Array<(...args: unknown[]) => void>> = {}

      const mockEthereum = {
        isMetaMask: true,
        selectedAddress: address,
        chainId: chainHex,
        networkVersion: String(chainId),
        _isMock: true,

        on(event: string, fn: (...args: unknown[]) => void) {
          if (!listeners[event]) listeners[event] = []
          listeners[event].push(fn)
        },

        removeListener(event: string, fn: (...args: unknown[]) => void) {
          if (listeners[event]) {
            listeners[event] = listeners[event].filter((f) => f !== fn)
          }
        },

        removeAllListeners(event?: string) {
          if (event) delete listeners[event]
          else Object.keys(listeners).forEach((k) => delete listeners[k])
        },

        emit(event: string, ...args: unknown[]) {
          ;(listeners[event] || []).forEach((fn) => fn(...args))
        },

        async request({
          method,
          params,
        }: {
          method: string
          params?: unknown[]
        }): Promise<unknown> {
          switch (method) {
            case 'eth_accounts':
            case 'eth_requestAccounts':
              return [address]

            case 'eth_chainId':
              return chainHex

            case 'net_version':
              return String(chainId)

            case 'wallet_switchEthereumChain':
              return null

            case 'wallet_addEthereumChain':
              return null

            case 'personal_sign':
            case 'eth_sign':
            case 'eth_signTypedData':
            case 'eth_signTypedData_v4':
              return proxyToRpc(method, params)

            default:
              return proxyToRpc(method, params)
          }
        },
      }

      async function proxyToRpc(
        method: string,
        params?: unknown[],
      ): Promise<unknown> {
        const resp = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now(),
            method,
            params: params || [],
          }),
        })
        const data = await resp.json()
        if (data.error) throw new Error(data.error.message)
        return data.result
      }

      Object.defineProperty(window, 'ethereum', {
        value: mockEthereum,
        writable: false,
        configurable: true,
      })
    },
    { address: TESTER_ADDRESS, chainId: CHAIN_ID, rpcUrl: RPC_URL },
  )
}

export { TESTER_PRIVATE_KEY, TESTER_ADDRESS, CHAIN_ID, RPC_URL }
