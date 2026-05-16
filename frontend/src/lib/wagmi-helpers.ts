// Pure helpers extracted from wagmi.ts so they can be unit-tested
// without pulling in @rainbow-me/rainbowkit (whose getDefaultConfig
// throws synchronously on an empty projectId and is therefore not
// safe to load in vitest).

// WalletConnect Cloud project IDs are 32-char hex strings.
// See https://cloud.walletconnect.com — IDs are issued in the
// admin dashboard and are lowercase hex; we accept both cases
// defensively. Anything else (empty, placeholder like
// "goodswap-dev", short string, dashes) is treated as unset so
// that callers can decide to skip mobile-wallet flows or emit
// a clear boot-time error.
export const WC_PROJECT_ID_RE = /^[a-f0-9]{32}$/i

export function validateWcProjectId(raw: string | undefined | null): string {
  if (typeof raw !== 'string') return ''
  return WC_PROJECT_ID_RE.test(raw) ? raw : ''
}
