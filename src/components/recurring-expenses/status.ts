import type { TFunction } from 'i18next'
import { differenceInCalendarDays, startOfToday } from 'date-fns'
import type { RecurringExpense } from '@/hooks/recurring-expenses/use-recurring-expenses'

/* ── Status scale ─────────────────────────────────────────────────────────
   Urgency carried by the badge AND the sort. Derived purely from each row's
   own `nextDueDate` / `isPaused` / `endDate` — the backend's `nextDueDate` is the
   next *unpaid* due date (today-or-future, or null when caught up), so every
   state is self-consistent with the row and the summary counts. There is no
   separate /upcoming fetch: it would be equivalent and overdue never populates
   from it (its range starts at today). */
export type RecurringStatus = 'overdue' | 'duesoon' | 'upcoming' | 'paid' | 'paused' | 'ended'

export const STATUS_RANK: Record<RecurringStatus, number> = {
  overdue: 0,
  duesoon: 1,
  upcoming: 2,
  paid: 3,
  paused: 4,
  ended: 5,
}

const dueDiff = (dateStr: string) =>
  differenceInCalendarDays(new Date(dateStr + 'T00:00:00'), startOfToday())

export function deriveStatus(e: RecurringExpense): RecurringStatus {
  if (e.isPaused) return 'paused'
  if (e.endDate && dueDiff(e.endDate) < 0) return 'ended'
  if (!e.nextDueDate) return 'paid'
  const diff = dueDiff(e.nextDueDate)
  if (diff < 0) return 'overdue'
  if (diff <= 7) return 'duesoon'
  return 'upcoming'
}

export interface RecurringRowData {
  expense: RecurringExpense
  status: RecurringStatus
}

/** Derive each row's status and sort by urgency, then soonest due date first. */
export function buildRecurringRows(expenses: RecurringExpense[] | undefined): RecurringRowData[] {
  if (!expenses) return []
  return expenses
    .map((expense) => ({ expense, status: deriveStatus(expense) }))
    .sort((a, b) => {
      const r = STATUS_RANK[a.status] - STATUS_RANK[b.status]
      if (r !== 0) return r
      const ad = a.expense.nextDueDate
      const bd = b.expense.nextDueDate
      if (ad && bd) return ad.localeCompare(bd)
      if (ad) return -1
      if (bd) return 1
      return a.expense.name.localeCompare(b.expense.name)
    })
}

/** Relative, urgent label: "Overdue 11 days", "Due tomorrow", "in 8 days", "Up to date". */
export function relativeDueLabel(
  status: RecurringStatus,
  nextDueDate: string | null | undefined,
  t: TFunction,
): string {
  if (status === 'paused') return t('recurring.status.paused')
  if (status === 'ended') return t('recurring.status.ended')
  if (status === 'paid' || !nextDueDate) return t('recurring.dueLabels.upToDate')
  const diff = dueDiff(nextDueDate)
  if (diff < 0) return t('recurring.dueLabels.overdue', { count: Math.abs(diff) })
  if (diff === 0) return t('recurring.dueLabels.dueToday')
  if (diff === 1) return t('recurring.dueLabels.dueTomorrow')
  if (status === 'duesoon') return t('recurring.dueLabels.dueInDays', { count: diff })
  return t('recurring.dueLabels.inDays', { count: diff })
}
