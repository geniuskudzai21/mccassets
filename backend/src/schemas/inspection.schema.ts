import { z } from 'zod'
import { assetStatusSchema } from './asset.schema.js'

export const createInspectionSchema = z.object({
  asset_id: z.string().uuid(),
  status: assetStatusSchema,
  notes: z.string().max(1000).optional(),
  photo_urls: z.array(z.string().url().max(500)).max(20).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  client_uuid: z.string().uuid().optional(),
})

export const inspectionQuerySchema = z.object({
  asset_id: z.string().uuid().optional(),
  technician_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export const syncInspectionItemSchema = z.object({
  client_uuid: z.string().uuid(),
  asset_id: z.string().uuid(),
  status: assetStatusSchema,
  notes: z.string().max(1000).nullable().optional(),
  photo_urls: z.array(z.string().url().max(500)).max(20).optional(),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
})

export const syncInspectionsSchema = z
  .object({
    inspections: z.array(syncInspectionItemSchema).min(1).max(50, 'Batch is capped at 50'),
  })
  .strict()

export type CreateInspectionInput = z.infer<typeof createInspectionSchema>
export type SyncInspectionItem = z.infer<typeof syncInspectionItemSchema>
export type InspectionQuery = z.infer<typeof inspectionQuerySchema>
