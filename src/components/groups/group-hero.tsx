import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Route,
  Users,
  History,
  ChevronDown,
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
  settlementsCount: number
  isArchived?: boolean
  onSettle: (s: ComputedSettlement) => void
  onOpenHistory: () => void
}

const STATE: Record<BalanceState, { glyph: LucideIcon; icon: string; amount: string; labelKey: string }> = {
  owed: {
    glyph: ArrowDownLeft,
    icon: 'bg-success-soft text-success-foreground',
    amount: 'text-success-foreground',
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
    icon: 'bg-success-soft text-success',
    amount: 'text-foreground',
    labelKey: 'groups.headline.settled',
  },
}

/**
 * The balance + settle HERO — the single calm surface pinned above the tabs on every group
 * detail (mobile column + desktop sticky aside). One card: a state-tinted balance headline with
 * an inline "Settle up" shortcut, the minimal-transaction settle plan, and a footer that toggles
 * an inline every-member-balances expander / opens the settlement-history sheet.
 */
export function GroupHero({
  groupId,
  displayCurrency,
  currentUserId,
  settlementsCount,
  isArchived,
  onSettle,
  onOpenHistory,
}: GroupHeroProps) {
  const { t } = useTranslation()
  const { convertedBalances, settlements, myBalance, myState } = useGroupBalanceModel(groupId, displayCurrency)
  const [showBalances, setShowBalances] = useState(false)

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
    <div className="overflow-hidden rounded-[22px] border border-border bg-card shadow-glass-1">
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
            <div className={cn('t-num mt-1.5 text-[28px] font-extrabold tracking-[-0.025em]', cfg.amount)}>
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
              <span className="grid size-[30px] shrink-0 place-items-center rounded-[10px] bg-primary-soft">
                <Route className="size-[15px] text-primary" />
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
          <div className="flex items-center gap-2 rounded-[14px] bg-success-soft px-3.5 py-3 text-[13.5px] font-semibold text-success-foreground">
            <PartyPopper className="size-[17px] shrink-0" />
            {t('groups.overview.allSquared')}
          </div>
        )}
      </div>

      {/* Footer — Balances expander + History link */}
      <div className="flex border-t border-hairline-soft">
        {/* eslint-disable-next-line no-restricted-syntax -- raw-button-ok: bespoke hero footer toggle (inline balances expander) */}
        <button
          type="button"
          aria-expanded={showBalances}
          onClick={() => setShowBalances((v) => !v)}
          className="flex h-[46px] flex-1 items-center justify-center gap-1.5 text-[13px] font-semibold text-fg-2 transition-colors hover:bg-bg-subtle"
        >
          <Users className="size-[15px] text-muted-foreground" />
          {t('groups.hero.balances')}
          <ChevronDown className={cn('size-[15px] text-fg-faint transition-transform', showBalances && 'rotate-180')} />
        </button>
        {/* eslint-disable-next-line no-restricted-syntax -- raw-button-ok: bespoke hero footer link (opens history sheet) */}
        <button
          type="button"
          onClick={onOpenHistory}
          className="flex h-[46px] flex-1 items-center justify-center gap-1.5 border-l border-hairline-soft text-[13px] font-semibold text-fg-2 transition-colors hover:bg-bg-subtle"
        >
          <History className="size-[15px] text-muted-foreground" />
          {t('groups.hero.history')}
          {settlementsCount > 0 && (
            <span className="rounded-full bg-bg-subtle px-1.5 py-px text-[10.5px] font-bold text-fg-faint">
              {settlementsCount}
            </span>
          )}
        </button>
      </div>

      {/* Inline every-member-balances expander */}
      {showBalances && convertedBalances.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-hairline-soft px-4 pb-3.5 pt-2">
          {convertedBalances.map((b) => (
            <MemberBalanceRow key={b.userId} balance={b} currency={displayCurrency} currentUserId={currentUserId} />
          ))}
        </div>
      )}
    </div>
  )
}
