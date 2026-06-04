import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MoreHorizontal, CircleCheckBig, ArrowDownWideNarrow, ArrowDownUp, SlidersHorizontal, X, type LucideIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Amount } from '@/components/receipts/primitives'
import { QuickChips } from '@/components/receipts/quick-chips'
import { useCurrencyConverter } from '@/hooks/currencies/use-currency-converter'
import type { Category } from '@/hooks/categories/use-categories'
import type { ReceiptsFilters, CurrencyTotal } from '@/hooks/receipts/use-receipts'

function MenuItem({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[14px] font-semibold text-foreground transition-colors hover:bg-bg-subtle"
    >
      <Icon className="size-[17px] shrink-0 text-muted-foreground" />
      <span>{label}</span>
    </button>
  )
}

interface ExpensesMobileHeaderProps {
  totalAmounts: CurrencyTotal[]
  count: number
  hasReceipts: boolean
  filters: ReceiptsFilters
  categories: Category[]
  onFiltersChange: (filters: ReceiptsFilters) => void
  onOpenFilters: () => void
  selectMode: boolean
  onToggleSelectMode: () => void
  sortOrder: 'ASC' | 'DESC'
  onToggleSort: () => void
  onImportExport: () => void
  selectedCount: number
  allSelected: boolean
  onToggleSelectAll: () => void
}

/** Mobile frosted page header: title + total + count + "…" menu + quick-chips + filter button. */
export function ExpensesMobileHeader({
  totalAmounts, count, hasReceipts, filters, categories, onFiltersChange,
  onOpenFilters, selectMode, onToggleSelectMode, sortOrder, onToggleSort, onImportExport,
  selectedCount, allSelected, onToggleSelectAll,
}: ExpensesMobileHeaderProps) {
  const { t } = useTranslation()
  const { convert, preferredCurrency } = useCurrencyConverter()
  const [menuOpen, setMenuOpen] = useState(false)
  const convertedTotal = totalAmounts.reduce((s, { currency, total }) => s + convert(total, currency), 0)
  const sortValue = sortOrder === 'DESC' ? t('receipts.sortNewest') : t('receipts.sortOldest')
  const run = (fn: () => void) => () => { setMenuOpen(false); fn() }

  return (
    <div
      className="sticky top-0 z-20 -mx-4 -mt-6 mb-3 border-b border-hairline-soft bg-[oklch(from_var(--background)_l_c_h/0.82)] px-5 pb-3.5 [backdrop-filter:blur(18px)_saturate(1.4)] [-webkit-backdrop-filter:blur(18px)_saturate(1.4)] md:hidden"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 14px)' }}
    >
      {selectMode ? (
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onToggleSelectMode}
              aria-label={t('common.cancel')}
              className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-bg-subtle hover:text-foreground"
            >
              <X className="size-5" />
            </button>
            <span className="t-h3 truncate">{t('receipts.selected', { count: selectedCount })}</span>
          </div>
          <button
            type="button"
            onClick={onToggleSelectAll}
            className="shrink-0 text-[14px] font-semibold text-primary"
          >
            {allSelected ? t('receipts.deselectAll') : t('receipts.selectAll')}
          </button>
        </div>
      ) : (
        <>
      <div className="mb-4 flex items-end justify-between">
        <div className="min-w-0">
          <h1 className="t-h1 text-[28px]">{t('receipts.title')}</h1>
          {hasReceipts && (
            <div className="mt-1.5 flex items-baseline gap-2">
              <Amount value={convertedTotal} currency={preferredCurrency} size={15} />
              <span className="text-[12.5px] text-muted-foreground">· {t('receipts.count', { count })}</span>
            </div>
          )}
        </div>
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={t('common.more', { defaultValue: 'More' })}
              className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-bg-subtle hover:text-foreground"
            >
              <MoreHorizontal className="size-5" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" sideOffset={8} className="w-[210px] rounded-xl border-border bg-popover p-1.5 shadow-lg">
            <MenuItem icon={CircleCheckBig} label={selectMode ? t('common.cancel') : t('receipts.selectExpenses')} onClick={run(onToggleSelectMode)} />
            <MenuItem icon={ArrowDownWideNarrow} label={t('receipts.sortLabel', { value: sortValue })} onClick={run(onToggleSort)} />
            <div className="mx-2 my-1.5 h-px bg-hairline-soft" />
            <MenuItem icon={ArrowDownUp} label={t('receipts.importExport')} onClick={run(onImportExport)} />
          </PopoverContent>
        </Popover>
      </div>

      <div className="-mx-5 flex items-center gap-2 px-5">
        <div className="min-w-0 flex-1">
          <QuickChips filters={filters} categories={categories} onFiltersChange={onFiltersChange} />
        </div>
        <button
          type="button"
          onClick={onOpenFilters}
          aria-label={t('receipts.filtersButton')}
          className="grid size-[42px] shrink-0 place-items-center rounded-[14px] border border-border bg-card text-fg-2 shadow-glass-1 transition-colors hover:bg-bg-subtle hover:text-foreground"
        >
          <SlidersHorizontal className="size-[18px]" />
        </button>
      </div>
        </>
      )}
    </div>
  )
}
