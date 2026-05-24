import HomeClient from './HomeClient'

export const dynamic = 'force-dynamic'

export default function Home(props: any) {
  return <HomeClient {...props} />
}
