import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { validateWcProjectId } from '../wagmi-helpers'

describe('validateWcProjectId', () => {
  it('returns empty string for undefined', () => {
    expect(validateWcProjectId(undefined)).toBe('')
  })

  it('returns empty string for null', () => {
    expect(validateWcProjectId(null)).toBe('')
  })

  it('returns empty string for empty string', () => {
    expect(validateWcProjectId('')).toBe('')
  })

  it('returns empty string for known placeholder "goodswap-dev"', () => {
    expect(validateWcProjectId('goodswap-dev')).toBe('')
  })

  it('returns empty string for too-short strings', () => {
    expect(validateWcProjectId('abc123')).toBe('')
  })

  it('returns empty string for 31-char hex (off by one)', () => {
    expect(validateWcProjectId('0123456789abcdef0123456789abcde')).toBe('')
  })

  it('returns empty string for 33-char hex (off by one)', () => {
    expect(validateWcProjectId('0123456789abcdef0123456789abcdef0')).toBe('')
  })

  it('returns empty string for 32 chars with non-hex characters', () => {
    expect(validateWcProjectId('0123456789abcdef0123456789abcdez')).toBe('')
  })

  it('returns empty string for 32 chars containing dashes (UUID shape)', () => {
    // 32 visible chars but includes dashes → not pure hex
    expect(validateWcProjectId('01234567-89ab-cdef-0123-456789abcd')).toBe('')
  })

  it('returns the input unchanged for a valid 32-char lowercase hex ID', () => {
    const id = '0123456789abcdef0123456789abcdef'
    expect(validateWcProjectId(id)).toBe(id)
  })

  it('returns the input unchanged for a valid 32-char uppercase hex ID', () => {
    const id = '0123456789ABCDEF0123456789ABCDEF'
    expect(validateWcProjectId(id)).toBe(id)
  })

  it('returns the input unchanged for a valid 32-char mixed-case hex ID', () => {
    const id = '0123456789AbCdEf0123456789aBcDeF'
    expect(validateWcProjectId(id)).toBe(id)
  })
})

// ---------------------------------------------------------------------------
// Config builder branch coverage (task 0095)
//
// The wagmi config must conditionally include the WalletConnect connector
// based on whether NEXT_PUBLIC_WC_PROJECT_ID is a valid 32-char hex string.
//
// - Invalid / placeholder ID → connector list MUST NOT include any
//   walletConnect-family connector. This prevents Reown's
//   @reown/appkit-core from initializing and firing requests to
//   api.web3modal.org and pulse.walletconnect.org on every page load.
// - Valid 32-char hex ID → the WalletConnect connector IS present so
//   mobile QR-code wallet flows continue to work.
//
// We assert on connector identity via wagmi's runtime `config.connectors`
// array, which is the public surface RainbowKit reads from.
// ---------------------------------------------------------------------------

type ImportedWagmi = typeof import('../wagmi')

async function loadWagmiWithEnv(value: string | undefined): Promise<ImportedWagmi> {
  vi.resetModules()
  if (value === undefined) {
    vi.stubEnv('NEXT_PUBLIC_WC_PROJECT_ID', '')
  } else {
    vi.stubEnv('NEXT_PUBLIC_WC_PROJECT_ID', value)
  }
  return import('../wagmi')
}

function connectorIds(mod: ImportedWagmi): string[] {
  // wagmi's Config exposes a readonly `connectors` array of CreateConnectorFn
  // results; each has a stable `id` (e.g. 'walletConnect', 'injected',
  // 'metaMask', 'coinbaseWalletSDK', 'safe').
  // RainbowKit wraps wagmi connectors but preserves the underlying id.
  // We coerce to a string[] for assertion convenience.
  return mod.config.connectors.map((c) => c.id).filter((id): id is string => typeof id === 'string')
}

describe('config builder — branches on NEXT_PUBLIC_WC_PROJECT_ID', () => {
  beforeEach(() => {
    // Silence the boot-time console.error / console.warn the wagmi module
    // emits when no valid project ID is configured; we test that flow on
    // purpose and don't want noisy CI output.
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it('omits the walletConnect connector when env var is unset', async () => {
    const mod = await loadWagmiWithEnv(undefined)
    const ids = connectorIds(mod)
    expect(ids).not.toContain('walletConnect')
    // Sanity: we should still have *some* connectors so users with browser
    // extensions can connect.
    expect(ids.length).toBeGreaterThan(0)
  })

  it('omits the walletConnect connector for the legacy "gooddollar-placeholder" sentinel', async () => {
    const mod = await loadWagmiWithEnv('gooddollar-placeholder')
    const ids = connectorIds(mod)
    expect(ids).not.toContain('walletConnect')
  })

  it('omits the walletConnect connector for the legacy "goodswap-dev" sentinel', async () => {
    const mod = await loadWagmiWithEnv('goodswap-dev')
    const ids = connectorIds(mod)
    expect(ids).not.toContain('walletConnect')
  })

  it('omits the walletConnect connector for a too-short id', async () => {
    const mod = await loadWagmiWithEnv('abc123')
    const ids = connectorIds(mod)
    expect(ids).not.toContain('walletConnect')
  })

  it('includes a usable extension-only connector set when WC is disabled', async () => {
    const mod = await loadWagmiWithEnv(undefined)
    const ids = connectorIds(mod)
    // We require at least one connector that picks up window.ethereum so
    // MetaMask / Brave / Rabby etc. still work. RainbowKit's injected /
    // metaMask wallets surface with ids 'injected' or 'metaMask' or
    // 'metaMaskSDK' depending on environment; in the no-WC branch we
    // assert that some browser-injected style connector is present.
    const hasBrowserConnector = ids.some((id) =>
      ['injected', 'metaMask', 'metaMaskSDK', 'safe'].includes(id),
    )
    expect(hasBrowserConnector).toBe(true)
  })

  it('includes the walletConnect connector when a valid 32-char hex id is set', async () => {
    const validId = '0123456789abcdef0123456789abcdef'
    const mod = await loadWagmiWithEnv(validId)
    const ids = connectorIds(mod)
    expect(ids).toContain('walletConnect')
  })

  it('exposes config.chains containing the gooddollarL2 chain in both branches', async () => {
    const invalid = await loadWagmiWithEnv(undefined)
    expect(invalid.config.chains.length).toBeGreaterThanOrEqual(1)
    expect(invalid.config.chains[0]?.id).toBe(42069)

    const valid = await loadWagmiWithEnv('0123456789abcdef0123456789abcdef')
    expect(valid.config.chains.length).toBeGreaterThanOrEqual(1)
    expect(valid.config.chains[0]?.id).toBe(42069)
  })
})
