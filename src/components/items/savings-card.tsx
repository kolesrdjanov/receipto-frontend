import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSavingsOpportunities } from '@/hooks/items/use-items'
import { useSettingsStore } from '@/store/settings'
import { formatMoney } from '@/lib/utils'
import { EmptyState } from '@/components/glass/empty-state'
import { PiggyBank, ArrowRight, TrendingDown } from 'lucide-react'

export function SavingsCard() {
  const { t } = useTranslation()
  const { data: savings } = useSavingsOpportunities(5)
  const { currency } = useSettingsStore()

  if (!savings || savings.length === 0) {
    return (
      <EmptyState
        compact
        className="mb-6"
        icon={PiggyBank}
        title={t('items.noSavingsYet')}
        description={t('items.shopMultipleStoresToCompare')}
      />
    )
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PiggyBank className="h-5 w-5 text-success" />
          {t('items.savingsOpportunities')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {savings.map((saving) => (
            <Link
              key={`${saving.productId}-${saving.cheaperStore}`}
              to={`/items/${saving.productId}`}
              className="flex items-center justify-between gap-4 p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{saving.displayName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {saving.currentStore}: {formatMoney(saving.currentPrice, currency)}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-success font-medium">
                    {saving.cheaperStore}: {formatMoney(saving.cheaperPrice, currency)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <TrendingDown className="h-3.5 w-3.5 text-success" />
                <span className="text-sm font-semibold text-success">
                  -{saving.savingsPercent}%
                </span>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
