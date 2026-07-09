import { useMemo } from 'react'
import type { RecurringExpense, RecurringFrequency } from '@/hooks/recurring-expenses/use-recurring-expenses'

// Neutral fallbacks for categories with no assigned color (Luma monochrome ramp).
// Categories that DO carry a color still render it (per-category color is retained).
const FALLBACK_COLORS = ['#6b7280', '#9ca3af', '#4b5563', '#a1a1aa', '#71717a', '#52525b', '#818181', '#3f3f46']

function getMonthlyEquivalent(amount: number, frequency: RecurringFrequency): number {
  switch (frequency) {
    case 'weekly': return amount * 4.33
    case 'monthly': return amount
    case 'quarterly': return amount / 3
    case 'yearly': return amount / 12
    default: return amount
  }
}

export interface CategoryChartItem {
  name: string
  icon?: string
  color: string
  value: number
  count: number
}

export function useCategoryChartData(
  expenses: RecurringExpense[] | undefined,
  convertAmount: (amount: number, fromCurrency: string) => number,
  uncategorizedLabel: string,
): CategoryChartItem[] {
  return useMemo(() => {
    if (!expenses) return []

    const activeExpenses = expenses.filter(
      (e) => !e.isPaused && !(e.endDate && new Date(e.endDate) < new Date())
    )

    const categoryMap = new Map<string, CategoryChartItem>()

    for (const expense of activeExpenses) {
      const monthlyAmount = getMonthlyEquivalent(expense.amount, expense.frequency)
      const converted = convertAmount(monthlyAmount, expense.currency)

      const key = expense.category?.id ?? '__uncategorized__'
      const existing = categoryMap.get(key)

      if (existing) {
        existing.value += converted
        existing.count += 1
      } else {
        categoryMap.set(key, {
          name: expense.category?.name ?? uncategorizedLabel,
          icon: expense.category?.icon,
          color: expense.category?.color ?? FALLBACK_COLORS[categoryMap.size % FALLBACK_COLORS.length],
          value: converted,
          count: 1,
        })
      }
    }

    return Array.from(categoryMap.values()).sort((a, b) => b.value - a.value)
  }, [expenses, convertAmount, uncategorizedLabel])
}
