import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Check } from 'lucide-react'
import { cn, formatMoney } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  memberFirstName,
  memberName,
  BALANCE_THRESHOLD,
  type BalanceState,
  type ConvertedBalance,
  type ComputedSettlement,
} from '@/lib/groups'

/**
 * Group-spending Glass primitives. These carry the feature's own visual vocabulary
 * (balance headline, settle rows, member-hue avatars) and own the balance semantics
 * (owed = green, owe = red, settled = neutral). Shared by the Hub, the group tabs and
 * the desktop rail so they can't drift.
 */

type AvatarUser = {
  id?: string
  firstName?: string
  lastName?: string
  email?: string
  profileImageUrl?: string
} | null | undefined

const HUES = [165, 190, 210, 290, 345]

function hueFor(key: string): number {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return HUES[h % HUES.length]
}

function initialsOf(user: AvatarUser): string {
  const a = user?.firstName?.trim()[0]
  const b = user?.lastName?.trim()[0]
  if (a && b) return (a + b).toUpperCase()
  return (a || b || user?.email?.trim()[0] || '?').toUpperCase()
}

/** Member avatar with a stable per-member brand-hue gradient (initials), the user's photo when
 *  present, or the cyan→violet "you" gradient for the signed-in user (matches the app avatar). */
export function GMemberAvatar({
  user,
  self = false,
  size = 36,
  ring = false,
}: {
  user: AvatarUser
  self?: boolean
  size?: number
  ring?: boolean
}) {
  const ringShadow = ring ? '0 0 0 2px var(--bg-elev)' : undefined
  if (user?.profileImageUrl) {
    return (
      <span
        className="relative inline-block shrink-0 overflow-hidden rounded-full"
        style={{ width: size, height: size, boxShadow: ringShadow }}
      >
        <img
          src={user.profileImageUrl}
          alt={initialsOf(user)}
          className="h-full w-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </span>
    )
  }
  const key = user?.id || user?.email || initialsOf(user)
  const bg = self
    ? 'linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))'
    : `linear-gradient(135deg, oklch(0.74 0.13 ${hueFor(key)}), oklch(0.62 0.16 ${hueFor(key)}))`
  return (
    <span
      className="relative grid shrink-0 place-items-center rounded-full font-bold text-white"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.36),
        background: bg,
        boxShadow: ringShadow,
        fontFamily: 'var(--font-display)',
        letterSpacing: '-0.02em',
      }}
    >
      {initialsOf(user)}
    </span>
  )
}

/** Overlapping avatar row, capped at `max` with a "+N" pill. */
export function GAvatarStack({
  members,
  max = 4,
  size = 28,
  currentUserId,
}: {
  members: AvatarUser[]
  max?: number
  size?: number
  currentUserId?: string
}) {
  const shown = members.slice(0, max)
  const extra = members.length - shown.length
  return (
    <div className="flex" style={{ paddingLeft: size * 0.28 }}>
      {shown.map((m, i) => (
        <span key={m?.id || i} style={{ marginLeft: -size * 0.28 }}>
          <GMemberAvatar user={m} self={!!m?.id && m.id === currentUserId} size={size} ring />
        </span>
      ))}
      {extra > 0 && (
        <span
          className="grid place-items-center rounded-full border border-border bg-bg-subtle font-bold text-fg-2"
          style={{
            marginLeft: -size * 0.28,
            width: size,
            height: size,
            fontSize: Math.round(size * 0.34),
            boxShadow: '0 0 0 2px var(--bg-elev)',
          }}
        >
          +{extra}
        </span>
      )}
    </div>
  )
}

/** Tabular money text; `signed` colours + prefixes by sign (green +, red −, muted 0). */
export function Money({
  value,
  currency = 'RSD',
  signed = false,
  className,
  size,
  weight = 700,
}: {
  value: number
  currency?: string
  signed?: boolean
  className?: string
  size?: number
  weight?: number
}) {
  const pos = value > 0.5
  const neg = value < -0.5
  // Luma monochrome: positive (you're owed / get back) reads as strong foreground, only a
  // negative balance (you owe) is tinted danger; zero is muted.
  const color = signed
    ? pos
      ? 'text-foreground'
      : neg
        ? 'text-destructive'
        : 'text-muted-foreground'
    : 'text-foreground'
  return (
    <span className={cn('t-num', color, className)} style={{ fontWeight: weight, fontSize: size }}>
      {signed && pos ? '+' : ''}
      {formatMoney(value, currency)}
    </span>
  )
}

/** Padded section card — the group-spending content surface. */
export function SoftCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-4 shadow-glass-1', className)}>{children}</div>
  )
}

/** Uppercase section label with an optional trailing action (e.g. a "See all" link). */
export function SectionLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.06em] text-fg-faint">
      <span>{children}</span>
      {action}
    </div>
  )
}

/** One minimal-transaction row. From your POV: "your" rows get a tint + a contextual CTA;
 *  other-to-other rows render a two-avatar flow with no action. */
