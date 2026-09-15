import Dexie, { type Table } from 'dexie'
import type { AssetStatus } from '../types/db.ts'

export interface SyncPhoto {
  id: string
  inspectionId: string
  blob: Blob
  contentType: string
  createdAt: string
}

export interface QueuedInspection {
  client_uuid: string
  asset_id: string
  status: AssetStatus
  notes?: string | null
  lat?: number | null
  lng?: number | null
  photo_urls: string[]
  sync_status: 'pending' | 'synced'
  attempts: number
  queued_at: string
}

class McasDatabase extends Dexie {
  inspections!: Table<QueuedInspection, string>
  photos!: Table<SyncPhoto, string>

  constructor() {
    super('mcas-db')
    this.version(1).stores({
      inspections: 'client_uuid, sync_status, queued_at',
      photos: 'id, inspectionId',
    })
  }
}

export const db = new McasDatabase()
