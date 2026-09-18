import { z } from 'zod'

export const assetTypeSchema = z.enum([
  'cpu',
  'monitor',
  'keyboard',
  'mouse',
  'laptop',
  'printer',
  'router',
  'projector',
  'server',
  'ups',
  'other',
])

export const assetStatusSchema = z.enum(['good', 'fair', 'poor', 'disposal'])

export const isoDateSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'Invalid date, expected ISO 8601',
})

export const createAssetSchema = z.object({
  asset_tag: z.string().trim().min(1).max(50),
  type: assetTypeSchema,
  parent_asset_id: z.string().uuid().nullable().optional(),
  brand: z.string().trim().max(100).nullable().optional(),
  model: z.string().trim().max(100).nullable().optional(),
  serial_number: z.string().trim().max(100).nullable().optional(),
  department_id: z.string().uuid().nullable().optional(),
  assigned_user: z.string().trim().max(100).nullable().optional(),
  purchase_date: isoDateSchema,
  purchase_cost: z.number().nonnegative().max(100000000).nullable().optional(),
  useful_life_years: z.number().int().positive().max(100).optional(),
  building: z.string().trim().max(100).nullable().optional(),
  room: z.string().trim().max(100).nullable().optional(),
  warranty_expiry: isoDateSchema.nullable().optional(),
  inspection_interval_months: z.number().int().min(1).max(120).optional(),
  replacement_estimate: z.number().nonnegative().max(100000000).nullable().optional(),
})

export const updateAssetSchema = createAssetSchema.partial()

export const createTransferSchema = z.object({
  to_department_id: z.string().uuid(),
  notes: z.string().trim().max(500).nullable().optional(),
})

export const assetQuerySchema = z.object({
  status: assetStatusSchema.optional(),
  department_id: z.string().uuid().optional(),
  type: assetTypeSchema.optional(),
  q: z.string().trim().max(100).optional(),
  location: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export type CreateAssetInput = z.infer<typeof createAssetSchema>
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>
export type CreateTransferInput = z.infer<typeof createTransferSchema>
export type AssetQuery = z.infer<typeof assetQuerySchema>
