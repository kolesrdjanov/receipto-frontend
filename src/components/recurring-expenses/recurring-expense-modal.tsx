import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useCreateRecurringExpense,
  useUpdateRecurringExpense,
  type RecurringExpense,
  type CreateRecurringExpenseInput,
} from '@/hooks/recurring-expenses/use-recurring-expenses'
import { useCategories } from '@/hooks/categories/use-categories'
import { CurrencySelect } from '@/components/ui/currency-select'
import { useSettingsStore } from '@/store/settings'
import { toast } from 'sonner'

interface RecurringExpenseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense?: RecurringExpense | null
  mode: 'create' | 'edit'
}

type FormData = CreateRecurringExpenseInput & { isPaused?: boolean }

export function RecurringExpenseModal({ open, onOpenChange, expense, mode }: RecurringExpenseModalProps) {
  const { t } = useTranslation()
  const { currency: preferredCurrency } = useSettingsStore()
  const { data: categories } = useCategories()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      amount: 0,
      currency: preferredCurrency,
      isFixed: true,
      frequency: 'monthly',
      dayOfMonth: new Date().getDate(),
      startDate: new Date().toISOString().split('T')[0],
      categoryId: undefined,
      notes: '',
    },
  })

  const createExpense = useCreateRecurringExpense()
  const updateExpense = useUpdateRecurringExpense()

  const frequency = watch('frequency')
  const isFixed = watch('isFixed')
  const currency = watch('currency')
  const categoryId = watch('categoryId')
  const startDate = watch('startDate')
  const endDate = watch('endDate')

  useEffect(() => {
    if (open && expense && mode === 'edit') {
      reset({
        name: expense.name,
        amount: expense.amount,
        currency: expense.currency || preferredCurrency,
        isFixed: expense.isFixed,
        frequency: expense.frequency,
        dayOfMonth: expense.dayOfMonth || undefined,
        startDate: expense.startDate,
        endDate: expense.endDate || undefined,
        categoryId: expense.categoryId || undefined,
        icon: expense.icon || undefined,
        color: expense.color || undefined,
        notes: expense.notes || '',
        isPaused: expense.isPaused,
      })
    } else if (open && mode === 'create') {
      reset({
        name: '',
        amount: 0,
        currency: preferredCurrency,
        isFixed: true,
        frequency: 'monthly',
        dayOfMonth: new Date().getDate(),
        startDate: new Date().toISOString().split('T')[0],
        categoryId: undefined,
        notes: '',
      })
    }
  }, [open, expense, mode, reset, preferredCurrency])

  const onSubmit = async (data: FormData) => {
    try {
      const submitData = {
        ...data,
        amount: Number(data.amount),
        dayOfMonth: data.dayOfMonth ? Number(data.dayOfMonth) : undefined,
        categoryId: data.categoryId || null,
      }

      if (mode === 'create') {
        await createExpense.mutateAsync(submitData)
        toast.success(t('recurring.modal.createSuccess'))
      } else if (mode === 'edit' && expense) {
        await updateExpense.mutateAsync({ id: expense.id, data: submitData })
        toast.success(t('recurring.modal.updateSuccess'))
      }
      onOpenChange(false)
      reset()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      toast.error(
        mode === 'create' ? t('recurring.modal.createError') : t('recurring.modal.updateError'),
        { description: errorMessage },
      )
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    reset()
  }

  const showDayOfMonth = frequency === 'monthly' || frequency === 'quarterly'

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? t('recurring.modal.createTitle') : t('recurring.modal.editTitle')}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' ? t('recurring.modal.createDescription') : t('recurring.modal.editDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              {t('recurring.modal.name')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...register('name', { required: t('recurring.modal.nameRequired') })}
              placeholder={t('recurring.modal.namePlaceholder')}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">
                {t('recurring.modal.amount')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                {...register('amount', {
                  required: t('recurring.modal.amountRequired'),
                  min: { value: 0.01, message: t('recurring.modal.amountMin') },
                })}
              />
              {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">{t('recurring.modal.currency')}</Label>
              <CurrencySelect
                value={currency || preferredCurrency}
                onValueChange={(value) => setValue('currency', value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="isFixed">{t('recurring.modal.fixedAmount')}</Label>
            <Switch
              id="isFixed"
              checked={isFixed}
              onCheckedChange={(checked) => setValue('isFixed', checked)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="frequency">{t('recurring.modal.frequency')}</Label>
              <Select
                value={frequency}
                onValueChange={(value) => setValue('frequency', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">{t('recurring.frequency.weekly')}</SelectItem>
                  <SelectItem value="monthly">{t('recurring.frequency.monthly')}</SelectItem>
                  <SelectItem value="quarterly">{t('recurring.frequency.quarterly')}</SelectItem>
                  <SelectItem value="yearly">{t('recurring.frequency.yearly')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {showDayOfMonth && (
              <div className="space-y-2">
                <Label htmlFor="dayOfMonth">{t('recurring.modal.dayOfMonth')}</Label>
                <Input
                  id="dayOfMonth"
                  type="number"
                  min="1"
                  max="31"
                  {...register('dayOfMonth', {
                    min: { value: 1, message: '1-31' },
                    max: { value: 31, message: '1-31' },
                  })}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                {t('recurring.modal.startDate')} <span className="text-destructive">*</span>
              </Label>
              <DatePicker
                id="startDate"
                value={startDate}
                onChange={(value: string) => setValue('startDate', value, { shouldValidate: true })}
              />
              {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">{t('recurring.modal.endDate')}</Label>
              <DatePicker
                id="endDate"
                value={endDate}
                onChange={(value: string) => setValue('endDate', value || undefined)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoryId">{t('recurring.modal.category')}</Label>
            <Select
              value={categoryId || 'none'}
              onValueChange={(value) => setValue('categoryId', value === 'none' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('recurring.modal.selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('recurring.modal.noCategory')}</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon && <span className="mr-2">{cat.icon}</span>}
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t('recurring.modal.notes')}</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder={t('recurring.modal.notesPlaceholder')}
              rows={2}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting || createExpense.isPending || updateExpense.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || createExpense.isPending || updateExpense.isPending}
            >
              {isSubmitting || createExpense.isPending || updateExpense.isPending
                ? mode === 'create'
                  ? t('common.creating')
                  : t('common.updating')
                : mode === 'create'
                  ? t('common.create')
                  : t('common.update')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
