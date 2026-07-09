import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Info, X, CalendarClock, ArrowDownWideNarrow } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/api'
import { AppLayout } from '@/components/layout/app-layout'
import { PageContent } from '@/components/layout/page-content'
import { PageToolbar } from '@/components/layout/page-toolbar'
import { PageTransition } from '@/components/ui/animated'
import { GlassDialog } from '@/components/glass/glass-dialog'
import { EmptyState, AddButton } from '@/components/glass/empty-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { RecurringExpenseModal } from '@/components/recurring-expenses/recurring-expense-modal'
import { MarkPaidModal } from '@/components/recurring-expenses/mark-paid-modal'
import { PaymentHistoryModal } from '@/components/recurring-expenses/payment-history'
import { RecurringList, RowActionList } from '@/components/recurring-expenses/primitives'
import { buildRecurringRows, deriveStatus } from '@/components/recurring-expenses/status'
import { useCategoryChartData } from '@/components/recurring-expenses/category-breakdown'
import { CategoryBars } from '@/components/recurring-expenses/category-bars'
import {
  useRecurringExpenses,
  useRecurringSummary,
  useDeleteRecurringExpense,
  useUpdateRecurringExpense,
  type RecurringExpense,
} from '@/hooks/recurring-expenses/use-recurring-expenses'
import { useSettingsStore } from '@/store/settings'
import { useExchangeRates } from '@/hooks/currencies/use-currency-converter'
import { useIsMobile } from '@/hooks/use-mobile'
import { useFabStore } from '@/store/fab'
import { cn, formatMoney } from '@/lib/utils'
import { StatusBadge } from '@/components/glass/primitives'

const INFO_KEY = 'recurring-info-dismissed'

