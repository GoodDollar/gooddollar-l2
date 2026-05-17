/**
 * Mock EIP-1193 wallet provider for Playwright E2E tests.
 *
 * Injects `window.ethereum` with a pre-funded account before the page loads,
 * so RainbowKit's `injectedWallet` connector picks it up automatically.
 * Also announces the provider via EIP-6963 so modern multi-wallet discovery
 * code can detect the same mock without depending on legacy globals alone.
 * All JSON-RPC requests are proxied to the Anvil devnet RPC.
 */

import { type Page } from '@playwright/test'

const TESTER_PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const TESTER_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
const CHAIN_ID = 42069
const RPC_URL = 'http://127.0.0.1:8545'
const BROWSER_RPC_URL = '/api/rpc'

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
        if (data.error) {
          console.error('[mock-wallet-rpc-error]', method, JSON.stringify(data.error))
          throw new Error(data.error.message || JSON.stringify(data.error))
        }
        return data.result
      }

      const providerInfo = Object.freeze({
        uuid: '350670db-19fa-4704-a166-e52e178b59d2',
        name: 'GoodDollar E2E Wallet',
        icon: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22%3E%3Crect width=%2264%22 height=%2264%22 rx=%2216%22 fill=%22%2316a34a%22/%3E%3Ctext x=%2232%22 y=%2240%22 text-anchor=%22middle%22 font-size=%2224%22 fill=%22white%22 font-family=%22Arial%22%3EG%24%3C/text%3E%3C/svg%3E',
        rdns: 'org.gooddollar.e2e',
      })
      const providerDetail = Object.freeze({
        info: providerInfo,
        provider: mockEthereum,
      })

      function announceProvider() {
        window.dispatchEvent(
          new CustomEvent('eip6963:announceProvider', {
            detail: providerDetail,
          }),
        )
      }

      Object.defineProperty(mockEthereum, 'providers', {
        value: [mockEthereum],
        writable: false,
        configurable: false,
      })

      Object.defineProperty(window, 'ethereum', {
        value: mockEthereum,
        writable: false,
        configurable: true,
      })

      window.addEventListener('eip6963:requestProvider', announceProvider)
      announceProvider()
    },
    { address: TESTER_ADDRESS, chainId: CHAIN_ID, rpcUrl: BROWSER_RPC_URL },
  )
}

export { TESTER_PRIVATE_KEY, TESTER_ADDRESS, CHAIN_ID, RPC_URL }
