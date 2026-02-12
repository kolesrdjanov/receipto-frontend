import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { useGroupBalances, type MemberBalance } from '@/hooks/groups/use-groups'
import { useAuthStore } from '@/store/auth'
import { Loader2, TrendingUp, TrendingDown, Minus, ArrowRight, Handshake, CheckCircle } from 'lucide-react'

interface ExchangeRates {
  [currency: string]: number
}

interface GroupBalancesTabProps {
  groupId: string
  displayCurrency: string
  exchangeRates?: ExchangeRates
}

interface ConvertedBalance {
  userId: string
  user: MemberBalance['user']
  totalPaid: number
  totalOwed: number
  balance: number
  originalAmounts: { currency: string; paid: number; owed: number }[]
  settlementsReceived: number
  settlementsPaid: number
}

interface SuggestedSettlement {
  from: { id: string; firstName: string; lastName: string }
  to: { id: string; firstName: string; lastName: string }
  amount: number
}

export function GroupBalancesTab({ groupId, displayCurrency, exchangeRates }: GroupBalancesTabProps) {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { data: balances = [], isLoading: balancesLoading } = useGroupBalances(groupId)

  const isLoading = balancesLoading

  // Convert amount from one currency to the display currency
  const convertAmount = (amount: number, fromCurrency: string): number => {
    if (fromCurrency === displayCurrency || !exchangeRates) {
      return amount
    }
    const rate = exchangeRates[fromCurrency]
    if (!rate || rate === 0) {
      return amount
    }
    return amount / rate
  }

  // Calculate converted balances
  const convertedBalances: ConvertedBalance[] = useMemo(() => {
    return balances.map((balance) => {
      let totalPaid = 0
      let totalOwed = 0
      const originalAmounts: { currency: string; paid: number; owed: number }[] = []

      // Check if we have the new byCurrency format
      if (balance.byCurrency && balance.byCurrency.length > 0) {
        // New format: multi-currency support
        for (const curr of balance.byCurrency) {
          const convertedPaid = convertAmount(curr.totalPaid, curr.currency)
          const convertedOwed = convertAmount(curr.totalOwed, curr.currency)
          totalPaid += convertedPaid
          totalOwed += convertedOwed

          originalAmounts.push({
            currency: curr.currency,
            paid: curr.totalPaid,
            owed: curr.totalOwed,
          })
        }
      } else if (balance.totalPaid !== undefined || balance.totalOwed !== undefined) {
        // Legacy format: single currency (backwards compatibility)
        totalPaid = balance.totalPaid || 0
        totalOwed = balance.totalOwed || 0
        originalAmounts.push({
          currency: displayCurrency,
          paid: totalPaid,
          owed: totalOwed,
        })
      }

      // Apply settlements - convert each settlement from its original currency
      let settlementsReceived = 0
      let settlementsPaid = 0

      if (balance.settlementsByCurrency && balance.settlementsByCurrency.length > 0) {
        // New format: settlements by currency
        for (const settlement of balance.settlementsByCurrency) {
          settlementsReceived += convertAmount(settlement.received, settlement.currency)
          settlementsPaid += convertAmount(settlement.paid, settlement.currency)
        }
      } else {
        // Legacy format: flat settlements (assume already in display currency)
        settlementsReceived = balance.settlementsReceived || 0
        settlementsPaid = balance.settlementsPaid || 0
      }

      // Balance = Paid - Owed + SettlementsPaid - SettlementsReceived
      const finalBalance = totalPaid - totalOwed + settlementsPaid - settlementsReceived

      return {
        userId: balance.userId,
        user: balance.user,
        totalPaid,
        totalOwed,
        balance: finalBalance,
        originalAmounts,
        settlementsReceived,
        settlementsPaid,
      }
    })
  }, [balances, displayCurrency, exchangeRates])

  // Calculate suggested settlements from converted balances (with proper currency conversion)
  const suggestedSettlements: SuggestedSettlement[] = useMemo(() => {
    const THRESHOLD = 1.0 // Ignore amounts less than 1 unit

    // Separate creditors (positive balance = paid more than fair share)
    // and debtors (negative balance = paid less than fair share)
    const creditors = convertedBalances
      .filter((b) => b.balance > THRESHOLD)
      .map((b) => ({
        userId: b.userId,
        user: b.user,
        balance: b.balance,
      }))
      .sort((a, b) => b.balance - a.balance) // Largest first

    const debtors = convertedBalances
      .filter((b) => b.balance < -THRESHOLD)
      .map((b) => ({
        userId: b.userId,
        user: b.user,
        balance: Math.abs(b.balance), // Make positive for easier calculation
      }))
      .sort((a, b) => b.balance - a.balance) // Largest first

    const settlements: SuggestedSettlement[] = []

    // Greedy algorithm: match largest debtor with largest creditor
    let i = 0 // creditor index
    let j = 0 // debtor index

    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i]
      const debtor = debtors[j]

      const amount = Math.min(creditor.balance, debtor.balance)

      if (amount > THRESHOLD) {
        settlements.push({
          from: {
            id: debtor.userId,
            firstName: debtor.user.firstName || '',
            lastName: debtor.user.lastName || '',
          },
          to: {
            id: creditor.userId,
            firstName: creditor.user.firstName || '',
            lastName: creditor.user.lastName || '',
          },
          amount: Number(amount.toFixed(0)),
        })
      }

      creditor.balance -= amount
      debtor.balance -= amount

      if (creditor.balance < THRESHOLD) i++
      if (debtor.balance < THRESHOLD) j++
    }

    return settlements
  }, [convertedBalances])

  const formatCurrency = (amount: number, currency?: string) => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: currency || displayCurrency || 'RSD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getMemberName = (user: { firstName?: string; lastName?: string; email: string }) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    return user.firstName || user.lastName || user.email
  }

  const getSettlementMemberName = (user: { firstName: string; lastName: string }) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    return user.firstName || user.lastName
  }

  // Calculate current user's balance summary (must be before early returns to respect Rules of Hooks)
  const myBalance = useMemo(() => {
    if (!user) return null
    return convertedBalances.find((b) => b.userId === user.id)
  }, [convertedBalances, user])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Your Balance Summary */}
      {myBalance && (
        <Card>
          <CardContent className="py-4">
            {Math.abs(myBalance.balance) <= 1.0 ? (
              <div className="flex items-center gap-3 text-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-600">
                  {t('groups.balances.allSettled')}
                </span>
              </div>
            ) : myBalance.balance < -1.0 ? (
              <div className="flex items-center gap-3 text-center justify-center">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <span className="font-semibold text-red-600">
                  {t('groups.balances.youOwe', { amount: formatCurrency(Math.abs(myBalance.balance)) })}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-600">
                  {t('groups.balances.youAreOwed', { amount: formatCurrency(myBalance.balance) })}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Member Balances */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('groups.balances.memberBalances')}</CardTitle>
        </CardHeader>
        <CardContent>
          {convertedBalances.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t('groups.balances.noExpenses')}
            </p>
          ) : (
            <div className="space-y-4">
              {convertedBalances.map((balance) => {
                // Use same threshold as suggested settlements to be consistent
                const DISPLAY_THRESHOLD = 1.0
                const isOwed = balance.balance > DISPLAY_THRESHOLD
                const owes = balance.balance < -DISPLAY_THRESHOLD
                const isSettled = Math.abs(balance.balance) <= DISPLAY_THRESHOLD

                return (
                  <div
                    key={balance.userId}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border bg-card gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        {balance.user.profileImageUrl ? (
                          <img
                            src={balance.user.profileImageUrl}
                            alt={getMemberName(balance.user)}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-semibold">
                            {(balance.user.firstName?.[0] || balance.user.email[0]).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{getMemberName(balance.user)}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="whitespace-nowrap">
                            {t('groups.balances.paid')}: {formatCurrency(balance.totalPaid)}
                          </span>
                          <span className="whitespace-nowrap">
                            {t('groups.balances.owed')}: {formatCurrency(balance.totalOwed)}
                          </span>
                        </div>
                        {/* Show original amounts if multiple currencies */}
                        {balance.originalAmounts.length > 1 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {balance.originalAmounts.map((orig, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                              >
                                {formatCurrency(orig.paid, orig.currency)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isOwed && (
                        <>
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-green-600 whitespace-nowrap">
                            +{formatCurrency(balance.balance)}
                          </span>
                        </>
                      )}
                      {owes && (
                        <>
                          <TrendingDown className="h-4 w-4 text-red-600" />
                          <span className="font-semibold text-red-600 whitespace-nowrap">
                            {formatCurrency(balance.balance)}
                          </span>
                        </>
                      )}
                      {isSettled && (
                        <>
                          <Minus className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-muted-foreground whitespace-nowrap">
                            {t('groups.balances.settled')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suggested Settlements */}
      {suggestedSettlements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Handshake className="h-5 w-5" />
              {t('groups.balances.suggestedSettlements')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suggestedSettlements.map((settlement, index) => {
                const fromUser = convertedBalances.find((b) => b.userId === settlement.from.id)?.user
                const toUser = convertedBalances.find((b) => b.userId === settlement.to.id)?.user
                return (
                  <div
                    key={index}
                    className="flex items-center gap-2 flex-wrap p-3 rounded-lg border bg-card"
                  >
                    <Avatar
                      firstName={settlement.from.firstName}
                      lastName={settlement.from.lastName}
                      imageUrl={fromUser?.profileImageUrl}
                      size="sm"
                    />
                    <span className="font-medium">
                      {getSettlementMemberName(settlement.from)}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <Avatar
                      firstName={settlement.to.firstName}
                      lastName={settlement.to.lastName}
                      imageUrl={toUser?.profileImageUrl}
                      size="sm"
                    />
                    <span className="font-medium">
                      {getSettlementMemberName(settlement.to)}
                    </span>
                    <span className="font-semibold text-primary ml-2">
                      {formatCurrency(settlement.amount)}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
