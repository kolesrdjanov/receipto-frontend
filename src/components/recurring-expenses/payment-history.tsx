import { useTranslation } from 'react-i18next'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { usePaymentHistory } from '@/hooks/recurring-expenses/use-recurring-expenses'
import { formatDate } from '@/lib/date-utils'
import { Loader2 } from 'lucide-react'

interface PaymentHistoryProps {
  expenseId: string
  currency: string
}

export function PaymentHistory({ expenseId, currency }: PaymentHistoryProps) {
  const { t } = useTranslation()
  const { data: payments, isLoading } = usePaymentHistory(expenseId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!payments || payments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        {t('recurring.payments.noPayments')}
      </p>
    )
  }

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('recurring.payments.dueDate')}</TableHead>
          <TableHead>{t('recurring.payments.paidDate')}</TableHead>
          <TableHead className="text-right">{t('recurring.payments.amount')}</TableHead>
          <TableHead>{t('recurring.payments.notes')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell className="text-sm">{formatDate(payment.dueDate)}</TableCell>
            <TableCell className="text-sm">{formatDate(payment.paidDate)}</TableCell>
            <TableCell className="text-right font-medium">{formatAmount(payment.amount)}</TableCell>
            <TableCell className="text-sm text-muted-foreground truncate max-w-[150px]">
              {payment.notes || '-'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
