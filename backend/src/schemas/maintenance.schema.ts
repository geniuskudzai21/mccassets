import { z } from 'zod'

export const requestStatusSchema = z.enum([
  'pending',
  'approved',
  'in_progress',
  'completed',
  'rejected',
])

export const maintenanceQuerySchema = z.object({
  status: requestStatusSchema.optional(),
  assigned_to: z.string().uuid().optional(),
  asset_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export const maintenanceUpdateSchema = z
  .object({
    status: requestStatusSchema.optional(),
    assigned_to: z.string().uuid().nullable().optional(),
    description: z.string().min(1).max(2000).optional(),
    estimated_cost: z.number().min(0).nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update',
  })

export type RequestStatus = z.infer<typeof requestStatusSchema>
export type MaintenanceUpdate = z.infer<typeof maintenanceUpdateSchema>
export type MaintenanceQuery = z.infer<typeof maintenanceQuerySchema>
