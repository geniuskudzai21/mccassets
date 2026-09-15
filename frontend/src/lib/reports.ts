import { jsPDF } from 'jspdf'
import { formatCurrency, formatDate } from '../types/asset.ts'

export interface SummaryReportData {
  total: number
  total_value: number
  by_status: Record<string, number>
  by_department: { name: string; count: number }[]
  open_maintenance: number
  inspections_last_30d: number
}

export interface DepreciationRow {
  id: string
  asset_tag: string
  department: string | null
  purchase_date: string
  useful_life_years: number
  end_of_life: string
  purchase_cost: number
  annual_depreciation: number
  current_value: number
  replacement_due: boolean
}

export interface ReplacementDueRow {
  id: string
  asset_tag: string
  brand: string | null
  model: string | null
  status: string
  purchase_date: string
  useful_life_years: number
  end_of_life: string
  days_to_end: number
  purchase_cost: number
  current_value: number
}

const MARGIN = 40
const PAGE_HEIGHT = 842
const BODY_TOP = 60
const CONTENT_WIDTH = 515

function drawTableHeader(doc: jsPDF, headings: string[], x: number, y: number, widths: number[]) {
  doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(0, 0, 0)
  drawCells(doc, headings, x, y, widths)
  doc.setDrawColor(0, 0, 0).line(x, y + 5, x + CONTENT_WIDTH, y + 5)
  doc.setTextColor(0, 0, 0)
}

function drawCells(doc: jsPDF, values: string[], x: number, y: number, widths: number[]) {
  let cursor = x
  values.forEach((value, index) => {
    doc.text(doc.splitTextToSize(value, widths[index]), cursor, y)
    cursor += widths[index]
  })
}

function drawTableRow(
  doc: jsPDF,
  values: string[],
  x: number,
  y: number,
  widths: number[],
): number {
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(0, 0, 0)
  drawCells(doc, values, x, y, widths)
  const rowHeight = values.reduce((max, value, index) => {
    const lines = doc.splitTextToSize(value, widths[index]).length
    return Math.max(max, lines * 12)
  }, 12)
  doc.setTextColor(0, 0, 0)
  return rowHeight
}

function sectionHeading(doc: jsPDF, y: number, title: string): number {
  if (y > PAGE_HEIGHT - 100) {
    doc.addPage()
    y = BODY_TOP
  }
  doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(0, 0, 0)
  doc.text(title, MARGIN, y)
  return y + 18
}

export function buildAssetReportPdf(params: {
  summary: SummaryReportData
  depreciation: DepreciationRow[]
  replacement: ReplacementDueRow[]
}): void {
  const { summary, depreciation, replacement } = params
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const x = MARGIN

  const title = 'MCAS-ICT — Asset register report'
  const subtitle = `Prepared ${new Date().toLocaleDateString('en-ZW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}`

  doc.setFont('helvetica', 'bold').setFontSize(16).setTextColor(0, 0, 0)
  doc.text(title, x, 54)
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(90, 90, 90)
  doc.text(subtitle, x, 70)
  doc.setDrawColor(0, 0, 0).line(x, 80, x + CONTENT_WIDTH, 80)

  let y = sectionHeading(doc, 104, '1. Summary')

  doc.setFont('helvetica', 'normal').setFontSize(10)
  doc.text(`Total assets: ${summary.total}`, x, y)
  y += 16
  doc.text(`Total replacement value: ${formatCurrency(summary.total_value)}`, x, y)
  y += 16
  const statusLine = Object.entries(summary.by_status)
    .map(([status, count]) => `${status} ${count}`)
    .join('   ·   ')
  doc.text(`By status: ${statusLine}`, x, y)
  y += 16
  doc.text(`Open maintenance: ${summary.open_maintenance}`, x, y)
  y += 16
  doc.text(`Inspections (last 30 days): ${summary.inspections_last_30d}`, x, y)
  y += 22

  if (summary.by_department.length > 0) {
    y = sectionHeading(doc, y, 'Assets by department')
    summary.by_department.forEach(({ name, count }) => {
      if (y > PAGE_HEIGHT - 100) {
        doc.addPage()
        y = BODY_TOP
      }
      doc.setFont('helvetica', 'normal').setFontSize(10)
      doc.text(`${name}: ${count}`, x, y)
      y += 15
    })
    y += 8
  }

  y = sectionHeading(doc, y, '2. Depreciation table')
  const widths = [120, 115, 78, 72, 72, 78]
  drawTableHeader(
    doc,
    ['Asset tag', 'Department', 'Purchased', 'Cost', 'Annual dep.', 'Current value'],
    x,
    y,
    widths,
  )
  y += 18
  depreciation.forEach((row) => {
    if (y > PAGE_HEIGHT - 100) {
      doc.addPage()
      y = BODY_TOP
      drawTableHeader(
        doc,
        ['Asset tag', 'Department', 'Purchased', 'Cost', 'Annual dep.', 'Current value'],
        x,
        y,
        widths,
      )
      y += 18
    }
    const values = [
      row.asset_tag,
      row.department ?? '—',
      row.purchase_date,
      formatCurrency(row.purchase_cost),
      formatCurrency(row.annual_depreciation),
      formatCurrency(row.current_value),
    ]
    y += drawTableRow(doc, values, x, y, widths)
    doc.setDrawColor(220, 220, 220).line(x, y - 2, x + CONTENT_WIDTH, y - 2)
    y += 8
  })

  y = sectionHeading(doc, y, '3. Replacement due')
  const rWidths = [120, 100, 130, 75, 90]
  drawTableHeader(
    doc,
    ['Asset tag', 'Brand / model', 'End of life', 'Days', 'Current value'],
    x,
    y,
    rWidths,
  )
  y += 18
  if (replacement.length === 0) {
    doc.setFont('helvetica', 'normal').setFontSize(10)
    doc.text('No assets are due for replacement within the horizon.', x, y)
    y += 15
  }
  replacement.forEach((row) => {
    if (y > PAGE_HEIGHT - 100) {
      doc.addPage()
      y = BODY_TOP
      drawTableHeader(
        doc,
        ['Asset tag', 'Brand / model', 'End of life', 'Days', 'Current value'],
        x,
        y,
        rWidths,
      )
      y += 18
    }
    const values = [
      row.asset_tag,
      `${row.brand ?? ''} ${row.model ?? ''}`.trim() || '—',
      row.end_of_life,
      `${row.days_to_end <= 0 ? 'Overdue' : `${row.days_to_end}d`}`,
      formatCurrency(row.current_value),
    ]
    y += drawTableRow(doc, values, x, y, rWidths)
    doc.setDrawColor(220, 220, 220).line(x, y - 2, x + CONTENT_WIDTH, y - 2)
    y += 8
  })

  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(90, 90, 90)
  doc.text(
    'Straight-line depreciation basis. Historical cost as recorded in the asset register.',
    x,
    PAGE_HEIGHT - 30,
  )
  doc.text(`Generated ${formatDate(new Date().toISOString())}`, x, PAGE_HEIGHT - 18)

  doc.save(`mcas-asset-report-${new Date().toISOString().slice(0, 10)}.pdf`)
}
