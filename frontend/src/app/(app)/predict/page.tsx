import PredictClient from './PredictClient'

export const dynamic = 'force-dynamic'

export default function PredictPage(props: any) {
  return <PredictClient {...props} />
}
