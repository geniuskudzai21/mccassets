import { getSupabase } from '../config/supabase.js'
import { depreciateAsset } from './depreciation.js'
import type { Asset } from '../types/db.js'

const MS_PER_DAY = 24 * 60 * 60 * 1000
const AVG_MONTH_MS = 30.44 * MS_PER_DAY

export interface DueInspectionItem {
  id: string
  asset_tag: string
  type: string
  status: string
  last_inspection_date: string | null
  next_due_at: string
  days_overdue: number
}

export interface WarrantyExpiringItem {
  id: string
  asset_tag: string
  type: string
  warranty_expiry: string
  days_to_expiry: number
}

export interface ReplacementDueItem {
  id: string
  asset_tag: string
  type: string
  status: string
  end_of_life: string
  days_to_end: number
  current_value: number
  replacement_estimate: number | null
}

export interface ScheduleData {
  as_of: string
  due_inspections: DueInspectionItem[]
  warranty_expiring: WarrantyExpiringItem[]
  replacement_due: ReplacementDueItem[]
}

/**
 * Pure computation of the inspection/warranty/replacement schedule for a set of
 * assets. Used both by GET /api/schedules/due and by the background notifier.
 */
export function computeScheduleData(
  assets: Asset['Row'][],
  lastInspectionByAsset: Map<string, string>,
  asOf = new Date(),
  horizonDays = 365,
): ScheduleData {
  const dueInspections: DueInspectionItem[] = []
  const warrantyExpiring: WarrantyExpiringItem[] = []

  for (const asset of assets) {
    if (asset.current_status === 'disposal') continue

    const last = lastInspectionByAsset.get(asset.id) ?? null
    const cycleMonths = asset.inspection_interval_months > 0 ? asset.inspection_interval_months : 12
    const baseline = last ?? asset.created_at
    const nextDue = new Date(new Date(baseline).getTime() + cycleMonths * AVG_MONTH_MS)

    if (nextDue.getTime() <= asOf.getTime()) {
      dueInspections.push({
        id: asset.id,
        asset_tag: asset.asset_tag,
        type: asset.type,
        status: asset.current_status,
        last_inspection_date: last,
        next_due_at: nextDue.toISOString(),
        days_overdue: Math.floor((asOf.getTime() - nextDue.getTime()) / MS_PER_DAY),
      })
    }

    if (asset.warranty_expiry) {
      const expiry = new Date(asset.warranty_expiry)
      const daysToExpiry = Math.ceil((expiry.getTime() - asOf.getTime()) / MS_PER_DAY)
      if (daysToExpiry <= 90 && daysToExpiry >= -30) {
        warrantyExpiring.push({
          id: asset.id,
          asset_tag: asset.asset_tag,
          type: asset.type,
          warranty_expiry: asset.warranty_expiry,
          days_to_expiry: daysToExpiry,
        })
      }
    }
  }

  dueInspections.sort((a, b) => b.days_overdue - a.days_overdue)
  warrantyExpiring.sort((a, b) => a.days_to_expiry - b.days_to_expiry)

  const replacementDue = assets
    .filter((asset) => asset.current_status !== 'disposal')
    .map((asset) => {
      const depreciation = depreciateAsset(asset, asOf)
      return {
        id: asset.id,
        asset_tag: asset.asset_tag,
        type: asset.type,
        status: asset.current_status,
        end_of_life: depreciation.endOfLife,
        days_to_end: depreciation.daysToEnd,
        current_value: Math.round(depreciation.currentValue * 100) / 100,
        replacement_estimate: asset.replacement_estimate,
      }
    })
    .filter((row) => row.days_to_end <= horizonDays)
    .sort((a, b) => a.days_to_end - b.days_to_end)

  return {
    as_of: asOf.toISOString(),
    due_inspections: dueInspections,
    warranty_expiring: warrantyExpiring,
    replacement_due: replacementDue,
  }
}

/**
 * Loads the live schedule and turns it into in-app notifications for the staff
 * who act on it (active supervisors + technicians). Deduplicated on
 * (user, type, asset) while a notification remains unread, so repeated runs do
 * not spam the bell.
 */
export async function runScheduleChecks(): Promise<void> {
  const supabase = getSupabase()
  const asOf = new Date()

  const [{ data: assets, error: assetsError }, { data: inspections, error: inspectionsError }] =
    await Promise.all([
      supabase.from('assets').select('*'),
      supabase.from('inspections').select('asset_id, inspected_at'),
    ])

  if (assetsError || inspectionsError) {
    return
  }

  const lastInspection = new Map<string, string>()
  for (const row of inspections ?? []) {
    const current = lastInspection.get(row.asset_id)
    if (!current || row.inspected_at > current) {
      lastInspection.set(row.asset_id, row.inspected_at)
    }
  }

  const schedule = computeScheduleData((assets ?? []) as Asset['Row'][], lastInspection, asOf)
  const leads = schedule.due_inspections
  const warranties = schedule.warranty_expiring

  if (leads.length === 0 && warranties.length === 0) {
    return
  }

  const { data: staff, error: staffError } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_active', true)
    .in('role', ['supervisor', 'technician'])

  if (staffError || !staff || staff.length === 0) {
    return
  }

  const endpoints: { type: string; title: string; body: string; assetId: string }[] = []
  for (const item of leads) {
    endpoints.push({
      type: 'inspection_due',
      title: 'Inspection due',
      body: `${item.asset_tag} is ${item.days_overdue > 0 ? `${item.days_overdue} day(s) overdue` : 'due now'} for its scheduled inspection.`,
      assetId: item.id,
    })
  }
  for (const item of warranties) {
    endpoints.push({
      type: 'warranty_expiring',
      title: 'Warranty expiring',
      body: `${item.asset_tag} warranty expires in ${item.days_to_expiry} day(s).`,
      assetId: item.id,
    })
  }

  const { data: existing, error: existingError } = await supabase
    .from('notifications')
    .select('user_id, type, asset_id')
    .in('type', ['inspection_due', 'warranty_expiring'])
    .is('read_at', null)

  if (existingError) {
    return
  }

  const seen = new Set<string>()
  for (const row of existing ?? []) {
    if (!row.asset_id) continue
    seen.add(`${row.user_id}|${row.type}|${row.asset_id}`)
  }

  const inserts: { user_id: string; type: string; title: string; body: string; asset_id: string }[] = []
  for (const user of staff) {
    for (const endpoint of endpoints) {
      const key = `${user.id}|${endpoint.type}|${endpoint.assetId}`
      if (seen.has(key)) continue
      seen.add(key)
      inserts.push({
        user_id: user.id,
        type: endpoint.type,
        title: endpoint.title,
        body: endpoint.body,
        asset_id: endpoint.assetId,
      })
    }
  }

  if (inserts.length > 0) {
    const { error: insertError } = await supabase.from('notifications').insert(inserts)
    if (insertError) {
      // eslint-disable-next-line no-console
      console.error('[scheduler] failed to write schedule alerts:', insertError.message)
    }
  }
}