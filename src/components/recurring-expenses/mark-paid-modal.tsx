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
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { useMarkAsPaid, type UpcomingExpense } from '@/hooks/recurring-expenses/use-recurring-expenses'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface MarkPaidModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense: UpcomingExpense | null
}

interface FormData {
  amount: number
  paidDate: string
  notes: string
}

export function MarkPaidModal({ open, onOpenChange, expense }: MarkPaidModalProps) {
  const { t } = useTranslation()
  const markAsPaid = useMarkAsPaid()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<FormData>()

  // Register paidDate so it's included in form submission
  register('paidDate')
  const paidDate = watch('paidDate')

  // Reset form when modal opens with new expense
  useEffect(() => {
    if (open && expense) {
      reset({
        amount: expense.amount,
        paidDate: format(new Date(), 'yyyy-MM-dd'),
        notes: '',
      })
    }
  }, [open, expense, reset])

  const onSubmit = async (data: FormData) => {
    if (!expense) return

    try {
      await markAsPaid.mutateAsync({
        id: expense.id,
        data: {
          amount: expense.isFixed ? undefined : Number(data.amount),
          paidDate: data.paidDate,
          dueDate: expense.dueDate,
          notes: data.notes || undefined,
        },
      })
      toast.success(t('recurring.markPaid.success'))
      onOpenChange(false)
      reset()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      toast.error(t('recurring.markPaid.error'), { description: errorMessage })
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    reset()
  }

  const currencySymbol = expense?.currency || 'RSD'

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{t('recurring.markPaid.title')}</DialogTitle>
          <DialogDescription>
            {expense?.name} — {t('recurring.markPaid.dueDate')}: {expense?.dueDate}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">{t('recurring.markPaid.amount')} ({currencySymbol})</Label>
            {expense?.isFixed ? (
              <Input
                id="amount"
                type="number"
                value={expense.amount}
                disabled
                className="bg-muted"
              />
            ) : (
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                {...register('amount', { min: 0.01 })}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('recurring.markPaid.paidDate')}</Label>
            <DatePicker
              value={paidDate}
              onChange={(value) => setValue('paidDate', value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t('recurring.markPaid.notes')}</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder={t('recurring.markPaid.notesPlaceholder')}
              rows={2}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose} disabled={markAsPaid.isPending}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting || markAsPaid.isPending}>
              {markAsPaid.isPending ? t('recurring.markPaid.paying') : t('recurring.markPaid.confirm')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
