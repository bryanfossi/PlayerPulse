import { loadGrowthStats } from '@/lib/admin/growth-stats'
import { GrowthClient } from './GrowthClient'

export type GrowthData = Awaited<ReturnType<typeof loadGrowthStats>>

export default async function AdminGrowthPage() {
  const data = await loadGrowthStats()
  return <GrowthClient initialData={data} />
}
