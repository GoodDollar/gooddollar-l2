import AnalyticsClient from './AnalyticsClient'

export const dynamic = 'force-dynamic'

export default function AnalyticsPage(props: any) {
  return <AnalyticsClient {...props} />
}
