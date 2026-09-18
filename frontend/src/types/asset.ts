import type {
  Asset,
  AssetStatus,
  AssetType,
  Centre,
  Department,
  Inspection,
  MaintenanceRequest,
  Notification,
  Transfer,
} from './db.ts'

export type AssetRow = Asset['Row']
export type DepartmentRow = Department['Row']
export type CentreRow = Centre['Row']
export type InspectionRow = Inspection['Row']
export type MaintenanceRow = MaintenanceRequest['Row']
export type NotificationRow = Notification['Row']

export interface AssetListResponse {
  data: AssetRow[]
  total: number
  limit: number
  offset: number
}

export interface AssetDetail extends AssetRow {
  department_name: string | null
  assigned_user_name: string | null
  age_years: number
  current_value: number
  annual_depreciation: number
  end_of_life: string
  days_to_end: number
  replacement_due: boolean
  functional: boolean
  functional_flags: string[]
}

export interface AdminOverview {
  as_of: string
  assets: {
    total: number
    total_value: number
    by_status: Record<AssetStatus, number>
    by_type: { type: AssetType; count: number }[]
    by_department: { name: string; count: number }[]
    by_centre: { name: string; count: number }[]
    functional: number
    faulty: number
    located: number
    unlocated: number
  }
  maintenance: {
    open: number
    pending: number
    in_progress: number
    completed_30d: number
    assigned_technicians: number
  }
  inspections: { total: number; last_7d: number; last_30d: number }
  alerts: {
    replacement_due: number
    warranty_expiring_90d: number
    unlocated_assets: number
  }
  people: {
    total: number
    technicians: number
    supervisors: number
    admins: number
  }
}

export interface AuditTrailRow {
  id: string
  user_id: string | null
  user_name: string | null
  action: string
  entity_type: string
  entity_id: string
  metadata: Record<string, unknown> | null
  lat: number | null
  lng: number | null
  created_at: string
}

export type TransferRow = Transfer['Row'] & {
  from_department_name: string | null
  to_department_name: string | null
}

export type AssetTimelineItem =
  | { kind: 'inspection'; at: string; item: InspectionRow }
  | { kind: 'maintenance'; at: string; item: MaintenanceRow }
  | { kind: 'transfer'; at: string; item: TransferRow }

export interface ScheduleItem {
  id: string
  asset_tag: string
  type: string
  status: string
}

export interface NotificationEntry extends NotificationRow {
  asset: { id: string; asset_tag: string } | null
}

export interface DueInspectionItem extends ScheduleItem {
  last_inspection_date: string | null
  next_due_at: string
  days_overdue: number
}

export interface WarrantyExpiringItem extends ScheduleItem {
  warranty_expiry: string
  days_to_expiry: number
}

export interface ScheduleReplacementItem {
  id: string
  asset_tag: string
  type: string
  status: string
  end_of_life: string
  days_to_end: number
  current_value: number
  replacement_estimate: number | null
}

export interface DueSchedulesResponse {
  data: {
    as_of: string
    due_inspections: DueInspectionItem[]
    warranty_expiring: WarrantyExpiringItem[]
    replacement_due: ScheduleReplacementItem[]
  }
}

export interface AssetFilters {
  status?: string
  department_id?: string
  type?: string
  q?: string
  location?: string
}

export function formatCurrency(value: number | null): string {
  if (value == null) return '—'
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