export function SettleRow({
  settlement,
  currency,
  currentUserId,
  onSettle,
}: {
  settlement: ComputedSettlement
  currency: string
  currentUserId?: string
  onSettle?: (s: ComputedSettlement) => void
}) {
  const { t } = useTranslation()
  const youPay = settlement.from.userId === currentUserId
  const youGet = settlement.to.userId === currentUserId
  const mine = youPay || youGet
  const other = youPay ? settlement.to.user : settlement.from.user
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-[14px] p-2.5',
        mine ? 'border border-primary/20 bg-primary-soft' : 'bg-bg-subtle',
      )}
    >
      {mine ? (
        <GMemberAvatar user={other} size={36} />
      ) : (
        <div className="flex shrink-0 items-center gap-1">
          <GMemberAvatar user={settlement.from.user} size={26} />
          <ArrowRight className="size-3 text-fg-faint" />
          <GMemberAvatar user={settlement.to.user} size={26} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] text-fg-2">
          {youGet && (
            <>
              <b className="font-bold text-foreground">{memberFirstName(settlement.from.user)}</b>{' '}
              {t('groups.settle.owesYou')}
            </>
          )}
          {youPay && (
            <>
              {t('groups.settle.youOwe')}{' '}
              <b className="font-bold text-foreground">{memberFirstName(settlement.to.user)}</b>
            </>
          )}
          {!mine && (
            <>
              <b className="font-bold text-foreground">{memberFirstName(settlement.from.user)}</b>
              <span className="px-1 opacity-50">→</span>
              <b className="font-bold text-foreground">{memberFirstName(settlement.to.user)}</b>
            </>
          )}
        </div>
        <div className="t-num mt-0.5 text-[14.5px] font-extrabold text-foreground">
          {formatMoney(settlement.amount, currency)}
        </div>
      </div>
      {mine && onSettle && (
        <Button
          type="button"
          size="sm"
          variant={youPay ? 'brand' : 'glass'}
          className="shrink-0"
          onClick={() => onSettle(settlement)}
        >
          {youPay ? t('groups.settle.settleUp') : t('groups.settle.remind')}
        </Button>
      )}
    </div>
  )
}

/** Member balance row: avatar + "paid / share" sub + sign-coloured net + gets-back/owes tag. */
export function MemberBalanceRow({
  balance,
  currency,
  currentUserId,
}: {
  balance: ConvertedBalance
  currency: string
  currentUserId?: string
}) {
  const { t } = useTranslation()
  const pos = balance.balance > BALANCE_THRESHOLD
  const neg = balance.balance < -BALANCE_THRESHOLD
  const you = balance.userId === currentUserId
  return (
    <div className="flex items-center gap-3 py-1.5">
      <GMemberAvatar user={balance.user} self={you} size={40} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14.5px] font-bold">{you ? t('groups.you') : memberName(balance.user)}</div>
        <div className="mt-0.5 text-[11.5px] text-muted-foreground">
          {t('groups.balances.paidShare', {
            paid: formatMoney(balance.totalPaid, currency),
            share: formatMoney(balance.totalOwed, currency),
          })}
        </div>
      </div>
      <div className="shrink-0 text-right">
        {pos || neg ? (
          <>
            <Money value={balance.balance} currency={currency} signed size={14.5} />
            <div className="mt-0.5 text-[10.5px] font-semibold uppercase tracking-[0.03em] text-fg-faint">
              {pos ? t('groups.balances.getsBack') : t('groups.balances.owes')}
            </div>
          </>
        ) : (
          <span className="t-num text-[14px] font-bold text-muted-foreground">{t('groups.balances.settled')}</span>
        )}
      </div>
    </div>
  )
}

/** Hub group-card balance pill: owed (green) / owe (red) / settled (neutral). */
export function BalancePill({
  state,
  amount,
  currency,
}: {
  state: BalanceState
  amount: number
  currency: string
}) {
  const { t } = useTranslation()
  const tone =
    state === 'owed'
      ? 'bg-bg-subtle text-foreground'
      : state === 'owe'
        ? 'bg-destructive-soft text-[color:var(--destructive-foreground-on-soft)]'
        : 'bg-bg-subtle text-muted-foreground'
  return (
    <span
      className={cn('inline-flex h-[30px] shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold', tone)}
    >
      {state === 'owed' && (
        <>
          {t('groups.pill.owed')} <b className="t-num font-extrabold">{formatMoney(amount, currency)}</b>
        </>
      )}
      {state === 'owe' && (
        <>
          {t('groups.pill.owe')} <b className="t-num font-extrabold">{formatMoney(Math.abs(amount), currency)}</b>
        </>
      )}
      {state === 'settled' && (
        <>
          <Check className="size-3.5" /> {t('groups.pill.settled')}
        </>
      )}
    </span>
  )
}

const ROLE_TONE: Record<string, string> = {
  owner: 'bg-primary text-primary-foreground',
  member: 'bg-subtle text-muted-foreground',
}

/** owner / member role pill (Luma monochrome; the admin tier was retired). */
export function RolePill({ role }: { role: 'owner' | 'member' }) {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.04em]',
        ROLE_TONE[role] ?? ROLE_TONE.member,
      )}
    >
      {t(`groups.roles.${role}`)}
    </span>
  )
}
