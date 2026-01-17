import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSavingsOpportunities } from '@/hooks/items/use-items'
import { Loader2, PiggyBank, ArrowRight, BadgePercent } from 'lucide-react'
import { useSettingsStore } from '@/store/settings'

export function SavingsOpportunities() {
  const { t } = useTranslation()
  const { data: savings, isLoading } = useSavingsOpportunities(5)
  const { currency } = useSettingsStore()

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: currency || 'RSD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

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
          <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground text-sm">
            <PiggyBank className="h-8 w-8 mb-2 opacity-50" />
            <p>{t('items.noSavingsYet')}</p>
            <p className="text-xs mt-1">{t('items.shopMultipleStoresToCompare')}</p>
          </div>
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
          <div className="flex items-center gap-1 text-sm font-normal text-green-500">
            <BadgePercent className="h-4 w-4" />
            {formatPrice(totalPotentialSavings)} {t('items.potential')}
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
                <span className="ml-2 px-2 py-0.5 bg-green-500/10 text-green-500 text-xs font-medium rounded-full">
                  -{item.savingsPercent}%
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="flex-1">
                  <p className="text-muted-foreground truncate">{item.currentStore}</p>
                  <p className="font-medium text-destructive">{formatPrice(item.currentPrice)}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 text-right">
                  <p className="text-muted-foreground truncate">{item.cheaperStore}</p>
                  <p className="font-medium text-green-500">{formatPrice(item.cheaperPrice)}</p>
                </div>
              </div>
              <p className="text-xs text-green-500 mt-2">
                {t('items.saveAmount', { amount: formatPrice(item.potentialSavings) })}
              </p>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
