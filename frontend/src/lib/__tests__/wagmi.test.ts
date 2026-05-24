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
  }, 15_000)

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

  it('valid WC branch avoids MetaMask SDK connector ids that pull problematic async-storage dependency', async () => {
    const validId = '0123456789abcdef0123456789abcdef'
    const mod = await loadWagmiWithEnv(validId)
    const ids = connectorIds(mod)
    expect(ids).not.toContain('metaMask')
    expect(ids).not.toContain('metaMaskSDK')
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

// ---------------------------------------------------------------------------
// Transport — JSON-RPC batching window (task 0052)
//
// viem's `http(url, { batch: true })` shorthand defaults `batch.wait` to
// 0 ms, which flushes on the next microtask. Concurrent wagmi reads
// scheduled on adjacent microtasks (different `useEffect`s in one React
// commit, React Query refetch waves) therefore each emit their own
// /api/rpc POST. Bumping `batch.wait` to 10 ms coalesces them into one
// batched POST per refetch tick. See the task PRD for the network
// evidence.
// ---------------------------------------------------------------------------

describe('transports — JSON-RPC batching window (task 0052)', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    vi.resetModules()
    vi.doUnmock('viem')
  })

  // viem's HTTP transport captures `batch.wait` inside the request
  // closure (see node_modules/viem/_esm/clients/transports/http.js: the
  // value is destructured from `batch` per request and never exposed
  // on the runtime Transport object). The most reliable assertion is
  // therefore at the boundary where wagmi calls `http(url, opts)` —
  // we record the `opts.batch` literal each call site passes and
  // assert it matches `{ wait: 10 }` for the gooddollarL2 transport.
  async function batchOptsFor(envValue: string | undefined): Promise<unknown> {
    const httpCalls: Array<{ url: unknown; opts: unknown }> = []
    vi.doMock('viem', async () => {
      const actual = await vi.importActual<typeof import('viem')>('viem')
      return {
        ...actual,
        http: (url?: string, opts?: unknown) => {
          httpCalls.push({ url, opts })
          return actual.http(url, opts as Parameters<typeof actual.http>[1])
        },
      }
    })
    await loadWagmiWithEnv(envValue)
    const rpcCall = httpCalls.find((c) => c.url === '/api/rpc')
    expect(rpcCall, 'wagmi must call http() with the /api/rpc url').toBeDefined()
    return (rpcCall!.opts as { batch?: unknown } | undefined)?.batch
  }

  it('passes batch.wait = 10 to viem http() on the no-WC branch', async () => {
    const batch = await batchOptsFor(undefined)
    expect(batch).toEqual({ wait: 10 })
  })

  it('passes batch.wait = 10 to viem http() on the valid-WC branch', async () => {
    const batch = await batchOptsFor('0123456789abcdef0123456789abcdef')
    expect(batch).toEqual({ wait: 10 })
  })
})

// ---------------------------------------------------------------------------
// Reown console filter — installs on BOTH branches (iter 10)
//
// Surface-sweep review on 2026-05-17 showed @reown/appkit emits two
// log lines on every page load when the production origin
// (https://goodswap.goodclaw.org) is not on the Reown Cloud project
// allowlist:
//   console.error: "Origin <origin> not found on Allowlist - update
//                   configuration on cloud.reown.com"
//   console.warn:  "[Reown Config] Failed to fetch remote project
//                   configuration. Using local/default values."
//
// The previous filter (task 0058) was only installed in the
// !isValidWcProjectId branch — which is unreachable in production
// because production has a valid projectId. This block tests that
// the filter is now installed on BOTH branches AND covers both
// log channels, without swallowing unrelated developer messages
// (especially the [wagmi] NEXT_PUBLIC_WC_PROJECT_ID is missing or
// invalid console.error that is intentional help text).
// ---------------------------------------------------------------------------

const REOWN_WARN_MSG =
  '[Reown Config] Failed to fetch remote project configuration. Using local/default values.'
