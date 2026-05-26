import { checkSuspension } from '@/lib/checkSuspension'
import StatsPage from './StatsClient'

export default async function Page() {
  await checkSuspension()
  return <StatsPage />
}
