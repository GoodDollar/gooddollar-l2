import StocksPortfolioClient from './StocksPortfolioClient'

export const dynamic = 'force-dynamic'

export default function StocksPortfolioPage(props: any) {
  return <StocksPortfolioClient {...props} />
}
