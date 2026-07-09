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
import { Receipt as ReceiptIcon, Loader2 } from 'lucide-react'

interface GroupExpensesListProps {
  groupId: string
  members: GroupMember[]
  currentUserId?: string
  displayCurrency: string
  onOpenExpense: (receipt: Receipt) => void
}

/** The Expenses tab: a slim "N expenses · group total" lead, then expenses grouped by month
 *  into Glass cards. Adding lives on the mobile FAB / desktop toolbar. */
export function GroupExpensesList({
  groupId,
  members,
  currentUserId,
  displayCurrency,
  onOpenExpense,
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

  const receipts = useMemo(() => response?.data ?? [], [response])
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
      {receipts.length === 0 ? (
        <EmptyState
          compact
          icon={ReceiptIcon}
          title={t('groups.detail.noReceipts')}
          description={t('groups.detail.noReceiptsDescription')}
        />
      ) : (
        <>
          <div className="flex items-baseline justify-between gap-2.5 px-0.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-fg-faint">
              {t('groups.expense.count', { count: total })}
            </span>
            <span className="text-[18px] font-extrabold tracking-[-0.02em]">
              {formatMoney(groupTotal, displayCurrency)}
            </span>
          </div>
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
              {t('groups.expense.loadMore')}
            </Button>
          )}
        </>
      )}
    </div>
  )
}
