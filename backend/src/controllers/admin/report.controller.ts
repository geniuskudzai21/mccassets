import type { Request, Response } from 'express'
import { z } from 'zod'
import { getSupabase } from '../../config/supabase.js'
import { HttpError } from '../../middleware/errorHandler.js'
import { depreciateAsset } from '../../services/depreciation.js'
import type { Asset } from '../../types/db.js'

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
    .in('id', departmentIds.length > 0 ? departmentIds : ['00000000-0000-0000-0000-000000000000'])

  if (deptError) {
    throw new HttpError(500, 'Failed to load departments')
  }

  const asOf = new Date()
  const departmentsById = new Map<string, { id: string; name: string }>(
    ((departmentsRaw ?? []) as { id: string; name: string }[]).map((d) => [d.id, d]),
  )

  const rows = assetRows
    .map((asset) => {
      const depreciation = depreciateAsset(asset, asOf)
      return {
        id: asset.id,
        asset_tag: asset.asset_tag,
        department: asset.department_id
          ? (departmentsById.get(asset.department_id)?.name ?? null)
          : null,
        purchase_date: asset.purchase_date,
        useful_life_years: depreciation.usefulLifeYears,
        end_of_life: depreciation.endOfLife,
        purchase_cost: Math.round(depreciation.cost * 100) / 100,
        annual_depreciation:
          depreciation.usefulLifeYears > 0
            ? Math.round((depreciation.cost / depreciation.usefulLifeYears) * 100) / 100
            : Math.round(depreciation.cost * 100) / 100,
        current_value: Math.round(depreciation.currentValue * 100) / 100,
        replacement_due: depreciation.replacementDue,
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
      const depreciation = depreciateAsset(asset, asOf)
      return {
        id: asset.id,
        asset_tag: asset.asset_tag,
        brand: asset.brand,
        model: asset.model,
        status: asset.current_status,
        purchase_date: asset.purchase_date,
        useful_life_years: depreciation.usefulLifeYears,
        end_of_life: depreciation.endOfLife,
        days_to_end: depreciation.daysToEnd,
        purchase_cost: Math.round(depreciation.cost * 100) / 100,
        current_value: Math.round(depreciation.currentValue * 100) / 100,
        replacement_estimate: asset.replacement_estimate,
      }
    })
    .filter((row) => row.days_to_end <= horizonDays)
    .sort((a, b) => a.days_to_end - b.days_to_end)

  res.json({ data: { as_of: asOf.toISOString().slice(0, 10), count: rows.length, rows } })
}

export async function getAuditTrail(req: Request, res: Response) {
  const supabase = getSupabase()

  const query = z
    .object({
      limit: z.coerce.number().int().min(1).max(500).default(200),
    })
    .parse(req.query)

  const { data: logs, error } = await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(query.limit)

  if (error) {
    throw new HttpError(500, 'Failed to load audit trail')
  }

  const rows = logs ?? []
  const userIds = [...new Set(rows.map((row) => row.user_id).filter(Boolean) as string[])]

  const { data: profilesRaw, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000'])

  if (profilesError) {
    throw new HttpError(500, 'Failed to load audit users')
  }

  const profilesById = new Map((profilesRaw ?? []).map((profile) => [profile.id, profile.full_name]))

  res.json({
    data: rows.map((row) => ({
      ...row,
      user_name: row.user_id ? (profilesById.get(row.user_id) ?? null) : null,
    })),
  })
}