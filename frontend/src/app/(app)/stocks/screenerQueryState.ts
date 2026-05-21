type SortField = 'price' | 'change24h' | 'volume24h' | 'marketCap'
type SortDir = 'asc' | 'desc'
type CapFilter = 'all' | 'mega' | 'large' | 'mid'
type MomentumFilter = 'all' | 'gainers' | 'losers'
type LiquidityFilter = 'all' | 'active' | 'quiet'

export interface StocksScreenerState {
  query: string
  sortField: SortField
  sortDir: SortDir
  sectorFilter: string
  capFilter: CapFilter
  momentumFilter: MomentumFilter
  liquidityFilter: LiquidityFilter
}

export const DEFAULT_STOCKS_SCREENER_STATE: StocksScreenerState = {
  query: '',
  sortField: 'marketCap',
  sortDir: 'desc',
  sectorFilter: 'all',
  capFilter: 'all',
  momentumFilter: 'all',
  liquidityFilter: 'all',
}

function isSortField(value: string | null): value is SortField {
  return value === 'price' || value === 'change24h' || value === 'volume24h' || value === 'marketCap'
}

function isSortDir(value: string | null): value is SortDir {
  return value === 'asc' || value === 'desc'
}

function isCapFilter(value: string | null): value is CapFilter {
  return value === 'all' || value === 'mega' || value === 'large' || value === 'mid'
}

function isMomentumFilter(value: string | null): value is MomentumFilter {
  return value === 'all' || value === 'gainers' || value === 'losers'
}

function isLiquidityFilter(value: string | null): value is LiquidityFilter {
  return value === 'all' || value === 'active' || value === 'quiet'
}

export function parseStocksScreenerState(searchParams: URLSearchParams): StocksScreenerState {
  const search = searchParams.get('search')?.trim() ?? ''
  const sector = searchParams.get('sector')?.trim() ?? ''
  const sortFieldParam = searchParams.get('sortField')
  const sortDirParam = searchParams.get('sortDir')
  const capParam = searchParams.get('cap')
  const momentumParam = searchParams.get('momentum')
  const liquidityParam = searchParams.get('liquidity')

  return {
    query: search,
    sortField: isSortField(sortFieldParam) ? sortFieldParam : DEFAULT_STOCKS_SCREENER_STATE.sortField,
    sortDir: isSortDir(sortDirParam) ? sortDirParam : DEFAULT_STOCKS_SCREENER_STATE.sortDir,
    sectorFilter: sector && sector !== 'all' ? sector : DEFAULT_STOCKS_SCREENER_STATE.sectorFilter,
    capFilter: isCapFilter(capParam) ? capParam : DEFAULT_STOCKS_SCREENER_STATE.capFilter,
    momentumFilter: isMomentumFilter(momentumParam) ? momentumParam : DEFAULT_STOCKS_SCREENER_STATE.momentumFilter,
    liquidityFilter: isLiquidityFilter(liquidityParam) ? liquidityParam : DEFAULT_STOCKS_SCREENER_STATE.liquidityFilter,
  }
}

export function serializeStocksScreenerState(state: StocksScreenerState): URLSearchParams {
  const params = new URLSearchParams()
  const query = state.query.trim()

  if (query) params.set('search', query)
  if (state.sectorFilter !== DEFAULT_STOCKS_SCREENER_STATE.sectorFilter) params.set('sector', state.sectorFilter)
  if (state.capFilter !== DEFAULT_STOCKS_SCREENER_STATE.capFilter) params.set('cap', state.capFilter)
  if (state.momentumFilter !== DEFAULT_STOCKS_SCREENER_STATE.momentumFilter) params.set('momentum', state.momentumFilter)
  if (state.liquidityFilter !== DEFAULT_STOCKS_SCREENER_STATE.liquidityFilter) params.set('liquidity', state.liquidityFilter)
  if (state.sortField !== DEFAULT_STOCKS_SCREENER_STATE.sortField) params.set('sortField', state.sortField)
  if (state.sortDir !== DEFAULT_STOCKS_SCREENER_STATE.sortDir) params.set('sortDir', state.sortDir)

  return params
}
