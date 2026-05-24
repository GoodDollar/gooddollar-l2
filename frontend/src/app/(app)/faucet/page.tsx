import FaucetClient from './FaucetClient'

export const dynamic = 'force-dynamic'

export default function FaucetPage(props: any) {
  return <FaucetClient {...props} />
}
