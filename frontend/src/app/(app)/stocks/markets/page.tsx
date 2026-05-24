import StocksClient from '../StocksClient'

export const dynamic = 'force-dynamic'

export default function StocksMarketsPage(props: any) {
  return <StocksClient {...props} />
}
