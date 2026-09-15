import type { Request, Response } from 'express'
import { getSupabase } from '../../config/supabase.js'
import { HttpError } from '../../middleware/errorHandler.js'
import type { Asset } from '../../types/db.js'

const DAYS_PER_YEAR = 365.25

function yearsBetween(from: string, date: Date): number {
  return (date.getTime() - new Date(from).getTime()) / (DAYS_PER_YEAR * 24 * 60 * 60 * 1000)
}

function depreciatedValue(cost: number, usefulLifeYears: number, fromDate: string, asOf: Date) {
  const age = Math.max(0, yearsBetween(fromDate, asOf))
  const annual = usefulLifeYears > 0 ? cost / usefulLifeYears : cost
  return Math.max(0, cost - annual * age)
}

export async function getReportSummary(_req: Request, res: Response) {
  const supabase = getSupabase()

  const [assetResult, departmentResult, maintenanceResult, inspectionResult] = await Promise.all([
    supabase.from('assets').select('purchase_cost, current_status, department_id'),
    supabase.from('departments').select('*'),
    supabase
      .from('maintenance_requests')
      .select('id')
      .in('status', ['pending', 'approved', 'in_progress']),
    supabase
      .from('inspections')
      .select('id')
      .gte('inspected_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  if (
    assetResult.error ||
    departmentResult.error ||
    maintenanceResult.error ||
    inspectionResult.error
  ) {
    throw new HttpError(500, 'Failed to compute report summary')
  }

  const assets = assetResult.data ?? []
  const departments = departmentResult.data ?? []

  const total = assets.length
  const totalValue = assets.reduce((sum, asset) => sum + Number(asset.purchase_cost ?? 0), 0)

  const byStatus: Record<string, number> = { good: 0, fair: 0, poor: 0, disposal: 0 }
  const byDepartment: Record<string, number> = {}
  const departmentsById = new Map(departments.map((d) => [d.id, d]))

  for (const asset of assets) {
    byStatus[asset.current_status] = (byStatus[asset.current_status] ?? 0) + 1
    if (asset.department_id) {
      const key = departmentsById.get(asset.department_id)?.name ?? asset.department_id
      byDepartment[key] = (byDepartment[key] ?? 0) + 1
    }
  }

  res.json({
    data: {
      total,
      total_value: totalValue,
      by_status: byStatus,
      by_department: Object.entries(byDepartment).map(([name, count]) => ({ name, count })),
      open_maintenance: maintenanceResult.data?.length ?? 0,
      inspections_last_30d: inspectionResult.data?.length ?? 0,
    },
  })
}

export async function getDepreciationReport(_req: Request, res: Response) {
  const supabase = getSupabase()

  const { data, error } = await supabase.from('assets').select('*')

  if (error) {
    throw new HttpError(500, 'Failed to load assets for depreciation')
  }

  const assetRows: Asset['Row'][] = (data ?? []) as Asset['Row'][]

  const departmentIds = [
    ...new Set(assetRows.map((a) => a.department_id).filter(Boolean) as string[]),
  ]
  const { data: departmentsRaw, error: deptError } = await supabase
    .from('departments')
    .select('id, name')
    .in('id', departmentIds)

  if (deptError) {
    throw new HttpError(500, 'Failed to load departments')
  }

  const asOf = new Date()
  const departmentsById = new Map<string, { id: string; name: string }>(
    ((departmentsRaw ?? []) as { id: string; name: string }[]).map((d) => [d.id, d]),
  )

  const rows = assetRows
    .map((asset) => {
      const cost = Number(asset.purchase_cost ?? 0)
      const usefulLifeYears = Number(asset.useful_life_years || 1)
      const current = depreciatedValue(cost, usefulLifeYears, asset.purchase_date, asOf)
      const endOfLife = new Date(asset.purchase_date)
      endOfLife.setUTCFullYear(endOfLife.getUTCFullYear() + Math.floor(usefulLifeYears))
      return {
        id: asset.id,
        asset_tag: asset.asset_tag,
        department: asset.department_id
          ? (departmentsById.get(asset.department_id)?.name ?? null)
          : null,
        purchase_date: asset.purchase_date,
        useful_life_years: usefulLifeYears,
        end_of_life: endOfLife.toISOString().slice(0, 10),
        purchase_cost: Math.round(cost * 100) / 100,
        annual_depreciation: Math.round((cost / usefulLifeYears) * 100) / 100,
        current_value: Math.round(current * 100) / 100,
        replacement_due: current <= 0,
      }
    })
    .sort((a, b) => a.asset_tag.localeCompare(b.asset_tag))

  const totalValue = rows.reduce((sum, row) => sum + row.current_value, 0)

  res.json({ data: { as_of: asOf.toISOString().slice(0, 10), total_value: totalValue, rows } })
}

export async function getReplacementDueReport(_req: Request, res: Response) {
  const supabase = getSupabase()

  const { data: assets, error } = await supabase.from('assets').select('*')

  if (error) {
    throw new HttpError(500, 'Failed to load assets')
  }

  const assetRows: Asset['Row'][] = (assets ?? []) as Asset['Row'][]

  const asOf = new Date()
  const horizonDays = 365

  const rows = assetRows
    .map((asset) => {
      const cost = Number(asset.purchase_cost ?? 0)
      const usefulLifeYears = Number(asset.useful_life_years || 1)
      const current = depreciatedValue(cost, usefulLifeYears, asset.purchase_date, asOf)
      const endOfLife = new Date(asset.purchase_date)
      endOfLife.setUTCFullYear(endOfLife.getUTCFullYear() + Math.floor(usefulLifeYears))
      const daysToEnd = Math.ceil((endOfLife.getTime() - asOf.getTime()) / (24 * 60 * 60 * 1000))
      return {
        id: asset.id,
        asset_tag: asset.asset_tag,
        brand: asset.brand,
        model: asset.model,
        status: asset.current_status,
        purchase_date: asset.purchase_date,
        useful_life_years: usefulLifeYears,
        end_of_life: endOfLife.toISOString().slice(0, 10),
        days_to_end: daysToEnd,
        purchase_cost: cost,
        current_value: Math.round(current * 100) / 100,
      }
    })
    .filter((row) => row.days_to_end <= horizonDays)
    .sort((a, b) => a.days_to_end - b.days_to_end)

  res.json({ data: { as_of: asOf.toISOString().slice(0, 10), count: rows.length, rows } })
}