const REOWN_ALLOWLIST_ERR_MSG =
  'Origin https://goodswap.goodclaw.org not found on Allowlist - update configuration on cloud.reown.com'
const WAGMI_DEV_HELP_MSG =
  '[wagmi] NEXT_PUBLIC_WC_PROJECT_ID is missing or invalid.\n' +
  'Mobile wallet connections (Rainbow, MetaMask Mobile, Trust Wallet, etc.) will NOT work.\n' +
  'Register a project at https://cloud.walletconnect.com and add NEXT_PUBLIC_WC_PROJECT_ID to your .env.local'

interface ReownWindow extends Window {
  __reownConsoleFilterInstalled?: boolean
  __wagmiMissingProjectIdWarned?: boolean
}

describe('Reown console filter — installs on both branches', () => {
  let originalWarn: typeof console.warn
  let originalError: typeof console.error
  let warnSpy: ReturnType<typeof vi.fn>
  let errorSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Force a fresh wagmi.ts module evaluation so the filter
    // installation runs against our brand-new console spies.
    vi.resetModules()
    // The install-once flag lives on `window` and survives module
    // resets in jsdom — clear it so each test exercises a fresh
    // install of the filter.
    delete (window as ReownWindow).__reownConsoleFilterInstalled
    delete (window as ReownWindow).__wagmiMissingProjectIdWarned

    originalWarn = console.warn
    originalError = console.error
    warnSpy = vi.fn()
    errorSpy = vi.fn()
    console.warn = warnSpy as unknown as typeof console.warn
    console.error = errorSpy as unknown as typeof console.error
  })

  afterEach(() => {
    console.warn = originalWarn
    console.error = originalError
    vi.unstubAllEnvs()
    vi.resetModules()
    delete (window as ReownWindow).__reownConsoleFilterInstalled
    delete (window as ReownWindow).__wagmiMissingProjectIdWarned
  })

  it('valid projectId branch: suppresses the [Reown Config] warning', async () => {
    await loadWagmiWithEnv('0123456789abcdef0123456789abcdef')
    console.warn(REOWN_WARN_MSG)
    // No spy call should record the suppressed pattern.
    const warnCalls = warnSpy.mock.calls.map((c) => String(c[0]))
    expect(warnCalls.some((s) => s.includes('[Reown Config] Failed to fetch'))).toBe(false)
  })

  it('valid projectId branch: suppresses the Origin ... not found on Allowlist error', async () => {
    await loadWagmiWithEnv('0123456789abcdef0123456789abcdef')
    // Drain any boot-time errors emitted by the valid branch (none
    // expected from wagmi.ts itself, but any noise should not affect
    // the assertion below).
    errorSpy.mockClear()
    console.error(REOWN_ALLOWLIST_ERR_MSG)
    const errorCalls = errorSpy.mock.calls.map((c) => String(c[0]))
    expect(errorCalls.some((s) => s.includes('not found on Allowlist'))).toBe(false)
  })

  it('valid projectId branch: defensively suppresses the [Reown Config] message on console.error too', async () => {
    await loadWagmiWithEnv('0123456789abcdef0123456789abcdef')
    errorSpy.mockClear()
    console.error(REOWN_WARN_MSG)
    const errorCalls = errorSpy.mock.calls.map((c) => String(c[0]))
    expect(errorCalls.some((s) => s.includes('[Reown Config] Failed to fetch'))).toBe(false)
  })

  it('valid projectId branch: passes through an unrelated console.warn', async () => {
    await loadWagmiWithEnv('0123456789abcdef0123456789abcdef')
    warnSpy.mockClear()
    console.warn('hello world')
    expect(warnSpy).toHaveBeenCalledWith('hello world')
  })

  it('valid projectId branch: passes through an unrelated console.error', async () => {
    await loadWagmiWithEnv('0123456789abcdef0123456789abcdef')
    errorSpy.mockClear()
    console.error('oops something else')
    expect(errorSpy).toHaveBeenCalledWith('oops something else')
  })

  it('invalid projectId branch: still emits the [wagmi] developer-help error', async () => {
    await loadWagmiWithEnv(undefined)
    // The boot-time console.error from wagmi.ts itself is what we
    // are asserting still reaches the spy.
    const errorCalls = errorSpy.mock.calls.map((c) => String(c[0]))
    expect(errorCalls.some((s) => s.includes('NEXT_PUBLIC_WC_PROJECT_ID is missing or invalid'))).toBe(true)
  })

  it('invalid projectId branch: emits developer-help warning only once across re-imports', async () => {
    await loadWagmiWithEnv(undefined)
    const firstCount = errorSpy.mock.calls.filter((c) =>
      String(c[0]).includes('NEXT_PUBLIC_WC_PROJECT_ID is missing or invalid'),
    ).length
    expect(firstCount).toBe(1)

    // Keep the window flag and re-import; warning should not repeat.
    await loadWagmiWithEnv(undefined)
    const secondCount = errorSpy.mock.calls.filter((c) =>
      String(c[0]).includes('NEXT_PUBLIC_WC_PROJECT_ID is missing or invalid'),
    ).length
    expect(secondCount).toBe(1)
  })

  it('invalid projectId branch: developer-help message must NOT match the suppression regexes', async () => {
    await loadWagmiWithEnv(undefined)
    // Manually emit the dev-help message after the wrappers are
    // installed; it must reach the spy regardless of branch.
    errorSpy.mockClear()
    console.error(WAGMI_DEV_HELP_MSG)
    expect(errorSpy).toHaveBeenCalledWith(WAGMI_DEV_HELP_MSG)
  })

  it('invalid projectId branch: also suppresses Reown patterns (defensive)', async () => {
    await loadWagmiWithEnv(undefined)
    warnSpy.mockClear()
    errorSpy.mockClear()
    console.warn(REOWN_WARN_MSG)
    console.error(REOWN_ALLOWLIST_ERR_MSG)
    expect(warnSpy.mock.calls.some((c) => String(c[0]).includes('[Reown Config] Failed to fetch'))).toBe(false)
    expect(errorSpy.mock.calls.some((c) => String(c[0]).includes('not found on Allowlist'))).toBe(false)
  })

  it('RPC_BATCH_CONFIG coalesces over one ~60 fps animation frame (#0065)', async () => {
    // The default `batch: true` shorthand uses `wait: 0`, which only
    // catches calls inside the same microtask — intermediate
    // React/wagmi work fragments a 12-contract refresh into ~7
    // POSTs on /proof. We cap the coalescing window to 16ms (one
    // animation frame) so all calls from a single React commit
    // land in one batched POST. Larger values would risk a
    // perceptible delay on `Retry now`.
    const mod = await loadWagmiWithEnv('0123456789abcdef0123456789abcdef')
    expect(mod.RPC_BATCH_WAIT_MS).toBe(16)
    expect(mod.RPC_BATCH_SIZE).toBe(1_000)
    expect(mod.RPC_BATCH_CONFIG).toEqual({ batchSize: 1_000, wait: 16 })
  })

  it('idempotency: re-importing wagmi.ts does not double-wrap console methods', async () => {
    // First import installs the wrapper.
    await loadWagmiWithEnv('0123456789abcdef0123456789abcdef')
    const wrappedWarnAfterFirst = console.warn
    const wrappedErrorAfterFirst = console.error
    expect((window as ReownWindow).__reownConsoleFilterInstalled).toBe(true)

    // Second import: flag is already true, so the wrappers must
    // not be re-applied on top of themselves.
    await loadWagmiWithEnv('0123456789abcdef0123456789abcdef')
    expect(console.warn).toBe(wrappedWarnAfterFirst)
    expect(console.error).toBe(wrappedErrorAfterFirst)

    // And a passthrough call still reaches the underlying spy
    // exactly once per emission (not twice from double-wrap).
    warnSpy.mockClear()
    console.warn('passthrough')
    expect(warnSpy).toHaveBeenCalledTimes(1)
  })
})
