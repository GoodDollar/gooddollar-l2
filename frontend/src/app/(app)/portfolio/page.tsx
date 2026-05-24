import PortfolioClient from './PortfolioClient'

export const dynamic = 'force-dynamic'

export default function PortfolioPage(props: any) {
  return <PortfolioClient {...props} />
}
