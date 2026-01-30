import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSettlementHistory, type SettlementRecord } from '@/hooks/groups/use-groups'
import { Loader2, ArrowRight, History, Check } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { enUS, sr } from 'date-fns/locale'
import i18n from 'i18next'

interface SettlementHistoryProps {
  groupId: string
  currency: string
}

export function SettlementHistory({ groupId, currency }: SettlementHistoryProps) {
  const { t } = useTranslation()
  const { data: settlements = [], isLoading } = useSettlementHistory(groupId)

  const formatCurrency = (amount: number, settlementCurrency?: string) => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: settlementCurrency || currency || 'RSD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const getMemberName = (user: { firstName?: string; lastName?: string; email: string }) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    return user.firstName || user.lastName || user.email
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const locale = i18n.language === 'sr' ? sr : enUS
    return formatDistanceToNow(date, { addSuffix: true, locale })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5" />
          {t('groups.settlements.history')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {settlements.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t('groups.settlements.noHistory')}
          </p>
        ) : (
          <div className="space-y-3">
            {settlements.map((settlement: SettlementRecord) => (
              <div
                key={settlement.id}
                className="p-4 rounded-lg border bg-card"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Check className="h-4 w-4 text-green-600 shrink-0" />
                    <span className="font-medium">
                      {getMemberName(settlement.fromUser)}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {getMemberName(settlement.toUser)}
                    </span>
                  </div>
                  <span className="font-semibold text-green-600 whitespace-nowrap">
                    {formatCurrency(settlement.amount, settlement.currency)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{formatDate(settlement.settledAt)}</span>
                  {settlement.note && (
                    <span className="italic">"{settlement.note}"</span>
                  )}
                  {settlement.createdBy && (
                    <span>
                      {t('groups.settlements.recordedBy')}: {settlement.createdBy.firstName || settlement.createdBy.lastName}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
