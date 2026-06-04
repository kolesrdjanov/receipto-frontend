import { useTranslation } from 'react-i18next'
import { FilterChip } from '@/components/receipts/filter-chip'
import { activeDatePreset, thisMonthRange } from '@/lib/filter-presets'
import type { Category } from '@/hooks/categories/use-categories'
import type { ReceiptsFilters } from '@/hooks/receipts/use-receipts'

const MAX_CATEGORY_CHIPS = 4

interface QuickChipsProps {
  filters: ReceiptsFilters
  categories: Category[]
  onFiltersChange: (filters: ReceiptsFilters) => void
}

export function QuickChips({ filters, categories, onFiltersChange }: QuickChipsProps) {
  const { t } = useTranslation()
  const preset = activeDatePreset(filters)
  const noFilters =
    !filters.categoryId &&
    !filters.startDate &&
    !filters.endDate &&
    filters.minAmount === undefined &&
    filters.maxAmount === undefined

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <FilterChip
        label={t('receipts.filters.all')}
        active={noFilters}
        onClick={() => onFiltersChange({})}
      />
      <FilterChip
        label={t('receipts.filters.thisMonth')}
        active={preset === 'thisMonth'}
        onClick={() => onFiltersChange({ ...filters, ...thisMonthRange() })}
      />
      {categories.slice(0, MAX_CATEGORY_CHIPS).map((c) => (
        <FilterChip
          key={c.id}
          label={c.name}
          icon={c.icon ? <span className="text-[13px] leading-none">{c.icon}</span> : undefined}
          active={filters.categoryId === c.id}
          onClick={() => onFiltersChange({ ...filters, categoryId: filters.categoryId === c.id ? undefined : c.id })}
        />
      ))}
    </div>
  )
}
