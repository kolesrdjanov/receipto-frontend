import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from 'i18next'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/glass/empty-state'
import { SoftCard, SectionLabel } from '@/components/groups/primitives'
import { GroupExpenseRow } from '@/components/groups/expense-row'
import { useReceipts, type Receipt } from '@/hooks/receipts/use-receipts'
import { useGroupStats, type GroupMember } from '@/hooks/groups/use-groups'
import { useExchangeRates } from '@/hooks/currencies/use-currency-converter'
import { convertAmount } from '@/lib/groups'
import { formatMoney } from '@/lib/utils'
import { Plus, Receipt as ReceiptIcon, Loader2 } from 'lucide-react'

interface GroupExpensesListProps {
  groupId: string
  members: GroupMember[]
  currentUserId?: string
  displayCurrency: string
  isArchived?: boolean
  onOpenExpense: (receipt: Receipt) => void
  onAdd: () => void
}

/** The Expenses tab: a "Group total" strip + expenses grouped by month into Glass cards. */
export function GroupExpensesList({
  groupId,
  members,
  currentUserId,
  displayCurrency,
  isArchived,
  onOpenExpense,
  onAdd,
}: GroupExpensesListProps) {
  const { t } = useTranslation()
  const [limit, setLimit] = useState(50)

  const { data: response, isLoading } = useReceipts({
    groupId,
    page: 1,
    limit,
    sortBy: 'receiptDate',
    sortOrder: 'DESC',
  })
  const { data: stats } = useGroupStats(groupId)
  const { data: exchangeRates } = useExchangeRates(displayCurrency)

  const receipts = response?.data ?? []
  const total = response?.meta?.total ?? receipts.length

  const groupTotal = useMemo(() => {
    if (!stats?.byCurrency) return 0
    return stats.byCurrency.reduce(
      (sum, c) => sum + convertAmount(c.totalAmount, c.currency, displayCurrency, exchangeRates),
      0,
    )
  }, [stats, displayCurrency, exchangeRates])

  const byMonth = useMemo(() => {
    const locale = i18n.language === 'sr' ? 'sr-Latn' : 'en-US'
    const groups: { label: string; items: Receipt[] }[] = []
    for (const r of receipts) {
      const label = r.receiptDate
        ? new Date(r.receiptDate).toLocaleDateString(locale, { month: 'long', year: 'numeric' })
        : t('groups.expense.undated')
      const last = groups[groups.length - 1]
      if (last && last.label === label) last.items.push(r)
      else groups.push({ label, items: [r] })
    }
    return groups
  }, [receipts, t])

  if (isLoading && receipts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-7 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3.5 shadow-glass-1">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-fg-faint">
            {t('groups.expense.groupTotal')}
          </div>
          <div className="t-num mt-1 text-[19px] font-extrabold tracking-[-0.02em]">
            {formatMoney(groupTotal, displayCurrency)}
          </div>
        </div>
        {!isArchived && (
          <Button type="button" variant="brand" size="sm" onClick={onAdd}>
            <Plus className="size-4" />
            {t('groups.expense.add')}
          </Button>
        )}
      </div>

      {receipts.length === 0 ? (
        <EmptyState
          compact
          icon={ReceiptIcon}
          title={t('groups.detail.noReceipts')}
          description={t('groups.detail.noReceiptsDescription')}
        />
      ) : (
        <>
          {byMonth.map((m) => (
            <SoftCard key={m.label}>
              <SectionLabel>{m.label}</SectionLabel>
              <div className="flex flex-col">
                {m.items.map((r) => (
                  <GroupExpenseRow
                    key={r.id}
                    receipt={r}
                    members={members}
                    currentUserId={currentUserId}
                    onClick={() => onOpenExpense(r)}
                  />
                ))}
              </div>
            </SoftCard>
          ))}
          {receipts.length < total && (
            <Button type="button" variant="outline" className="w-full" onClick={() => setLimit((l) => l + 50)}>
              {t('groups.activities.loadMore')}
            </Button>
          )}
        </>
      )}
    </div>
  )
}
