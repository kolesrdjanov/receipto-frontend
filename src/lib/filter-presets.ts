import type { ReceiptsFilters } from '@/hooks/receipts/use-receipts'

export type DatePreset = 'thisMonth' | 'last30Days' | 'custom' | null

/** Local-timezone YYYY-MM-DD (matches the backend's date-only filter contract). */
function iso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** First → last calendar day of the current month. */
export function thisMonthRange(now = new Date()): { startDate: string; endDate: string } {
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { startDate: iso(start), endDate: iso(end) }
}

/** Today and the 29 days before it (30-day inclusive window). */
export function last30DaysRange(now = new Date()): { startDate: string; endDate: string } {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)
  return { startDate: iso(start), endDate: iso(now) }
}

/** Which preset (if any) the current filter range matches. */
export function activeDatePreset(filters: Pick<ReceiptsFilters, 'startDate' | 'endDate'>, now = new Date()): DatePreset {
  if (!filters.startDate && !filters.endDate) return null
  const tm = thisMonthRange(now)
  if (filters.startDate === tm.startDate && filters.endDate === tm.endDate) return 'thisMonth'
  const l30 = last30DaysRange(now)
  if (filters.startDate === l30.startDate && filters.endDate === l30.endDate) return 'last30Days'
  return 'custom'
}
