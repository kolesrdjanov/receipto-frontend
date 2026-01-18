import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useFrequentItems, type FrequentItem } from '@/hooks/items/use-items'
import { Loader2, ShoppingCart, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { useSettingsStore } from '@/store/settings'

export function FrequentItems() {
  const { t } = useTranslation()
  const { data: itemsResponse, isLoading } = useFrequentItems({ limit: 5 })
  const items = itemsResponse?.data
  const { currency } = useSettingsStore()

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: currency || 'RSD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getPriceTrend = (item: FrequentItem) => {
    if (!item) return null
    const diff = item.lastPrice - item.avgPrice
    const percentChange = (diff / item.avgPrice) * 100

    if (Math.abs(percentChange) < 2) {
      return { icon: Minus, color: 'text-muted-foreground', label: t('items.stable') }
    } else if (diff > 0) {
      return { icon: TrendingUp, color: 'text-destructive', label: `+${percentChange.toFixed(0)}%` }
    } else {
      return { icon: TrendingDown, color: 'text-green-500', label: `${percentChange.toFixed(0)}%` }
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="h-4 w-4" />
            {t('items.frequentlyBought')}
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

  if (!items || items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="h-4 w-4" />
            {t('items.frequentlyBought')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground text-sm">
            <ShoppingCart className="h-8 w-8 mb-2 opacity-50" />
            <p>{t('items.noItemsYet')}</p>
            <p className="text-xs mt-1">{t('items.scanReceiptsToTrack')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            {t('items.frequentlyBought')}
          </div>
          <Link
            to="/items"
            className="text-sm font-normal text-primary hover:underline"
          >
            {t('items.viewAll')}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => {
            const trend = getPriceTrend(item)
            const TrendIcon = trend?.icon

            return (
              <Link
                key={item.id}
                to={`/items/${item.id}`}
                className="flex items-center justify-between p-2 -mx-2 rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.displayName}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('items.boughtTimes', { count: item.purchaseCount })} · {item.stores.length} {t('items.stores')}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <p className="font-medium">{formatPrice(item.lastPrice)}</p>
                  {trend && TrendIcon && (
                    <p className={`text-xs flex items-center justify-end gap-1 ${trend.color}`}>
                      <TrendIcon className="h-3 w-3" />
                      {trend.label}
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
