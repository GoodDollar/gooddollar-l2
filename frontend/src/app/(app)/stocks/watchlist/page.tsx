import StocksWatchlistClient from './StocksWatchlistClient'

export const dynamic = 'force-dynamic'

export default function StocksWatchlistPage(props: any) {
  return <StocksWatchlistClient {...props} />
}
