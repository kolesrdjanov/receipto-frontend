import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  BalanceHeadline,
  SettleRow,
  MemberBalanceRow,
  SoftCard,
  SectionLabel,
} from '@/components/groups/primitives'
import { useGroupBalanceModel } from '@/hooks/groups/use-group-balance-model'
import type { ComputedSettlement } from '@/lib/groups'
import { Route, Sparkles, History, ChevronRight, Check } from 'lucide-react'

interface GroupBalancePanelProps {
  groupId: string
  displayCurrency: string
  currentUserId?: string
  settlementsCount: number
  compactHeadline?: boolean
  onSettle: (s: ComputedSettlement) => void
  onOpenHistory: () => void
}

/** Balance hero + minimal settle-up plan + member balances + history link. Mobile Balances tab
 *  AND the persistent desktop rail render this (one source of truth). */
export function GroupBalancePanel({
  groupId,
  displayCurrency,
  currentUserId,
  settlementsCount,
  compactHeadline,
  onSettle,
  onOpenHistory,
}: GroupBalancePanelProps) {
  const { t } = useTranslation()
  const { convertedBalances, settlements, myBalance, myState } = useGroupBalanceModel(groupId, displayCurrency)

  return (
    <div className="flex flex-col gap-3.5">
      <BalanceHeadline
        state={myState}
        amount={myBalance?.balance ?? 0}
        currency={displayCurrency}
        compact={compactHeadline}
      />

      {/* Simplified settle-up */}
      <SoftCard>
        <div className="mb-3 flex items-center gap-2.5">
          <span className="grid size-[34px] shrink-0 place-items-center rounded-xl bg-primary-soft">
            <Route className="size-4 text-primary" />
          </span>
          <div>
            <div className="text-[14.5px] font-bold">{t('groups.simplify.title')}</div>
            <div className="mt-0.5 text-[12px] text-muted-foreground">
              {settlements.length === 0
                ? t('groups.simplify.nothing')
                : t('groups.simplify.clears', { count: settlements.length })}
            </div>
          </div>
        </div>

        {settlements.length === 0 ? (
          <div className="flex items-center gap-2 rounded-xl bg-success-soft px-4 py-3.5 text-[13.5px] font-semibold text-success-foreground">
            <Check className="size-[17px]" />
            {t('groups.simplify.allSettled')}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {settlements.map((s, i) => (
              <SettleRow
                key={`${s.from.userId}-${s.to.userId}-${i}`}
                settlement={s}
                currency={displayCurrency}
                currentUserId={currentUserId}
                onSettle={onSettle}
              />
            ))}
          </div>
        )}

        {settlements.length > 1 && (
          <div className="mt-3 flex items-center gap-1.5 text-[11.5px] text-fg-faint">
            <Sparkles className="size-3" />
            {t('groups.simplify.note')}
          </div>
        )}
      </SoftCard>

      {/* Member balances */}
      {convertedBalances.length > 0 && (
        <SoftCard>
          <SectionLabel>{t('groups.balances.memberBalances')}</SectionLabel>
          <div className="flex flex-col gap-2">
            {convertedBalances.map((b) => (
              <MemberBalanceRow key={b.userId} balance={b} currency={displayCurrency} currentUserId={currentUserId} />
            ))}
          </div>
        </SoftCard>
      )}

      {/* Settlement history link */}
      <Button
        type="button"
        variant="outline"
        onClick={onOpenHistory}
        className="h-auto w-full justify-start gap-3 rounded-2xl bg-card px-4 py-[15px] text-[14px] font-semibold shadow-glass-1"
      >
        <History className="size-[17px] text-muted-foreground" />
        <span className="flex-1 text-left">{t('groups.settlements.history')}</span>
        <span className="rounded-full bg-bg-subtle px-2 py-0.5 text-[12px] font-bold text-muted-foreground">
          {settlementsCount}
        </span>
        <ChevronRight className="size-4 text-fg-faint" />
      </Button>
    </div>
  )
}
