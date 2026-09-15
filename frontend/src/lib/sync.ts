import { liveQuery } from 'dexie'
import type { AssetStatus } from '../types/db.ts'
import { apiPost } from './api.ts'
import { db } from './db.ts'
import { uploadPhotoBlob } from './uploads.ts'

export const SYNC_INTERVAL_MS = 30_000
export const SYNC_BATCH_SIZE = 50

export interface QueueInspectionInput {
  asset_id: string
  status: AssetStatus
  notes?: string
  lat?: number
  lng?: number
  photos: { blob: Blob; contentType: string }[]
}

export interface SyncResult {
  synced: number
  failed: number
}

interface SyncRequestItem {
  client_uuid: string
  asset_id: string
  status: AssetStatus
  notes?: string | null
  lat?: number | null
  lng?: number | null
  photo_urls: string[]
}

interface SyncResponse {
  data: {
    processed: number
    client_uuids: string[]
  }
}

export async function queueInspection(input: QueueInspectionInput): Promise<string> {
  const clientUuid = crypto.randomUUID()
  const queuedAt = new Date().toISOString()

  await db.transaction('rw', db.inspections, db.photos, async () => {
    await db.inspections.add({
      client_uuid: clientUuid,
      asset_id: input.asset_id,
      status: input.status,
      notes: input.notes ?? null,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      photo_urls: [],
      sync_status: 'pending',
      attempts: 0,
      queued_at: queuedAt,
    })

    for (const photo of input.photos) {
      await db.photos.add({
        id: crypto.randomUUID(),
        inspectionId: clientUuid,
        blob: photo.blob,
        contentType: photo.contentType,
        createdAt: queuedAt,
      })
    }
  })

  return clientUuid
}

export async function pendingCount(): Promise<number> {
  return db.inspections.where('sync_status').equals('pending').count()
}

export function subscribePendingCount(onCount: (count: number) => void) {
  const subscription = liveQuery(() => pendingCount()).subscribe({
    next: (count) => onCount(count),
    error: () => {
      /* indexdb unavailable; treat as zero */
    },
  })
  return () => subscription.unsubscribe()
}

export async function syncPending(): Promise<SyncResult> {
  const batch = await db.inspections
    .where('sync_status')
    .equals('pending')
    .limit(SYNC_BATCH_SIZE)
    .toArray()
  if (batch.length === 0) {
    return { synced: 0, failed: 0 }
  }

  const payloads: SyncRequestItem[] = []
  const photoIdsToDelete: string[] = []

  for (const inspection of batch) {
    const localPhotos = await db.photos
      .where('inspectionId')
      .equals(inspection.client_uuid)
      .toArray()
    const photoUrls: string[] = []

    for (const photo of localPhotos) {
      photoUrls.push(await uploadPhotoBlob(photo.blob, photo.contentType))
      photoIdsToDelete.push(photo.id)
    }

    payloads.push({
      client_uuid: inspection.client_uuid,
      asset_id: inspection.asset_id,
      status: inspection.status,
      notes: inspection.notes ?? null,
      lat: inspection.lat ?? null,
      lng: inspection.lng ?? null,
      photo_urls: photoUrls,
    })
  }

  const response = await apiPost<SyncResponse>('/api/inspections/sync', {
    inspections: payloads.slice(0, SYNC_BATCH_SIZE),
  })

  const syncedUuids = new Set(response.data.client_uuids)

  await db.transaction('rw', db.inspections, db.photos, async () => {
    for (const inspection of batch) {
      if (!syncedUuids.has(inspection.client_uuid)) continue
      await db.inspections.update(inspection.client_uuid, {
        sync_status: 'synced',
        photo_urls:
          payloads.find((p) => p.client_uuid === inspection.client_uuid)?.photo_urls ?? [],
      })
    }
    await db.photos.bulkDelete(photoIdsToDelete)
  })

  return { synced: syncedUuids.size, failed: Math.max(0, batch.length - syncedUuids.size) }
}

export async function trySyncOnce(): Promise<SyncResult> {
  if (!navigator.onLine) {
    return { synced: 0, failed: 0 }
  }
  try {
    return await syncPending()
  } catch {
    return { synced: 0, failed: 0 }
  }
}
