import type { Receipt } from '@/hooks/receipts/use-receipts'

export interface DayGroup {
  /** local-calendar-day key, e.g. "2026-5-4" */
  key: string
  /** the day's Date (from the first receipt of that day) */
  date: Date
  items: Receipt[]
  /** Σ totalAmount per currency for this day's loaded rows */
  subtotalsByCurrency: Record<string, number>
}

/**
 * Group receipts by local calendar day of `receiptDate` (fallback `createdAt`),
 * preserving input order (the API returns receiptDate DESC). Pure + locale-neutral —
 * relative day labels are formatted by the component layer.
 */
export function groupReceiptsByDay(receipts: Receipt[]): DayGroup[] {
  const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  const groups = new Map<string, DayGroup>()
  for (const r of receipts) {
    const d = new Date(r.receiptDate || r.createdAt)
    const k = dayKey(d)
    let g = groups.get(k)
    if (!g) {
      g = { key: k, date: d, items: [], subtotalsByCurrency: {} }
      groups.set(k, g)
    }
    g.items.push(r)
    const cur = r.currency || 'RSD'
    g.subtotalsByCurrency[cur] = (g.subtotalsByCurrency[cur] || 0) + (Number(r.totalAmount) || 0)
  }
  return [...groups.values()]
}
