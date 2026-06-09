import type { MemberBalance } from '@/hooks/groups/use-groups'

/**
 * Shared group-spending balance model. The single source of truth for the
 * per-member balance math + the minimal-transaction "simplify debts" greedy
 * solver, extracted so the Hub net, the Overview settle-path, the Balances tab
 * and the desktop rail can't disagree. Mirrors the backend formula
 * (`balance = paid − owed + settlementsPaid − settlementsReceived`) but is
 * currency-aware: every per-currency leg is converted to a display currency
 * first (the server endpoints are single-currency).
 */

export type ExchangeRates = Record<string, number>

export type BalanceState = 'owed' | 'owe' | 'settled'

/** Amounts under this (in display currency) are treated as settled — ignores rounding dust. */
export const BALANCE_THRESHOLD = 1.0

export type BalanceUser = MemberBalance['user']

export interface ConvertedBalance {
  userId: string
  user: BalanceUser
  totalPaid: number
  totalOwed: number
  balance: number
  originalAmounts: { currency: string; paid: number; owed: number }[]
  settlementsReceived: number
  settlementsPaid: number
}

export interface ComputedSettlement {
  from: { userId: string; user: BalanceUser }
  to: { userId: string; user: BalanceUser }
  amount: number
}

/** Convert `amount` from `fromCurrency` into `displayCurrency` using rates whose base is the
 *  display currency (so `converted = amount / rate`). Identity when same currency / no rate. */
export function convertAmount(
  amount: number,
  fromCurrency: string,
  displayCurrency: string,
  rates?: ExchangeRates,
): number {
  if (fromCurrency === displayCurrency || !rates) return amount
  const rate = rates[fromCurrency]
  if (!rate || rate === 0) return amount
  return amount / rate
}

/** Fold a group's raw per-member balances (new `byCurrency` or legacy flat shape) into a single
 *  display-currency balance per member. */
export function computeConvertedBalances(
  balances: MemberBalance[],
  displayCurrency: string,
  rates?: ExchangeRates,
): ConvertedBalance[] {
  return balances.map((balance) => {
    let totalPaid = 0
    let totalOwed = 0
    const originalAmounts: { currency: string; paid: number; owed: number }[] = []

    if (balance.byCurrency && balance.byCurrency.length > 0) {
      for (const curr of balance.byCurrency) {
        totalPaid += convertAmount(curr.totalPaid, curr.currency, displayCurrency, rates)
        totalOwed += convertAmount(curr.totalOwed, curr.currency, displayCurrency, rates)
        originalAmounts.push({ currency: curr.currency, paid: curr.totalPaid, owed: curr.totalOwed })
      }
    } else if (balance.totalPaid !== undefined || balance.totalOwed !== undefined) {
      totalPaid = balance.totalPaid || 0
      totalOwed = balance.totalOwed || 0
      originalAmounts.push({ currency: displayCurrency, paid: totalPaid, owed: totalOwed })
    }

    let settlementsReceived = 0
    let settlementsPaid = 0
    if (balance.settlementsByCurrency && balance.settlementsByCurrency.length > 0) {
      for (const s of balance.settlementsByCurrency) {
        settlementsReceived += convertAmount(s.received, s.currency, displayCurrency, rates)
        settlementsPaid += convertAmount(s.paid, s.currency, displayCurrency, rates)
      }
    } else {
      settlementsReceived = balance.settlementsReceived || 0
      settlementsPaid = balance.settlementsPaid || 0
    }

    return {
      userId: balance.userId,
      user: balance.user,
      totalPaid,
      totalOwed,
      balance: totalPaid - totalOwed + settlementsPaid - settlementsReceived,
      originalAmounts,
      settlementsReceived,
      settlementsPaid,
    }
  })
}

/** Greedy minimal-transaction solver: repeatedly match the largest creditor with the largest
 *  debtor. Returns `from → to : amount` rows (whole units), carrying user objects for rendering. */
export function simplifyDebts(converted: ConvertedBalance[]): ComputedSettlement[] {
  const creditors = converted
    .filter((b) => b.balance > BALANCE_THRESHOLD)
    .map((b) => ({ userId: b.userId, user: b.user, amt: b.balance }))
    .sort((a, b) => b.amt - a.amt)
  const debtors = converted
    .filter((b) => b.balance < -BALANCE_THRESHOLD)
    .map((b) => ({ userId: b.userId, user: b.user, amt: -b.balance }))
    .sort((a, b) => b.amt - a.amt)

  const out: ComputedSettlement[] = []
  let i = 0
  let j = 0
  while (i < creditors.length && j < debtors.length) {
    const c = creditors[i]
    const d = debtors[j]
    const amt = Math.min(c.amt, d.amt)
    if (amt > BALANCE_THRESHOLD) {
      out.push({
        from: { userId: d.userId, user: d.user },
        to: { userId: c.userId, user: c.user },
        amount: Number(amt.toFixed(0)),
      })
    }
    c.amt -= amt
    d.amt -= amt
    if (c.amt < BALANCE_THRESHOLD) i++
    if (d.amt < BALANCE_THRESHOLD) j++
  }
  return out
}

export function getBalanceState(balance: number | undefined | null): BalanceState {
  if (balance == null || Math.abs(balance) <= BALANCE_THRESHOLD) return 'settled'
  return balance > 0 ? 'owed' : 'owe'
}

/** Full display name with email fallback. */
export function memberName(user?: { firstName?: string; lastName?: string; email?: string } | null): string {
  if (!user) return ''
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`
  return user.firstName || user.lastName || user.email || ''
}

/** First name with email-local fallback (for compact settle copy). */
export function memberFirstName(user?: { firstName?: string; lastName?: string; email?: string } | null): string {
  if (!user) return ''
  return user.firstName || user.lastName || user.email?.split('@')[0] || ''
}
