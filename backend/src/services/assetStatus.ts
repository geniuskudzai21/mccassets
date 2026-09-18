import { getSupabase } from '../config/supabase.js'
import { HttpError } from '../middleware/errorHandler.js'
import { notify } from './notifications.js'
import type { AssetStatus } from '../types/db.js'

/**
 * Recomputes an asset's current_status after an inspection. The most recent
 * inspection result wins. Also writes an audit_log row (with GPS when the
 * inspection captured it) and auto-raises a maintenance request when the
 * inspected condition warrants it.
 */
export async function applyInspectionResult(params: {
  assetId: string
  inspectionId: string
  status: AssetStatus
  technicianId: string
  lat?: number | null
  lng?: number | null
}): Promise<void> {
  const { assetId, inspectionId, status, technicianId, lat, lng } = params
  const supabase = getSupabase()

  const { error: updateError } = await supabase
    .from('assets')
    .update({ current_status: status })
    .eq('id', assetId)

  if (updateError) {
    throw new HttpError(500, 'Failed to update asset status')
  }

  const { error: auditError } = await supabase.from('audit_log').insert({
    user_id: technicianId,
    action: 'inspection.create',
    entity_type: 'assets',
    entity_id: assetId,
    metadata: { inspection_id: inspectionId, status },
    lat: lat ?? null,
    lng: lng ?? null,
  })

  if (auditError) {
    throw new HttpError(500, 'Failed to write audit log')
  }

  if (status === 'poor' || status === 'disposal') {
    const { data: open, error: openError } = await supabase
      .from('maintenance_requests')
      .select('id')
      .eq('asset_id', assetId)
      .in('status', ['pending', 'approved', 'in_progress'])
      .limit(1)

    if (openError) {
      throw new HttpError(500, 'Failed to check open maintenance requests')
    }

    if (!open || open.length === 0) {
      const { data: request, error: maintenanceError } = await supabase
        .from('maintenance_requests')
        .insert({
          asset_id: assetId,
          raised_by: technicianId,
          status: 'pending',
          description: `Automatic maintenance request raised after a ${status} inspection.`,
        })
        .select('id, asset_id')
        .single()

      if (maintenanceError) {
        throw new HttpError(500, 'Failed to raise maintenance request')
      }

      await supabase.from('audit_log').insert({
        user_id: technicianId,
        action: 'maintenance.create',
        entity_type: 'maintenance_requests',
        entity_id: request.id,
        metadata: { asset_id: assetId, status },
      })

      const { data: staff } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_active', true)
        .in('role', ['supervisor', 'technician'])

      for (const member of staff ?? []) {
        await notify(
          member.id,
          'fault_reported',
          'Fault reported',
          `An asset was inspected as ${status} and a maintenance request was raised automatically.`,
          assetId,
        )
      }
    }
  }
}
