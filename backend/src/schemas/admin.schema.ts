import { z } from 'zod'

export const userRoleSchema = z.enum(['technician', 'supervisor', 'admin'])

export const inviteUserSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8).max(72),
    full_name: z.string().min(1).max(200),
    role: userRoleSchema.default('technician'),
    department_id: z.string().uuid().nullable().optional(),
    phone: z.string().max(40).nullable().optional(),
  })
  .strict()

export const updateUserSchema = z
  .object({
    full_name: z.string().min(1).max(200).optional(),
    role: userRoleSchema.optional(),
    department_id: z.string().uuid().nullable().optional(),
    phone: z.string().max(40).nullable().optional(),
    is_active: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update',
  })

export const createDisposalSchema = z
  .object({
    asset_id: z.string().uuid(),
    reason: z.string().min(1).max(1000),
    disposal_date: z.string().date().optional(),
  })
  .strict()

export const updateDisposalSchema = z
  .object({
    reason: z.string().min(1).max(1000).optional(),
    disposal_date: z.string().date().optional(),
    action: z.enum(['approve', 'revoke']).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update',
  })

export type InviteUserInput = z.infer<typeof inviteUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type CreateDisposalInput = z.infer<typeof createDisposalSchema>
export type UpdateDisposalInput = z.infer<typeof updateDisposalSchema>
