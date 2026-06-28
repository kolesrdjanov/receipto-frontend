import { useTranslation } from 'react-i18next'
import { Info, CheckSquare, X } from 'lucide-react'
import { Amount } from '@/components/receipts/primitives'
import { Button } from '@/components/ui/button'
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
  selectedCount: number
  selectedTotal: number
}

export function ExpensesSummary({
  totalAmounts,
  total,
  filtersActive,
  selectMode,
  onToggleSelectMode,
  rangeFrom,
  rangeTo,
  selectedCount,
  selectedTotal,
}: ExpensesSummaryProps) {
  const { t } = useTranslation()
  const { convert, preferredCurrency } = useCurrencyConverter()
  const convertedTotal = totalAmounts.reduce((s, { currency, total }) => s + convert(total, currency), 0)
  const mixed = !(totalAmounts.length === 1 && totalAmounts[0].currency === preferredCurrency)

  if (selectMode) {
    return (
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-[15px] font-semibold text-foreground">{t('receipts.selected', { count: selectedCount })}</span>
          <span className="text-sm text-muted-foreground">·</span>
          <Amount value={selectedTotal} currency={preferredCurrency} size={15} muted />
        </div>
        <Button variant="glass" size="pill" onClick={onToggleSelectMode}>
          <X className="size-3.5" />
          {t('common.cancel')}
        </Button>
      </div>
    )
  }

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
        <Button variant="glass" size="pill" onClick={onToggleSelectMode}>
          {selectMode ? <X className="size-3.5" /> : <CheckSquare className="size-3.5" />}
          {selectMode ? t('common.cancel') : t('receipts.select')}
        </Button>
      </span>
    </div>
  )
}