export default function RecurringExpenses() {
  const { t } = useTranslation()
  const isMobile = useIsMobile(768)
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
  const [expenseToPay, setExpenseToPay] = useState<RecurringExpense | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyExpense, setHistoryExpense] = useState<RecurringExpense | null>(null)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [actionsExpense, setActionsExpense] = useState<RecurringExpense | null>(null)
  const [showInfoBanner, setShowInfoBanner] = useState(
    () => localStorage.getItem(INFO_KEY) !== 'true',
  )

  const dismissInfoBanner = () => {
    setShowInfoBanner(false)
    localStorage.setItem(INFO_KEY, 'true')
  }

  const handleAdd = useCallback(() => {
    setSelectedExpense(null)
    setModalMode('create')
    setIsModalOpen(true)
  }, [])

  // Take over the global mobile FAB so it opens the Add sheet directly.
  const setFab = useFabStore((s) => s.setFab)
  const clearFab = useFabStore((s) => s.clearFab)
  useEffect(() => {
    setFab(handleAdd)
    return () => clearFab()
  }, [setFab, clearFab, handleAdd])

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
      const errorMessage = getErrorMessage(error)
      toast.error(t('recurring.deleteError'), { description: errorMessage })
    }
  }

  const handleTogglePause = async (expense: RecurringExpense) => {
    try {
      await updateExpense.mutateAsync({ id: expense.id, data: { isPaused: !expense.isPaused } })
      toast.success(expense.isPaused ? t('recurring.resumed') : t('recurring.paused'))
    } catch {
      toast.error(t('recurring.updateError'))
    }
  }

  const handleMarkPaid = (expense: RecurringExpense) => {
    if (!expense.nextDueDate) return
    setExpenseToPay(expense)
    setMarkPaidOpen(true)
  }

  const handleHistory = (expense: RecurringExpense) => {
    setHistoryExpense(expense)
    setHistoryOpen(true)
  }

  const openActions = (expense: RecurringExpense) => {
    setActionsExpense(expense)
    setActionsOpen(true)
  }

  const convertAmount = useCallback(
    (amount: number, fromCurrency: string): number => {
      if (fromCurrency === displayCurrency || !exchangeRates) return amount
      const rate = exchangeRates[fromCurrency]
      if (!rate || rate === 0) return amount
      return amount / rate
    },
    [displayCurrency, exchangeRates],
  )

  const formatAmount = (amount: number, currency?: string) =>
    formatMoney(amount, currency || displayCurrency)

  const rows = buildRecurringRows(expenses)
  const overdueCount = rows.filter((r) => r.status === 'overdue').length
  const dueSoonCount = rows.filter((r) => r.status === 'duesoon').length
  const activeCount =
    summary?.totalActive ?? rows.filter((r) => r.status !== 'paused' && r.status !== 'ended').length

  const monthlyTotal =
    summary?.monthlyCommitment?.reduce((sum, item) => sum + convertAmount(item.amount, item.currency), 0) ?? 0
  const mixedCurrencies = (summary?.monthlyCommitment?.length ?? 0) > 1

  const categoryData = useCategoryChartData(
    expenses,
    convertAmount,
    t('recurring.categoryBreakdown.uncategorized'),
  )

  // Build the MarkPaid payload from the row (the modal expects an UpcomingExpense shape).
  const payTarget = expenseToPay?.nextDueDate
    ? {
        id: expenseToPay.id,
        name: expenseToPay.name,
        amount: expenseToPay.amount,
        currency: expenseToPay.currency,
        isFixed: expenseToPay.isFixed,
        icon: expenseToPay.icon,
        color: expenseToPay.color,
        category: expenseToPay.category,
        dueDate: expenseToPay.nextDueDate,
      }
    : null

  const sortAffordance = (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground">
      <ArrowDownWideNarrow className="size-[15px]" />
      {t('recurring.sortedByDueDate')}
    </span>
  )

  const infoBanner = showInfoBanner && (
    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-info-soft bg-info-soft/60 p-4">
      <Info className="mt-0.5 size-5 shrink-0 text-info" />
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold text-info-foreground">{t('recurring.info.title')}</p>
        <p className="mt-0.5 text-[12.5px] leading-snug text-info-foreground/80">
          {t('recurring.info.description')}
        </p>
      </div>
      <button
        type="button"
        onClick={dismissInfoBanner}
        aria-label={t('common.close')}
        className="shrink-0 text-info-foreground/60 transition-colors hover:text-info-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  )

  return (
    <AppLayout>
      <PageTransition>
        {/* Desktop sticky toolbar (breaks out of the page padding to sit flush) */}
        <PageToolbar
          className="md:mb-6"
          title={t('recurring.title')}
          subtitle={t('recurring.subtitle')}
          actions={<AddButton onClick={handleAdd} label={t('recurring.addRecurring')} />}
        />

        <PageContent>
        {/* Mobile page header */}
        <div className="mb-5 md:hidden">
          <h1 className="t-h1 text-[28px]">{t('nav.recurring', { defaultValue: 'Recurring' })}</h1>
          <p className="t-sm mt-1 text-muted-foreground">{t('recurring.mobileSubtitle')}</p>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            <div className="h-[120px] animate-pulse rounded-2xl border border-border bg-bg-subtle" />
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3.5 border-b border-hairline-soft px-4 py-3 last:border-0">
                  <div className="size-11 shrink-0 animate-pulse rounded-[14px] bg-bg-subtle" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-2/5 animate-pulse rounded bg-bg-subtle" />
                    <div className="h-3 w-1/4 animate-pulse rounded bg-bg-subtle" />
                  </div>
                  <div className="h-5 w-20 animate-pulse rounded-full bg-bg-subtle" />
                </div>
              ))}
            </div>
          </div>
        ) : !expenses || expenses.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title={t('recurring.empty.title')}
            description={t('recurring.empty.description')}
            action={<AddButton onClick={handleAdd} label={t('recurring.addRecurring')} />}
          />
        ) : (
          <>
            {/* Overview — desktop: slim summary line + demoted category card (Luma §5) */}
            <div className="mb-5 hidden items-end justify-between gap-4 px-1 md:flex">
              <div className="flex flex-col gap-1">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-[28px] font-semibold leading-none tracking-[-0.02em]">
                    {formatAmount(monthlyTotal)}
                  </span>
                  <span className="text-[13px] font-medium text-muted-foreground">
                    {t('recurring.summary.caption', { annual: formatAmount(monthlyTotal * 12) })}
                  </span>
                </div>
                {mixedCurrencies && (
                  <p className="text-[11px] text-fg-faint">{t('receipts.convertedDisclaimer')}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <StatusBadge tone="neutral">
                  {activeCount} {t('recurring.overview.active').toLowerCase()}
                </StatusBadge>
                {dueSoonCount > 0 && (
                  <StatusBadge tone="solid">
                    {dueSoonCount} {t('recurring.overview.dueSoon').toLowerCase()}
                  </StatusBadge>
                )}
                {overdueCount > 0 && (
                  <StatusBadge tone="danger">
                    <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
                    {overdueCount} {t('recurring.overview.overdue').toLowerCase()}
                  </StatusBadge>
                )}
              </div>
            </div>

            {categoryData.length > 0 && (
              <div className="mb-6 hidden rounded-2xl border border-border bg-card p-5 shadow-glass-1 md:block">
                <p className="t-xs mb-4 text-fg-faint">
                  {t('recurring.overview.spendingByCategory')}{' '}
                  <span className="font-normal normal-case tracking-normal text-muted-foreground">
                    {t('recurring.overview.monthlyEquivalent')}
                  </span>
                </p>
                <CategoryBars data={categoryData} formatAmount={(v) => formatAmount(v)} />
              </div>
            )}

            {/* Slim summary — mobile */}
            <div className="mb-5 rounded-2xl border border-border bg-card p-4 shadow-glass-1 md:hidden">
              <div className="flex flex-col gap-1">
                <span className="text-[12px] text-muted-foreground">{t('recurring.stats.monthlyCommitment')}</span>
                <span className="text-[26px] font-semibold leading-none">{formatAmount(monthlyTotal)}</span>
              </div>
              <div className="mt-3.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px]">
                <span className={cn('font-medium', overdueCount ? 'text-destructive' : 'text-muted-foreground')}>
                  <b>{overdueCount}</b> {t('recurring.overview.overdue').toLowerCase()}
                </span>
                <span className={cn('font-medium', dueSoonCount ? 'text-warning-foreground' : 'text-muted-foreground')}>
                  <b>{dueSoonCount}</b> {t('recurring.overview.dueSoon').toLowerCase()}
                </span>
                <span className="font-medium text-muted-foreground">
                  <b>{activeCount}</b> {t('recurring.overview.active').toLowerCase()}
                </span>
              </div>
            </div>

            {infoBanner}

            {/* List */}
            <div className="mb-3.5 flex items-center justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <span className="text-[14px] font-semibold">{t('recurring.allRecurring')}</span>
                <span className="text-[13px] text-muted-foreground">
                  · {t('recurring.expensesCount', { count: expenses.length })}
                </span>
              </div>
              {sortAffordance}
            </div>

            <RecurringList
              rows={rows}
              wide={!isMobile}
              onOpenActions={openActions}
              onMarkPaid={handleMarkPaid}
              onEdit={handleEdit}
              onHistory={handleHistory}
              onTogglePause={handleTogglePause}
              onDelete={handleDelete}
            />

            <p className="py-4 text-center text-[12px] text-fg-faint md:hidden">
              {t('recurring.recurringExpensesCount', { count: expenses.length })}
            </p>
          </>
        )}
        </PageContent>
      </PageTransition>

      {/* Add / Edit */}
      <RecurringExpenseModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        expense={selectedExpense}
        mode={modalMode}
        onRequestDelete={handleDelete}
      />

      {/* Mark as paid */}
      <MarkPaidModal open={markPaidOpen} onOpenChange={setMarkPaidOpen} expense={payTarget} />

      {/* Payment history */}
      <PaymentHistoryModal open={historyOpen} onOpenChange={setHistoryOpen} expense={historyExpense} />

      {/* Delete confirm (shared, responsive) */}
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

      {/* Mobile row action sheet */}
      {actionsExpense && (
        <GlassDialog
          open={actionsOpen}
          onOpenChange={setActionsOpen}
          title={actionsExpense.name}
          description={t(`recurring.frequency.${actionsExpense.frequency}`)}
          bodyClassName="py-3"
        >
          <RowActionList
            expense={actionsExpense}
            status={deriveStatus(actionsExpense)}
            onMarkPaid={(e) => {
              setActionsOpen(false)
              handleMarkPaid(e)
            }}
            onEdit={(e) => {
              setActionsOpen(false)
              handleEdit(e)
            }}
            onHistory={(e) => {
              setActionsOpen(false)
              handleHistory(e)
            }}
            onTogglePause={(e) => {
              setActionsOpen(false)
              handleTogglePause(e)
            }}
            onDelete={(e) => {
              setActionsOpen(false)
              handleDelete(e)
            }}
          />
        </GlassDialog>
      )}
    </AppLayout>
  )
}
