import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { SelectCheck } from '@/components/receipts/primitives'
import { FilterChip } from '@/components/receipts/filter-chip'
import { DatePicker } from '@/components/ui/date-picker'
import { activeDatePreset, thisMonthRange, last30DaysRange } from '@/lib/filter-presets'
import type { Category } from '@/hooks/categories/use-categories'
import type { ReceiptsFilters } from '@/hooks/receipts/use-receipts'

interface FilterRailProps {
  filters: ReceiptsFilters
  categories: Category[]
  onFiltersChange: (filters: ReceiptsFilters) => void
  className?: string
}

function RailLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-[11px] text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-faint">{children}</div>
}

export function FilterRail({ filters, categories, onFiltersChange, className }: FilterRailProps) {
  const { t } = useTranslation()
  const [showAll, setShowAll] = useState(false)
  const preset = activeDatePreset(filters)
  const shown = showAll ? categories : categories.slice(0, 6)

  const toggleCategory = (id: string) =>
    onFiltersChange({ ...filters, categoryId: filters.categoryId === id ? undefined : id })
  const setAmount = (key: 'minAmount' | 'maxAmount', v: string) =>
    onFiltersChange({ ...filters, [key]: v ? Number(v) : undefined })
  const setDate = (key: 'startDate' | 'endDate', v: string) =>
    onFiltersChange({ ...filters, [key]: v || undefined })

  return (
    <aside
      className={cn(
        'sticky top-8 flex w-60 shrink-0 flex-col gap-4 rounded-2xl border border-border p-[18px] shadow-glass-1',
        'bg-card',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-semibold">{t('receipts.filters.title')}</span>
        <button type="button" onClick={() => onFiltersChange({})} className="text-[12.5px] font-semibold text-primary hover:underline">
          {t('receipts.filters.clearAll')}
        </button>
      </div>

      {/* Category */}
      <div className="border-b border-hairline-soft pb-4">
        <RailLabel>{t('receipts.filters.category')}</RailLabel>
        <div className="flex flex-col gap-1">
          {shown.map((c) => {
            const on = filters.categoryId === c.id
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCategory(c.id)}
                className={cn(
                  'flex items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-left text-[13.5px] font-semibold transition-colors hover:bg-bg-subtle',
                  on ? 'text-foreground' : 'text-fg-2',
                )}
              >
                <SelectCheck on={on} />
                <span className="grid size-[26px] shrink-0 place-items-center rounded-lg text-sm" style={{ background: (c.color || '#888') + '24' }}>
                  {c.icon}
                </span>
                <span className="truncate">{c.name}</span>
              </button>
            )
          })}
          {categories.length > 6 && (
            <button type="button" onClick={() => setShowAll((v) => !v)} className="px-0.5 py-1 text-left text-[12.5px] font-semibold text-primary hover:underline">
              {showAll ? t('receipts.filters.showLess') : t('receipts.filters.showAllCategories')}
            </button>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="border-b border-hairline-soft pb-4">
        <RailLabel>{t('receipts.filters.amount')}</RailLabel>
        <div className="flex items-center gap-2">
          <RailAmountInput placeholder={t('receipts.filters.min')} value={filters.minAmount} onChange={(v) => setAmount('minAmount', v)} />
          <span className="text-fg-faint">–</span>
          <RailAmountInput placeholder={t('receipts.filters.maxAmountPlaceholder')} value={filters.maxAmount} onChange={(v) => setAmount('maxAmount', v)} />
        </div>
      </div>

      {/* Date range */}
      <div>
        <RailLabel>{t('receipts.filters.dateRange')}</RailLabel>
        <div className="mb-2.5 flex flex-wrap gap-2">
          <FilterChip label={t('receipts.filters.thisMonth')} active={preset === 'thisMonth'} onClick={() => onFiltersChange({ ...filters, ...thisMonthRange() })} />
          <FilterChip label={t('receipts.filters.last30Days')} active={preset === 'last30Days'} onClick={() => onFiltersChange({ ...filters, ...last30DaysRange() })} />
          <FilterChip label={t('receipts.filters.custom')} active={preset === 'custom'} onClick={() => { if (preset !== 'custom') onFiltersChange({ ...filters, startDate: undefined, endDate: undefined }) }} />
        </div>
        <div className="flex flex-col gap-2">
          <DatePicker value={filters.startDate ?? ''} onChange={(v) => setDate('startDate', v)} placeholder={t('receipts.filters.fromDate')} />
          <DatePicker value={filters.endDate ?? ''} onChange={(v) => setDate('endDate', v)} placeholder={t('receipts.filters.toDate')} />
        </div>
      </div>
    </aside>
  )
}

function RailAmountInput({ placeholder, value, onChange }: { placeholder: string; value?: number; onChange: (v: string) => void }) {
  return (
    <div className="flex h-10 flex-1 items-center rounded-[10px] border border-border bg-bg-subtle/70 px-3 transition-[border-color,box-shadow] focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15 dark:bg-input/55">
      <input
        type="number"
        min={0}
        inputMode="numeric"
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 bg-transparent text-[13.5px] font-medium text-foreground outline-none placeholder:text-fg-faint"
      />
    </div>
  )
}
