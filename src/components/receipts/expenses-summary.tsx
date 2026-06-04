import { useTranslation } from 'react-i18next'
import { Info, CheckSquare, X } from 'lucide-react'
import { Amount } from '@/components/receipts/primitives'
import { useCurrencyConverter } from '@/hooks/currencies/use-currency-converter'
import type { CurrencyTotal } from '@/hooks/receipts/use-receipts'

interface ExpensesSummaryProps {
  totalAmounts: CurrencyTotal[]
  total: number
  filtersActive: boolean
  selectMode: boolean
  onToggleSelectMode: () => void
  rangeFrom?: number
  rangeTo?: number
}

export function ExpensesSummary({
  totalAmounts,
  total,
  filtersActive,
  selectMode,
  onToggleSelectMode,
  rangeFrom,
  rangeTo,
}: ExpensesSummaryProps) {
  const { t } = useTranslation()
  const { convert, preferredCurrency } = useCurrencyConverter()
  const convertedTotal = totalAmounts.reduce((s, { currency, total }) => s + convert(total, currency), 0)
  const mixed = !(totalAmounts.length === 1 && totalAmounts[0].currency === preferredCurrency)

  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="text-sm font-medium text-muted-foreground">
        {filtersActive ? t('receipts.filteredTotal') : t('receipts.total')}:
      </span>
      <Amount value={convertedTotal} currency={preferredCurrency} size={15} />
      {mixed && (
        <span
          className="inline-flex items-center gap-1 text-xs text-muted-foreground"
          title={t('receipts.convertedDisclaimer')}
        >
          <Info className="size-3" />
          {t('receipts.convertedNote')}
        </span>
      )}
      <span className="ml-auto hidden items-center gap-3 md:flex">
        {rangeFrom !== undefined && rangeTo !== undefined && (
          <span className="text-sm text-muted-foreground">
            {t('common.pagination.showing', { from: rangeFrom, to: rangeTo, total })}
          </span>
        )}
        <button
          onClick={onToggleSelectMode}
          className="inline-flex h-[30px] items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-[13px] font-semibold text-fg-2 transition-colors hover:bg-bg-subtle hover:text-foreground"
        >
          {selectMode ? <X className="size-3.5" /> : <CheckSquare className="size-3.5" />}
          {selectMode ? t('common.cancel') : t('receipts.select')}
        </button>
      </span>
    </div>
  )
}
