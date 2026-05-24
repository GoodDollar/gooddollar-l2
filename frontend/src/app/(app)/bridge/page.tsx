import BridgeClient from './BridgeClient'

export const dynamic = 'force-dynamic'

export default function BridgePage(props: any) {
  return <BridgeClient {...props} />
}
