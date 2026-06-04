import { useEffect, useMemo } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { format, differenceInCalendarDays, startOfToday } from 'date-fns'
import { Check, Lock, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { GlassDialog } from '@/components/glass/glass-dialog'
import { CatTile } from '@/components/glass/primitives'
import { DueBadge } from '@/components/recurring-expenses/primitives'
import { relativeDueLabel, type RecurringStatus } from '@/components/recurring-expenses/status'
import { useMarkAsPaid, type UpcomingExpense } from '@/hooks/recurring-expenses/use-recurring-expenses'
import { toast } from 'sonner'

interface MarkPaidModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense: UpcomingExpense | null
}

const createMarkPaidSchema = (t: (key: string, opts?: Record<string, unknown>) => string) =>
  z.object({
    amount: z.coerce.number().positive(t('recurring.modal.amountMin')),
    // No dedicated markPaid paid-date error key exists — concise hardcoded message kept.
    paidDate: z.string().min(1, 'Paid date is required'),
    notes: z.string().optional(),
  })

type MarkPaidSchema = ReturnType<typeof createMarkPaidSchema>
type FormDataInput = z.input<MarkPaidSchema>
type FormData = z.output<MarkPaidSchema>

const FORM_ID = 'mark-paid-form'
const fieldLabel = 'mb-1.5 block text-[12px] font-semibold text-fg-2'

function statusFromDueDate(dueDate: string): RecurringStatus {
  const diff = differenceInCalendarDays(new Date(dueDate + 'T00:00:00'), startOfToday())
  if (diff < 0) return 'overdue'
  if (diff <= 7) return 'duesoon'
  return 'upcoming'
}

export function MarkPaidModal({ open, onOpenChange, expense }: MarkPaidModalProps) {
  const { t } = useTranslation()
  const markAsPaid = useMarkAsPaid()

  const schema = useMemo(() => createMarkPaidSchema(t), [t])
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormDataInput, unknown, FormData>({ resolver: zodResolver(schema) })

  register('paidDate')
  const paidDate = watch('paidDate')

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

  if (!expense) return null

  const currency = expense.currency || 'RSD'
  const status = statusFromDueDate(expense.dueDate)
  const category = expense.category ?? (expense.icon ? { icon: expense.icon, color: expense.color } : null)

  return (
    <GlassDialog
      open={open}
      onOpenChange={(o) => (o ? onOpenChange(true) : handleClose())}
      title={t('recurring.markPaid.title')}
      description={t('recurring.markPaid.recordPaymentFor', { name: expense.name })}
      desktopWidth={460}
      footer={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-xl sm:flex-none"
            onClick={handleClose}
            disabled={markAsPaid.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            className="flex-1 rounded-xl sm:ml-auto sm:flex-none"
            disabled={isSubmitting || markAsPaid.isPending}
          >
            <Check className="size-4" />
            {markAsPaid.isPending ? t('recurring.markPaid.paying') : t('recurring.markPaid.confirm')}
          </Button>
        </div>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Bill summary chip */}
        <div className="flex items-center gap-3 rounded-xl border border-border bg-bg-subtle/60 px-3.5 py-3">
          <CatTile category={category} size={38} radius={11} font={18} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold">{expense.name}</p>
            <p className="text-[12.5px] text-muted-foreground">
              {t('recurring.markPaid.dueDate')} {format(new Date(expense.dueDate + 'T00:00:00'), 'd MMM yyyy')}
            </p>
          </div>
          <DueBadge status={status} label={relativeDueLabel(status, expense.dueDate, t)} small />
        </div>

        <div>
          <Label htmlFor="amount" className={fieldLabel}>
            {t('recurring.markPaid.amountLabel', { currency })}
          </Label>
          <div className="relative">
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              disabled={expense.isFixed}
              className="disabled:bg-bg-subtle disabled:opacity-90"
              {...register('amount')}
            />
            {expense.isFixed && (
              <Lock className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-fg-faint" />
            )}
          </div>
          {!expense.isFixed && errors.amount && (
            <p className="mt-1.5 text-[12px] text-destructive">{errors.amount.message}</p>
          )}
          <p className="mt-1.5 text-[12px] text-muted-foreground">
            {expense.isFixed ? t('recurring.markPaid.fixedHint') : t('recurring.markPaid.variableHint')}
          </p>
        </div>

        <div>
          <Label className={fieldLabel}>{t('recurring.markPaid.paidDate')}</Label>
          <DatePicker
            value={paidDate}
            onChange={(value) => setValue('paidDate', value, { shouldValidate: true })}
          />
          {errors.paidDate && (
            <p className="mt-1.5 text-[12px] text-destructive">{errors.paidDate.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="notes" className={fieldLabel}>
            {t('recurring.markPaid.notes')}
          </Label>
          <Textarea
            id="notes"
            {...register('notes')}
            placeholder={t('recurring.markPaid.notesPlaceholder')}
            rows={2}
          />
        </div>

        <div className="flex items-start gap-2.5 rounded-xl bg-bg-subtle px-3.5 py-3">
          <Receipt className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <span className="text-[12.5px] leading-[1.45] text-muted-foreground">
            {t('recurring.markPaid.receiptNote')}
          </span>
        </div>
      </form>
    </GlassDialog>
  )
}
