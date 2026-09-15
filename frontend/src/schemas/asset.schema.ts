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

export const assetTypes: { value: string; label: string }[] = [
  { value: 'cpu', label: 'CPU' },
  { value: 'monitor', label: 'Monitor' },
  { value: 'keyboard', label: 'Keyboard' },
  { value: 'mouse', label: 'Mouse' },
  { value: 'laptop', label: 'Laptop' },
  { value: 'printer', label: 'Printer' },
  { value: 'router', label: 'Router' },
  { value: 'projector', label: 'Projector' },
  { value: 'server', label: 'Server' },
  { value: 'ups', label: 'UPS' },
  { value: 'other', label: 'Other' },
]

export const assetStatuses: { value: string; label: string }[] = [
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
  { value: 'disposal', label: 'Disposal' },
]

const costNumber = z
  .string()
  .refine((value) => value.trim() !== '' && !Number.isNaN(Number(value)), 'Enter a number')
  .refine((value) => Number(value) >= 0, 'Cost cannot be negative')

const wholeYears = z.union([z.literal(''), z.string().regex(/^\d+$/, 'Enter a whole number')])

export const assetFormSchema = z.object({
  asset_tag: z.string().trim().min(1, 'Asset tag is required').max(50),
  type: assetTypeSchema,
  brand: z.string().max(100).nullable().optional(),
  model: z.string().max(100).nullable().optional(),
  serial_number: z.string().max(100).nullable().optional(),
  department_id: z
    .union([z.literal(''), z.string().uuid('Select a department')])
    .nullable()
    .optional(),
  purchase_date: z.string().min(1, 'Purchase date is required'),
  purchase_cost: costNumber,
  useful_life_years: wholeYears.nullable().optional(),
  building: z.string().max(100).nullable().optional(),
  room: z.string().max(100).nullable().optional(),
  warranty_expiry: z.string().nullable().optional(),
})

export type AssetFormValues = z.infer<typeof assetFormSchema>

function emptyToNull(value: string | null | undefined): string | null {
  return value == null || value.trim() === '' ? null : value.trim()
}

export function toAssetPayload(values: AssetFormValues) {
  return {
    asset_tag: values.asset_tag.trim(),
    type: values.type,
    brand: emptyToNull(values.brand),
    model: emptyToNull(values.model),
    serial_number: emptyToNull(values.serial_number),
    department_id: emptyToNull(values.department_id),
    purchase_date: new Date(`${values.purchase_date}T00:00:00`).toISOString(),
    purchase_cost: Number(values.purchase_cost),
    useful_life_years:
      values.useful_life_years && values.useful_life_years !== ''
        ? Number(values.useful_life_years)
        : undefined,
    building: emptyToNull(values.building),
    room: emptyToNull(values.room),
    warranty_expiry:
      values.warranty_expiry && values.warranty_expiry !== ''
        ? new Date(`${values.warranty_expiry}T00:00:00`).toISOString()
        : null,
  }
}
