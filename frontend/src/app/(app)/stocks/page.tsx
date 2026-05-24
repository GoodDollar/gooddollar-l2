import StocksClient from './StocksClient'

export const dynamic = 'force-dynamic'

export default function StocksPage(props: any) {
  return <StocksClient {...props} />
}
