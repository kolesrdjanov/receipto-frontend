import { type LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface KpiCardProps {
  label: string
  value: number | string
  previousValue?: number | string | null
  icon: LucideIcon
  format?: 'number' | 'currency'
}

export function KpiCard({ label, value, previousValue, icon: Icon, format = 'number' }: KpiCardProps) {
  const { t } = useTranslation()

  const currentNum = typeof value === 'string' ? Number(value) : value
  const prevNum = previousValue != null ? (typeof previousValue === 'string' ? Number(previousValue) : previousValue) : null

  const pctChange = prevNum != null && prevNum !== 0
    ? ((currentNum - prevNum) / prevNum * 100)
    : null

  const formatted = format === 'currency'
    ? currentNum.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    : currentNum.toLocaleString()

  const prevFormatted = prevNum != null
    ? (format === 'currency'
      ? prevNum.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
      : prevNum.toLocaleString())
    : null

  const isPositive = pctChange != null && pctChange > 0
  const ChangeIcon = isPositive ? ArrowUpRight : ArrowDownRight

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold">{formatted}</div>
      {pctChange != null && (
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`flex items-center text-xs font-medium ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            <ChangeIcon className="h-3 w-3" />
            {Math.abs(pctChange).toFixed(1)}%
          </span>
          {prevFormatted != null && (
            <span className="text-xs text-muted-foreground">
              {t('analytics.vsPrev')}: {prevFormatted}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
