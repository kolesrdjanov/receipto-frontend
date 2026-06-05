import { useTranslation } from 'react-i18next'
import { Clock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassDialog } from '@/components/glass/glass-dialog'
import { Amount } from '@/components/glass/primitives'
import {
  usePaymentHistory,
  type RecurringExpense,
} from '@/hooks/recurring-expenses/use-recurring-expenses'
import { formatDate } from '@/lib/date-utils'

interface PaymentHistoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense: RecurringExpense | null
}

/** Payment history — a glass sheet (mobile) / modal (desktop) listing recorded payments. */
export function PaymentHistoryModal({ open, onOpenChange, expense }: PaymentHistoryModalProps) {
  const { t } = useTranslation()
  const { data: payments, isLoading } = usePaymentHistory(open && expense ? expense.id : '')

  if (!expense) return null
  const currency = expense.currency || 'RSD'

  return (
    <GlassDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('recurring.payments.title')}
      description={expense.name}
      desktopWidth={480}
      actions={{
        secondary: (
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.close')}
          </Button>
        ),
      }}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : !payments || payments.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-bg-subtle text-muted-foreground">
            <Clock className="size-[22px]" />
          </span>
          <span className="text-[13px] text-muted-foreground">{t('recurring.payments.noPayments')}</span>
        </div>
      ) : (
        <div className="[&>div+div]:border-t [&>div+div]:border-hairline-soft">
          {payments.map((p) => {
            const late = p.paidDate !== p.dueDate
            return (
              <div key={p.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-medium">{formatDate(p.paidDate)}</span>
                    {late && (
                      <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-medium text-warning-foreground">
                        {t('recurring.payments.duePrefix', { date: formatDate(p.dueDate) })}
                      </span>
                    )}
                  </div>
                  {p.notes && (
                    <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{p.notes}</p>
                  )}
                </div>
                <Amount value={p.amount} currency={currency} size={14.5} weight={700} />
              </div>
            )
          })}
        </div>
      )}
    </GlassDialog>
  )
}
