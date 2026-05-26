import { checkSuspension } from '@/lib/checkSuspension'
import BacktestPage from './BacktestClient'

export default async function Page() {
  await checkSuspension()
  return <BacktestPage />
}
