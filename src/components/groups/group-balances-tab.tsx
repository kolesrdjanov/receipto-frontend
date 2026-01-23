import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useGroupBalances, useGroupSettlements } from '@/hooks/groups/use-groups'
import { Loader2, TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react'

interface GroupBalancesTabProps {
  groupId: string
  currency: string
}

export function GroupBalancesTab({ groupId, currency }: GroupBalancesTabProps) {
  const { t } = useTranslation()
  const { data: balances = [], isLoading: balancesLoading } = useGroupBalances(groupId)
  const { data: settlements = [], isLoading: settlementsLoading } = useGroupSettlements(groupId)

  const isLoading = balancesLoading || settlementsLoading

  // Calculate total spent across all members
  const totalSpent = balances.reduce((sum, balance) => sum + balance.totalPaid, 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: currency || 'RSD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const getMemberName = (user: { firstName?: string; lastName?: string; email: string }) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    return user.firstName || user.lastName || user.email
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Total Spent Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('groups.balances.totalSpent')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">
            {formatCurrency(totalSpent)}
          </div>
        </CardContent>
      </Card>

      {/* Member Balances */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('groups.balances.memberBalances')}</CardTitle>
        </CardHeader>
        <CardContent>
          {balances.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t('groups.balances.noExpenses')}
            </p>
          ) : (
            <div className="space-y-4">
              {balances.map((balance) => {
                const isOwed = balance.balance > 0.01
                const owes = balance.balance < -0.01
                const isSettled = Math.abs(balance.balance) < 0.01

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
      {settlements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('groups.balances.suggestedSettlements')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {settlements.map((settlement, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg bg-muted/50 gap-2"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">
                      {settlement.from.firstName} {settlement.from.lastName}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {settlement.to.firstName} {settlement.to.lastName}
                    </span>
                  </div>
                  <span className="font-semibold text-primary whitespace-nowrap">
                    {formatCurrency(settlement.amount)}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              {t('groups.balances.settlementsHelp')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
