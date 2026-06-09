import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { useAuthStore } from '@/store/auth'
import { useExchangeRates } from '@/hooks/currencies/use-currency-converter'
import { useGroupBalances, type Group, type MemberBalance } from '@/hooks/groups/use-groups'
import {
  computeConvertedBalances,
  simplifyDebts,
  getBalanceState,
  type ConvertedBalance,
  type ComputedSettlement,
  type BalanceState,
} from '@/lib/groups'

export interface GroupBalanceModel {
  convertedBalances: ConvertedBalance[]
  settlements: ComputedSettlement[]
  myBalance?: ConvertedBalance
  myState: BalanceState
  isLoading: boolean
}

/**
 * One group's full balance picture in the display currency: per-member balances, the minimal
 * settle-up plan, and the signed-in user's own position. The single hook behind the Overview
 * settle-path, the Balances tab and the desktop rail (so they never re-derive the math).
 */
export function useGroupBalanceModel(groupId: string, displayCurrency: string): GroupBalanceModel {
  const { user } = useAuthStore()
  const { data: balances = [], isLoading } = useGroupBalances(groupId)
  const { data: exchangeRates } = useExchangeRates(displayCurrency)

  const convertedBalances = useMemo(
    () => computeConvertedBalances(balances, displayCurrency, exchangeRates),
    [balances, displayCurrency, exchangeRates],
  )
  const settlements = useMemo(() => simplifyDebts(convertedBalances), [convertedBalances])
  const myBalance = useMemo(
    () => convertedBalances.find((b) => b.userId === user?.id),
    [convertedBalances, user?.id],
  )

  return {
    convertedBalances,
    settlements,
    myBalance,
    myState: getBalanceState(myBalance?.balance),
    isLoading,
  }
}

export interface GroupNet {
  groupId: string
  balance: number
  state: BalanceState
  isLoading: boolean
}

/**
 * The signed-in user's net position in every group (for the Hub overall-net card + per-card
 * balance pill). Fans out one balances query per group via `useQueries`; each is currency-
 * converted to the shared display currency and reduced to my single balance.
 */
export function useGroupsNet(groups: Group[], displayCurrency: string): {
  byGroup: Record<string, GroupNet>
  overall: number
  isLoading: boolean
} {
  const { user } = useAuthStore()
  const { data: exchangeRates } = useExchangeRates(displayCurrency)

  const results = useQueries({
    queries: groups.map((g) => ({
      queryKey: [...queryKeys.groups.detail(g.id), 'balances'],
      queryFn: () => api.get<MemberBalance[]>(`/groups/${g.id}/balances`),
      enabled: !!g.id,
    })),
  })

  return useMemo(() => {
    const byGroup: Record<string, GroupNet> = {}
    let overall = 0
    let anyLoading = false

    groups.forEach((g, idx) => {
      const res = results[idx]
      const balances = (res?.data as MemberBalance[] | undefined) ?? []
      const converted = computeConvertedBalances(balances, displayCurrency, exchangeRates)
      const mine = converted.find((b) => b.userId === user?.id)
      const balance = mine?.balance ?? 0
      if (res?.isLoading) anyLoading = true
      byGroup[g.id] = {
        groupId: g.id,
        balance,
        state: getBalanceState(balance),
        isLoading: !!res?.isLoading,
      }
      overall += balance
    })

    return { byGroup, overall, isLoading: anyLoading }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, results, displayCurrency, exchangeRates, user?.id])
}
