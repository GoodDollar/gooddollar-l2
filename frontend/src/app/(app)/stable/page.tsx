import StableClient from './StableClient'

export const dynamic = 'force-dynamic'

export default function StablePage(props: any) {
  return <StableClient {...props} />
}
