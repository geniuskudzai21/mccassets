import type { AssetStatus } from '../../types/db.ts'

export interface LocationInfo {
  id: string
  asset_tag: string
  type: string
  current_status: AssetStatus
  last_lat: number | null
  last_lng: number | null
}
