import { checkSuspension } from '@/lib/checkSuspension'
import VolumePage from './VolumeClient'

export default async function Page() {
  await checkSuspension()
  return <VolumePage />
}
