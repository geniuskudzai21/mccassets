import type { AssetStatus } from '../types/db.ts'

export const STATUS_COLORS: Record<AssetStatus, string> = {
  good: '#3F7D4E',
  fair: '#B8862E',
  poor: '#B0432F',
  disposal: '#8A8880',
}

export const STATUS_LABELS: Record<AssetStatus, string> = {
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
  disposal: 'Disposal',
}

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  in_progress: 'In progress',
  completed: 'Completed',
  rejected: 'Rejected',
}

export const REQUEST_STATUS_COLORS: Record<string, string> = {
  pending: '#B8862E',
  approved: '#2A5C57',
  in_progress: '#2A5C57',
  completed: '#3F7D4E',
  rejected: '#8A8880',
}
