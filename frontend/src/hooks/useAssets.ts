import { useEffect, useState } from 'react'
import { api } from '../lib/api.ts'
import type {
  AssetFilters,
  AssetListResponse,
  AssetRow,
  AssetTimelineItem,
  DepartmentRow,
} from '../types/asset.ts'

export interface UseAssetsOptions {
  filters: AssetFilters
  limit: number
  offset: number
}

export function useAssets({ filters, limit, offset }: UseAssetsOptions) {
  const [data, setData] = useState<AssetListResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.department_id) params.set('department_id', filters.department_id)
    if (filters.type) params.set('type', filters.type)
    if (filters.q) params.set('q', filters.q)
    params.set('limit', String(limit))
    params.set('offset', String(offset))

    api<AssetListResponse>(`/api/assets?${params.toString()}`)
      .then((result) => {
        if (active) {
          setData(result)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load assets')
        }
      })

    return () => {
      active = false
    }
  }, [filters, limit, offset])

  const loading = data === null && error === null

  return { data, loading, error }
}

export function useAsset(id: string | undefined) {
  const [asset, setAsset] = useState<AssetRow | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let active = true

    api<{ data: AssetRow }>(`/api/assets/${id}`)
      .then((result) => {
        if (active) {
          setAsset(result.data)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load asset')
        }
      })

    return () => {
      active = false
    }
  }, [id])

  const loading = id != null && asset === null && error === null

  return { asset, loading, error }
}

export function useAssetHistory(id: string | undefined) {
  const [timeline, setTimeline] = useState<AssetTimelineItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let active = true

    api<{ data: AssetTimelineItem[] }>(`/api/assets/${id}/history`)
      .then((result) => {
        if (active) {
          setTimeline(result.data)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Could not load activity.')
        }
      })

    return () => {
      active = false
    }
  }, [id])

  const loading = timeline === null && error === null

  return { timeline, loading, error }
}

export function useDepartments() {
  const [departments, setDepartments] = useState<DepartmentRow[]>([])

  useEffect(() => {
    let active = true
    api<{ data: DepartmentRow[] }>('/api/departments')
      .then((result) => {
        if (active) setDepartments(result.data)
      })
      .catch(() => {
        /* leave empty */
      })

    return () => {
      active = false
    }
  }, [])

  return { departments }
}
