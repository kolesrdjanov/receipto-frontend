import { useTranslation } from 'react-i18next'
import { format, isToday, isYesterday } from 'date-fns'
import { enUS, sr } from 'date-fns/locale'
import { StaggerContainer, StaggerItem } from '@/components/ui/animated'
import { Amount } from '@/components/receipts/primitives'
import { ExpenseRow } from '@/components/receipts/expense-row'
import { groupReceiptsByDay } from '@/lib/group-receipts-by-day'
import { useCurrencyConverter } from '@/hooks/currencies/use-currency-converter'
import type { Receipt } from '@/hooks/receipts/use-receipts'

const LOCALES = { en: enUS, sr } as const

interface ExpenseFeedProps {
  receipts: Receipt[]
  wide?: boolean
  selectMode?: boolean
  selectedIds?: Set<string>
  onToggleSelect?: (id: string) => void
  onView?: (r: Receipt) => void
  onEdit?: (r: Receipt) => void
  onDelete?: (r: Receipt) => void
}

export function ExpenseFeed({
  receipts,
  wide,
  selectMode,
  selectedIds,
  onToggleSelect,
  onView,
  onEdit,
  onDelete,
}: ExpenseFeedProps) {
  const { t, i18n } = useTranslation()
  const locale = LOCALES[i18n.language as keyof typeof LOCALES] || enUS
  const { convert, preferredCurrency } = useCurrencyConverter()
  const groups = groupReceiptsByDay(receipts)

  const dayLabel = (d: Date) =>
    isToday(d) ? t('common.today') : isYesterday(d) ? t('common.yesterday') : format(d, 'EEEE', { locale })

  const subtotal = (by: Record<string, number>) => {
    const curs = Object.keys(by)
    if (curs.length === 1) return <Amount value={by[curs[0]]} currency={curs[0]} size={12} weight={600} muted />
    const total = curs.reduce((s, c) => s + convert(by[c], c), 0)
    return <Amount value={total} currency={preferredCurrency} size={12} weight={600} muted />
  }

  let lastMonth = ''
  return (
    <StaggerContainer key={receipts.map((r) => r.id).join()} className="flex flex-col gap-[18px] md:gap-[22px]">
      {groups.map((g) => {
        const monthLabel = format(g.date, 'LLLL yyyy', { locale })
        const showMonth = monthLabel !== lastMonth
        lastMonth = monthLabel
        return (
          <StaggerItem key={g.key}>
            {showMonth && <div className="t-xs mb-1 px-1 text-fg-faint">{monthLabel}</div>}
            <div className="flex items-baseline justify-between px-1 py-2">
              <span className="t-xs">
                {dayLabel(g.date)} · {format(g.date, 'd LLL', { locale })}
              </span>
              {subtotal(g.subtotalsByCurrency)}
            </div>
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-glass-1 [&>div+div]:border-t [&>div+div]:border-hairline-soft">
              {g.items.map((r) => (
                <ExpenseRow
                  key={r.id}
                  receipt={r}
                  wide={wide}
                  selectMode={selectMode}
                  selected={!!selectedIds?.has(r.id)}
                  onToggleSelect={onToggleSelect}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </StaggerItem>
        )
      })}
    </StaggerContainer>
  )
}
