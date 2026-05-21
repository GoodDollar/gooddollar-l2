import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('walletCapabilities', () => {
  it('disables WalletConnect when env is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_WC_PROJECT_ID', '')
    const mod = await import('../walletCapabilities')
    expect(mod.isWalletConnectEnabled).toBe(false)
  })

  it('enables WalletConnect when env has a valid 32-char hex id', async () => {
    vi.stubEnv('NEXT_PUBLIC_WC_PROJECT_ID', '0123456789abcdef0123456789abcdef')
    const mod = await import('../walletCapabilities')
    expect(mod.isWalletConnectEnabled).toBe(true)
  })
})
