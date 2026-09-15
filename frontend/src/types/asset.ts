import type { Asset, Department, Inspection, MaintenanceRequest } from './db.ts'

export type AssetRow = Asset['Row']
export type DepartmentRow = Department['Row']
export type InspectionRow = Inspection['Row']
export type MaintenanceRow = MaintenanceRequest['Row']

export interface AssetListResponse {
  data: AssetRow[]
  total: number
  limit: number
  offset: number
}

export type AssetTimelineItem =
  | { kind: 'inspection'; at: string; item: InspectionRow }
  | { kind: 'maintenance'; at: string; item: MaintenanceRow }

export interface AssetFilters {
  status?: string
  department_id?: string
  type?: string
  q?: string
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-ZW', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

export function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString()
}

export const assetTypeLabel: Record<string, string> = {
  cpu: 'CPU',
  monitor: 'Monitor',
  keyboard: 'Keyboard',
  mouse: 'Mouse',
  laptop: 'Laptop',
  printer: 'Printer',
  router: 'Router',
  projector: 'Projector',
  server: 'Server',
  ups: 'UPS',
  other: 'Other',
}
