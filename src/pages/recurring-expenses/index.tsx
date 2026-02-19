import { Fragment, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AppLayout } from '@/components/layout/app-layout'
import { RecurringExpenseModal } from '@/components/recurring-expenses/recurring-expense-modal'
import { MarkPaidModal } from '@/components/recurring-expenses/mark-paid-modal'
import { PaymentHistory } from '@/components/recurring-expenses/payment-history'
import {
  useRecurringExpenses,
  useRecurringSummary,
  useDeleteRecurringExpense,
  useUpdateRecurringExpense,
  type RecurringExpense,
  type UpcomingExpense,
} from '@/hooks/recurring-expenses/use-recurring-expenses'
import { useSettingsStore } from '@/store/settings'
import { useExchangeRates } from '@/hooks/currencies/use-currency-converter'
import { formatDate } from '@/lib/date-utils'
import { toast } from 'sonner'
import {
  Plus,
  Pencil,
  Trash2,
  Pause,
  Play,
  CreditCard,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  Loader2,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Info,
  X,
} from 'lucide-react'
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/animated'

export default function RecurringExpenses() {
  const { t } = useTranslation()
  const { currency: preferredCurrency } = useSettingsStore()
  const displayCurrency = preferredCurrency || 'RSD'
  const { data: exchangeRates } = useExchangeRates(displayCurrency)

  const { data: expenses, isLoading } = useRecurringExpenses()
  const { data: summary } = useRecurringSummary()
  const deleteExpense = useDeleteRecurringExpense()
  const updateExpense = useUpdateRecurringExpense()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<RecurringExpense | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState<RecurringExpense | null>(null)
  const [markPaidOpen, setMarkPaidOpen] = useState(false)
  const [expenseToPay, setExpenseToPay] = useState<UpcomingExpense | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showInfoBanner, setShowInfoBanner] = useState(() => {
    return localStorage.getItem('recurring-info-dismissed') !== 'true'
  })

  const dismissInfoBanner = () => {
    setShowInfoBanner(false)
    localStorage.setItem('recurring-info-dismissed', 'true')
  }

  const handleAdd = () => {
    setSelectedExpense(null)
    setModalMode('create')
    setIsModalOpen(true)
  }

  const handleEdit = (expense: RecurringExpense) => {
    setSelectedExpense(expense)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleDelete = (expense: RecurringExpense) => {
    setExpenseToDelete(expense)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!expenseToDelete) return
    try {
      await deleteExpense.mutateAsync(expenseToDelete.id)
      toast.success(t('recurring.deleteSuccess'))
      setExpenseToDelete(null)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      toast.error(t('recurring.deleteError'), { description: errorMessage })
    }
  }

  const handleTogglePause = async (expense: RecurringExpense) => {
    try {
      await updateExpense.mutateAsync({
        id: expense.id,
        data: { isPaused: !expense.isPaused },
      })
      toast.success(expense.isPaused ? t('recurring.resumed') : t('recurring.paused'))
    } catch (error) {
      toast.error(t('recurring.updateError'))
    }
  }

  const handleMarkPaid = (expense: RecurringExpense) => {
    if (!expense.nextDueDate) return
    setExpenseToPay({
      id: expense.id,
      name: expense.name,
      amount: expense.amount,
      currency: expense.currency,
      isFixed: expense.isFixed,
      icon: expense.icon,
      color: expense.color,
      category: expense.category,
      dueDate: expense.nextDueDate,
    })
    setMarkPaidOpen(true)
  }

  const convertAmount = (amount: number, fromCurrency: string): number => {
    if (fromCurrency === displayCurrency || !exchangeRates) return amount
    const rate = exchangeRates[fromCurrency]
    if (!rate || rate === 0) return amount
    return amount / rate
  }

  const formatAmount = (amount: number, currency?: string) =>
    new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: currency || displayCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)

  const getStatusBadge = (expense: RecurringExpense) => {
    if (expense.isPaused) {
      return <Badge variant="secondary">{t('recurring.status.paused')}</Badge>
    }
    if (expense.endDate && new Date(expense.endDate) < new Date()) {
      return <Badge variant="outline">{t('recurring.status.ended')}</Badge>
    }
    return <Badge variant="default">{t('recurring.status.active')}</Badge>
  }

  const monthlyTotal = summary?.monthlyCommitment?.reduce((sum, item) => {
    return sum + convertAmount(item.amount, item.currency)
  }, 0) ?? 0

  return (
    <AppLayout>
      <PageTransition>
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between sm:mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-1 sm:text-3xl sm:mb-2">
              {t('recurring.title')}
            </h2>
            <p className="text-sm text-muted-foreground sm:text-base">
              {t('recurring.subtitle')}
            </p>
          </div>
          <Button onClick={handleAdd} className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            {t('recurring.addExpense')}
          </Button>
        </div>

        {/* Stats Cards */}
        <StaggerContainer className="grid gap-4 grid-cols-1 sm:grid-cols-3 mb-6">
          <StaggerItem>
            <Card className="stat-card-gradient">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t('recurring.stats.monthlyCommitment')}</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatAmount(monthlyTotal)}</p>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card className="stat-card-gradient">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t('recurring.stats.paidThisMonth')}</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{summary?.paidThisMonth ?? 0}</p>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card className="stat-card-gradient">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t('recurring.stats.pendingThisMonth')}</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{summary?.pendingThisMonth ?? 0}</p>
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>

        {/* Info Banner */}
        {showInfoBanner && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
            <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-200 mb-1">
                {t('recurring.info.title')}
              </p>
              <p className="text-blue-800/80 dark:text-blue-300/80">
                {t('recurring.info.description')}
              </p>
            </div>
            <button
              onClick={dismissInfoBanner}
              className="shrink-0 text-blue-400 hover:text-blue-600 dark:hover:text-blue-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ) : !expenses || expenses.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <CalendarClock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('recurring.empty.title')}</h3>
              <p className="text-sm text-muted-foreground mb-4">{t('recurring.empty.description')}</p>
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4" />
                {t('recurring.addExpense')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>{t('recurring.table.name')}</TableHead>
                  <TableHead className="text-right">{t('recurring.table.amount')}</TableHead>
                  <TableHead>{t('recurring.table.frequency')}</TableHead>
                  <TableHead>{t('recurring.table.nextDue')}</TableHead>
                  <TableHead>{t('recurring.table.status')}</TableHead>
                  <TableHead className="text-right">{t('recurring.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <Fragment key={expense.id}>
                    <TableRow className="group">
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setExpandedId(expandedId === expense.id ? null : expense.id)}
                        >
                          {expandedId === expense.id ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {expense.category?.icon && (
                            <span className="text-lg">{expense.category.icon}</span>
                          )}
                          <div>
                            <span className="font-medium">{expense.name}</span>
                            {expense.category && (
                              <p className="text-xs text-muted-foreground">{expense.category.name}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatAmount(expense.amount, expense.currency)}
                        {!expense.isFixed && (
                          <span className="text-xs text-muted-foreground ml-1">~</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{t(`recurring.frequency.${expense.frequency}`)}</Badge>
                      </TableCell>
                      <TableCell>
                        {expense.nextDueDate ? (
                          <span className="text-sm">{formatDate(expense.nextDueDate)}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(expense)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {expense.nextDueDate && !expense.isPaused && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMarkPaid(expense)}
                              title={t('recurring.actions.pay')}
                            >
                              <CreditCard className="w-4 h-4 text-primary" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleTogglePause(expense)}
                            title={expense.isPaused ? t('recurring.actions.resume') : t('recurring.actions.pause')}
                          >
                            {expense.isPaused ? (
                              <Play className="w-4 h-4" />
                            ) : (
                              <Pause className="w-4 h-4" />
                            )}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(expense)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(expense)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedId === expense.id && (
                      <TableRow key={`${expense.id}-history`}>
                        <TableCell colSpan={7} className="bg-muted/30 p-4">
                          <h4 className="text-sm font-semibold mb-2">{t('recurring.payments.title')}</h4>
                          <PaymentHistory expenseId={expense.id} currency={expense.currency} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <RecurringExpenseModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          expense={selectedExpense}
          mode={modalMode}
        />

        <MarkPaidModal
          open={markPaidOpen}
          onOpenChange={setMarkPaidOpen}
          expense={expenseToPay}
        />

        <ConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          onConfirm={confirmDelete}
          title={t('recurring.deleteTitle')}
          description={t('recurring.deleteConfirm', { name: expenseToDelete?.name || '' })}
          confirmText={t('common.delete')}
          cancelText={t('common.cancel')}
          variant="destructive"
          isLoading={deleteExpense.isPending}
        />
      </PageTransition>
    </AppLayout>
  )
}
