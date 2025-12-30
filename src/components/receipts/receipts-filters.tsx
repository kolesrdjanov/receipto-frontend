import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      startDate: e.target.value || undefined,
    })
  }

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      endDate: e.target.value || undefined,
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
          <Label htmlFor="category">Category</Label>
          <Select value={filters.categoryId || 'all'} onValueChange={handleCategoryChange}>
            <SelectTrigger id="category">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
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
          <Label htmlFor="minAmount">Min Amount</Label>
          <Input
            id="minAmount"
            type="number"
            placeholder="0"
            min={0}
            value={filters.minAmount ?? ''}
            onChange={handleMinAmountChange}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="maxAmount">Max Amount</Label>
          <Input
            id="maxAmount"
            type="number"
            placeholder="No limit"
            min={0}
            value={filters.maxAmount ?? ''}
            onChange={handleMaxAmountChange}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="startDate">From Date</Label>
          <Input
            id="startDate"
            type="date"
            value={filters.startDate ?? ''}
            onChange={handleStartDateChange}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="endDate">To Date</Label>
          <Input
            id="endDate"
            type="date"
            value={filters.endDate ?? ''}
            onChange={handleEndDateChange}
          />
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        </div>
      )}
    </div>
  )
}
