import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useCategories } from '@/hooks/categories/use-categories'
import { type ReceiptsFilters } from '@/hooks/receipts/use-receipts'
import { X } from 'lucide-react'

interface ReceiptsFiltersProps {
  filters: ReceiptsFilters
  onFiltersChange: (filters: ReceiptsFilters) => void
}

export function ReceiptsFiltersBar({ filters, onFiltersChange }: ReceiptsFiltersProps) {
  const { t } = useTranslation()
  const { data: categories = [] } = useCategories()

  const handleCategoryChange = (value: string) => {
    onFiltersChange({
      ...filters,
      categoryId: value === 'all' ? undefined : value,
    })
  }

  const handleMinAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    onFiltersChange({
      ...filters,
      minAmount: value ? Number(value) : undefined,
    })
  }

  const handleMaxAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    onFiltersChange({
      ...filters,
      maxAmount: value ? Number(value) : undefined,
    })
  }

  const handleStartDateChange = (value: string) => {
    onFiltersChange({
      ...filters,
      startDate: value || undefined,
    })
  }

  const handleEndDateChange = (value: string) => {
    onFiltersChange({
      ...filters,
      endDate: value || undefined,
    })
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const hasActiveFilters = filters.categoryId || filters.minAmount !== undefined ||
    filters.maxAmount !== undefined || filters.startDate || filters.endDate

  return (
    <div className="flex flex-col gap-4 p-4 bg-muted/50 rounded-lg mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="category">{t('receipts.filters.category')}</Label>
          <Select value={filters.categoryId || 'all'} onValueChange={handleCategoryChange}>
            <SelectTrigger id="category">
              <SelectValue placeholder={t('receipts.filters.allCategories')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('receipts.filters.allCategories')}</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.icon && <span className="mr-2">{category.icon}</span>}
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="minAmount">{t('receipts.filters.minAmount')}</Label>
          <Input
            id="minAmount"
            type="number"
            placeholder={t('receipts.filters.minAmountPlaceholder')}
            min={0}
            value={filters.minAmount ?? ''}
            onChange={handleMinAmountChange}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="maxAmount">{t('receipts.filters.maxAmount')}</Label>
          <Input
            id="maxAmount"
            type="number"
            placeholder={t('receipts.filters.maxAmountPlaceholder')}
            min={0}
            value={filters.maxAmount ?? ''}
            onChange={handleMaxAmountChange}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="startDate">{t('receipts.filters.fromDate')}</Label>
          <DatePicker
            id="startDate"
            value={filters.startDate ?? ''}
            onChange={handleStartDateChange}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="endDate">{t('receipts.filters.toDate')}</Label>
          <DatePicker
            id="endDate"
            value={filters.endDate ?? ''}
            onChange={handleEndDateChange}
          />
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            {t('receipts.filters.clearFilters')}
          </Button>
        </div>
      )}
    </div>
  )
}
