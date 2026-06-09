import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSavingsOpportunities } from '@/hooks/items/use-items'
import { Loader2, PiggyBank, ArrowRight, BadgePercent } from 'lucide-react'
import { useSettingsStore } from '@/store/settings'
import { formatMoney } from '@/lib/utils'
import { WidgetEmpty } from './primitives'

export function SavingsOpportunities() {
  const { t } = useTranslation()
  const { data: savings, isLoading } = useSavingsOpportunities(5)
  const { currency } = useSettingsStore()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PiggyBank className="h-4 w-4" />
            {t('items.savingsOpportunities')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px]">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!savings || savings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PiggyBank className="h-4 w-4" />
            {t('items.savingsOpportunities')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WidgetEmpty tall icon={PiggyBank} hint={t('items.shopMultipleStoresToCompare')}>
            {t('items.noSavingsYet')}
          </WidgetEmpty>
        </CardContent>
      </Card>
    )
  }

  const totalPotentialSavings = savings.reduce((sum, s) => sum + s.potentialSavings, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <PiggyBank className="h-4 w-4" />
            {t('items.savingsOpportunities')}
          </div>
          <div className="flex items-center gap-1 text-sm font-normal text-success">
            <BadgePercent className="h-4 w-4" />
            {formatMoney(totalPotentialSavings, currency)} {t('items.potential')}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {savings.map((item) => (
            <Link
              key={item.productId}
              to={`/items/${item.productId}`}
              className="block p-3 -mx-2 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium truncate flex-1">{item.displayName}</p>
                <span className="ml-2 px-2 py-0.5 bg-success/10 text-success text-xs font-medium rounded-full">
                  -{item.savingsPercent}%
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="flex-1">
                  <p className="text-muted-foreground truncate">{item.currentStore}</p>
                  <p className="font-medium text-destructive">{formatMoney(item.currentPrice, currency)}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 text-right">
                  <p className="text-muted-foreground truncate">{item.cheaperStore}</p>
                  <p className="font-medium text-success">{formatMoney(item.cheaperPrice, currency)}</p>
                </div>
              </div>
              <p className="text-xs text-success mt-2">
                {t('items.saveAmount', { amount: formatMoney(item.potentialSavings, currency) })}
              </p>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
