import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Route,
  Users,
  PartyPopper,
  HandCoins,
  type LucideIcon,
} from 'lucide-react'
import { cn, formatMoney } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { SettleRow, MemberBalanceRow } from '@/components/groups/primitives'
import { useGroupBalanceModel } from '@/hooks/groups/use-group-balance-model'
import type { BalanceState, ComputedSettlement } from '@/lib/groups'

interface GroupHeroProps {
  groupId: string
  displayCurrency: string
  currentUserId?: string
  isArchived?: boolean
  onSettle: (s: ComputedSettlement) => void
}

// Luma monochrome balances: you're-owed reads as strong foreground (NOT green), you-owe is the
// only tinted state (danger), settled is muted-neutral.
const STATE: Record<BalanceState, { glyph: LucideIcon; icon: string; amount: string; labelKey: string }> = {
  owed: {
    glyph: ArrowDownLeft,
    icon: 'bg-bg-subtle text-foreground',
    amount: 'text-foreground',
    labelKey: 'groups.headline.owed',
  },
  owe: {
    glyph: ArrowUpRight,
    icon: 'bg-destructive-soft text-[color:var(--destructive-foreground-on-soft)]',
    amount: 'text-[color:var(--destructive-foreground-on-soft)]',
    labelKey: 'groups.headline.owe',
  },
  settled: {
    glyph: Check,
    icon: 'bg-bg-subtle text-muted-foreground',
    amount: 'text-foreground',
    labelKey: 'groups.headline.settled',
  },
}

/**
 * The balance + settle HERO — the single calm surface pinned above the feed on every group
 * detail (mobile column + desktop sticky aside). One card: a state-tinted balance headline with
 * an inline "Settle up" shortcut, the minimal-transaction settle plan, and every member's
 * balance — always visible, no expander.
 */
export function GroupHero({
  groupId,
  displayCurrency,
  currentUserId,
  isArchived,
  onSettle,
}: GroupHeroProps) {
  const { t } = useTranslation()
  const { convertedBalances, settlements, myBalance, myState } = useGroupBalanceModel(groupId, displayCurrency)

  const cfg = STATE[myState]
  const Glyph = cfg.glyph

  // Your rows first, then other-to-other rows (display-only).
  const ordered = useMemo(() => {
    const mine = settlements.filter((s) => s.from.userId === currentUserId || s.to.userId === currentUserId)
    const others = settlements.filter((s) => s.from.userId !== currentUserId && s.to.userId !== currentUserId)
    return [...mine, ...others]
  }, [settlements, currentUserId])
  const myDebt = settlements.find((s) => s.from.userId === currentUserId)

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-glass-1">
      {/* Headline */}
      <div className="flex items-center gap-3.5 p-[18px]">
        <span className={cn('grid size-12 shrink-0 place-items-center rounded-full', cfg.icon)}>
          <Glyph className="size-[22px]" strokeWidth={2.4} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
            {t(cfg.labelKey)}
          </div>
          {myState === 'settled' ? (
            <div className="mt-1.5 text-[19px] font-extrabold tracking-[-0.02em] text-foreground">
              {t('groups.headline.settledLong')}
            </div>
          ) : (
            <div className={cn('mt-1.5 text-[28px] font-extrabold tracking-[-0.025em]', cfg.amount)}>
              {formatMoney(Math.abs(myBalance?.balance ?? 0), displayCurrency)}
            </div>
          )}
        </div>
        {myDebt && !isArchived && (
          <Button type="button" variant="brand" size="sm" className="ml-auto shrink-0" onClick={() => onSettle(myDebt)}>
            <HandCoins className="size-4" />
            {t('groups.settle.settleUp')}
          </Button>
        )}
      </div>

      {/* Simplified settle-up plan */}
      <div className="border-t border-hairline-soft p-3.5">
        {ordered.length > 0 ? (
          <>
            <div className="mb-3 flex items-center gap-2.5">
              <span className="grid size-[30px] shrink-0 place-items-center rounded-[10px] bg-bg-subtle">
                <Route className="size-[15px] text-foreground" />
              </span>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-bold">{t('groups.simplify.title')}</div>
                <div className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                  {t('groups.simplify.clears', { count: ordered.length })}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {ordered.map((s, i) => (
                <SettleRow
                  key={`${s.from.userId}-${s.to.userId}-${i}`}
                  settlement={s}
                  currency={displayCurrency}
                  currentUserId={currentUserId}
                  onSettle={isArchived ? undefined : onSettle}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 rounded-[14px] bg-bg-subtle px-3.5 py-3 text-[13.5px] font-semibold text-foreground">
            <PartyPopper className="size-[17px] shrink-0" />
            {t('groups.overview.allSquared')}
          </div>
        )}
      </div>

      {/* Balances — every member, always shown (no expander) */}
      {convertedBalances.length > 0 && (
        <div className="border-t border-hairline-soft px-4 pb-3.5 pt-3">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
            <Users className="size-[13px]" />
            {t('groups.hero.balances')}
          </div>
          <div className="flex flex-col gap-2">
            {convertedBalances.map((b) => (
              <MemberBalanceRow key={b.userId} balance={b} currency={displayCurrency} currentUserId={currentUserId} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
