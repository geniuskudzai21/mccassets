import type { Asset } from '../types/db.js'

const DAYS_PER_YEAR = 365.25
const MS_PER_DAY = 24 * 60 * 60 * 1000

export function yearsBetween(from: string, date: Date): number {
  return (date.getTime() - new Date(from).getTime()) / (DAYS_PER_YEAR * MS_PER_DAY)
}

/**
 * Straight-line depreciated value: cost reduced evenly across useful life,
 * floored at zero once fully depreciated.
 */
export function depreciatedValue(cost: number, usefulLifeYears: number, fromDate: string, asOf: Date) {
  const age = Math.max(0, yearsBetween(fromDate, asOf))
  const annual = usefulLifeYears > 0 ? cost / usefulLifeYears : cost
  return Math.max(0, cost - annual * age)
}

export function endOfLifeDate(purchaseDate: string, usefulLifeYears: number): Date {
  const date = new Date(purchaseDate)
  date.setUTCFullYear(date.getUTCFullYear() + Math.floor(usefulLifeYears))
  return date
}

export function daysToEnd(purchaseDate: string, usefulLifeYears: number, asOf: Date): number {
  return Math.ceil((endOfLifeDate(purchaseDate, usefulLifeYears).getTime() - asOf.getTime()) / MS_PER_DAY)
}

export interface AssetDepreciation {
  cost: number
  usefulLifeYears: number
  currentValue: number
  endOfLife: string
  daysToEnd: number
  replacementDue: boolean
}

export function depreciateAsset(asset: Pick<Asset['Row'], 'purchase_date' | 'purchase_cost' | 'useful_life_years'>, asOf = new Date()): AssetDepreciation {
  const cost = Number(asset.purchase_cost ?? 0)
  const usefulLifeYears = Number(asset.useful_life_years || 1)
  const endOfLife = endOfLifeDate(asset.purchase_date, usefulLifeYears)
  return {
    cost,
    usefulLifeYears,
    currentValue: depreciatedValue(cost, usefulLifeYears, asset.purchase_date, asOf),
    endOfLife: endOfLife.toISOString().slice(0, 10),
    daysToEnd: Math.ceil((endOfLife.getTime() - asOf.getTime()) / MS_PER_DAY),
    replacementDue: depreciatedValue(cost, usefulLifeYears, asset.purchase_date, asOf) <= 0,
  }
}