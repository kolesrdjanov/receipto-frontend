import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { BalanceHeadline, SettleRow, SoftCard, SectionLabel } from '@/components/groups/primitives'
import { GroupExpenseRow } from '@/components/groups/expense-row'
import { useGroupBalanceModel } from '@/hooks/groups/use-group-balance-model'
import { useReceipts, type Receipt } from '@/hooks/receipts/use-receipts'
import type { GroupMember } from '@/hooks/groups/use-groups'
import type { ComputedSettlement } from '@/lib/groups'
import { Plus, HandCoins, PartyPopper } from 'lucide-react'

interface GroupOverviewProps {
  groupId: string
  members: GroupMember[]
  displayCurrency: string
  currentUserId?: string
  isArchived: boolean
  onAdd: () => void
  onGoBalances: () => void
  onSeeAllExpenses: () => void
  onOpenExpense: (r: Receipt) => void
  onSettle: (s: ComputedSettlement) => void
}

/** Mobile Overview tab — balance hero, primary actions, your settle path, recent expenses. */
export function GroupOverview({
  groupId,
  members,
  displayCurrency,
  currentUserId,
  isArchived,
  onAdd,
  onGoBalances,
  onSeeAllExpenses,
  onOpenExpense,
  onSettle,
}: GroupOverviewProps) {
  const { t } = useTranslation()
  const { settlements, myBalance, myState } = useGroupBalanceModel(groupId, displayCurrency)
  const { data: response } = useReceipts({
    groupId,
    page: 1,
    limit: 3,
    sortBy: 'receiptDate',
    sortOrder: 'DESC',
  })
  const recent = response?.data ?? []
  const mine = settlements.filter((s) => s.from.userId === currentUserId || s.to.userId === currentUserId)

  return (
    <div className="flex flex-col gap-3.5">
      <BalanceHeadline state={myState} amount={myBalance?.balance ?? 0} currency={displayCurrency} />

      {!isArchived && (
        <div className="flex gap-2.5">
          <Button type="button" variant="brand" className="flex-1" onClick={onAdd}>
            <Plus className="size-[18px] " />
            {t('groups.expense.addExpense')}
          </Button>
          <Button type="button" variant="glass" className="flex-1" onClick={onGoBalances}>
            <HandCoins className="size-[18px]" />
            {t('groups.settle.settleUp')}
          </Button>
        </div>
      )}

      {mine.length > 0 ? (
        <SoftCard>
          <SectionLabel
            action={
              <Button type="button" variant="link" className="h-auto p-0 text-[12px]" onClick={onGoBalances}>
                {t('groups.seeAll')}
              </Button>
            }
          >
            {t('groups.overview.yourSettlePath')}
          </SectionLabel>
          <div className="flex flex-col gap-2">
            {mine.slice(0, 2).map((s, i) => (
              <SettleRow
                key={`${s.from.userId}-${s.to.userId}-${i}`}
                settlement={s}
                currency={displayCurrency}
                currentUserId={currentUserId}
                onSettle={onSettle}
              />
            ))}
          </div>
        </SoftCard>
      ) : (
        myState === 'settled' && (
          <div className="flex items-center gap-2 rounded-[14px] bg-success-soft px-4 py-3.5 text-[13.5px] font-semibold text-success-foreground">
            <PartyPopper className="size-[18px]" />
            {t('groups.overview.allSquared')}
          </div>
        )
      )}

      {recent.length > 0 && (
        <SoftCard>
          <SectionLabel
            action={
              <Button type="button" variant="link" className="h-auto p-0 text-[12px]" onClick={onSeeAllExpenses}>
                {t('groups.seeAll')}
              </Button>
            }
          >
            {t('groups.overview.recentExpenses')}
          </SectionLabel>
          <div className="flex flex-col">
            {recent.map((r) => (
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
      )}
    </div>
  )
}
