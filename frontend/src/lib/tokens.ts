export type TokenCategory = 'DeFi' | 'Stablecoins' | 'Layer 2' | 'Infrastructure' | 'GoodDollar'

export interface Token {
  symbol: string
  name: string
  decimals: number
  popular?: boolean
  category: TokenCategory
  icon?: string
}

export const TOKEN_CATEGORIES: TokenCategory[] = ['DeFi', 'Stablecoins', 'Layer 2', 'Infrastructure', 'GoodDollar']

/**
 * Result of parsing a raw `?category=` URL parameter into a canonical
 * filter value for the /explore page.
 *
 * - `value`: the category to actually apply ('All' for "show everything")
 * - `mode`:
 *    - `'all'`     — input was '' or 'all'/'All'/'ALL' (the synthetic All)
 *    - `'exact'`   — input matched a canonical TOKEN_CATEGORIES entry
 *    - `'case-fixed'` — input matched a category case-insensitively (e.g.
 *                      `?category=defi` → `'DeFi'`). The router should
 *                      replace the URL with the canonical form.
 *    - `'unknown'` — input didn't match any category. The router should
 *                    surface a notice to the user and replace the URL.
 * - `raw`: the original input string (used for the unknown-value notice)
 */
export interface CategoryResolution {
  value: TokenCategory | 'All'
  mode: 'all' | 'exact' | 'case-fixed' | 'unknown'
  raw: string
}

/**
 * Pure helper. Resolves a raw `?category=` query-string value to a
 * canonical category for the /explore page, plus a mode flag the
 * routing layer uses to decide whether to canonicalise the URL or
 * show a "we ignored your typo" notice.
 *
 * Intentionally does NOT trim whitespace — whitespace-only values are
 * treated as 'unknown' so the routing layer keeps them visible to the
 * user instead of silently coercing them to 'All'.
 *
 * @param raw The raw `?category=` value (already URL-decoded by the
 *            caller, which is what `URLSearchParams.get()` returns).
 * @param categories The list of canonical TokenCategory strings.
 */
export function resolveCategory(
  raw: string,
  categories: readonly TokenCategory[],
): CategoryResolution {
  if (raw === '') {
    return { value: 'All', mode: 'all', raw }
  }
  // 'All' (any case) is the synthetic "show everything" sentinel.
  if (raw.toLowerCase() === 'all') {
    return { value: 'All', mode: 'all', raw }
  }
  // Exact match against canonical TOKEN_CATEGORIES.
  if ((categories as readonly string[]).includes(raw)) {
    return { value: raw as TokenCategory, mode: 'exact', raw }
  }
  // Case-insensitive match — the typo is salvageable, e.g. "defi" → "DeFi".
  const lowered = raw.toLowerCase()
  const caseFixed = categories.find(c => c.toLowerCase() === lowered)
  if (caseFixed) {
    return { value: caseFixed, mode: 'case-fixed', raw }
  }
  // Nothing matched. Fall back to 'All' and let the routing layer show
  // a notice + canonicalise the URL.
  return { value: 'All', mode: 'unknown', raw }
}

export const TOKENS: Token[] = [
  { symbol: 'G$', name: 'GoodDollar', decimals: 18, popular: true, category: 'GoodDollar' },
  { symbol: 'ETH', name: 'Ether', decimals: 18, popular: true, category: 'Infrastructure' },
  { symbol: 'USDC', name: 'USD Coin', decimals: 6, popular: true, category: 'Stablecoins' },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8, popular: true, category: 'Infrastructure' },
  { symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18, popular: true, category: 'Stablecoins' },
  { symbol: 'USDT', name: 'Tether USD', decimals: 6, popular: true, category: 'Stablecoins' },
  { symbol: 'LINK', name: 'Chainlink', decimals: 18, category: 'Infrastructure' },
  { symbol: 'UNI', name: 'Uniswap', decimals: 18, category: 'DeFi' },
  { symbol: 'AAVE', name: 'Aave', decimals: 18, category: 'DeFi' },
  { symbol: 'ARB', name: 'Arbitrum', decimals: 18, category: 'Layer 2' },
  { symbol: 'OP', name: 'Optimism', decimals: 18, category: 'Layer 2' },
  { symbol: 'MKR', name: 'Maker', decimals: 18, category: 'DeFi' },
  { symbol: 'COMP', name: 'Compound', decimals: 18, category: 'DeFi' },
  { symbol: 'SNX', name: 'Synthetix', decimals: 18, category: 'DeFi' },
  { symbol: 'CRV', name: 'Curve DAO', decimals: 18, category: 'DeFi' },
  { symbol: 'LDO', name: 'Lido DAO', decimals: 18, category: 'DeFi' },
  { symbol: 'MATIC', name: 'Polygon', decimals: 18, category: 'Layer 2' },
  { symbol: 'WETH', name: 'Wrapped Ether', decimals: 18, category: 'Infrastructure' },
]

export const POPULAR_TOKENS = TOKENS.filter(t => t.popular)

export const TOKEN_COLORS: Record<string, string> = {
  'G$': '#13C636',
  'ETH': '#627EEA',
  'USDC': '#2775CA',
  'WBTC': '#F7931A',
  'DAI': '#F5AC37',
  'USDT': '#26A17B',
  'LINK': '#2A5ADA',
  'UNI': '#FF007A',
  'AAVE': '#B6509E',
  'ARB': '#28A0F0',
  'OP': '#FF0420',
  'MKR': '#1AAB9B',
  'COMP': '#00D395',
  'SNX': '#170659',
  'CRV': '#FD2700',
  'LDO': '#00A3FF',
  'MATIC': '#8247E5',
  'WETH': '#627EEA',
}
