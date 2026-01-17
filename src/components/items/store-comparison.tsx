import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Store, TrendingUp } from 'lucide-react'
import { useStorePriceComparison } from '@/hooks/items/use-items'
import { useSettingsStore } from '@/store/settings'
import { format } from 'date-fns'

interface StoreComparisonProps {
  productId: string
}

export function StoreComparison({ productId }: StoreComparisonProps) {
  const { t } = useTranslation()
  const { data: stores, isLoading } = useStorePriceComparison(productId)
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
            <Store className="h-4 w-4" />
            {t('items.storeComparison')}
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

  if (!stores || stores.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Store className="h-4 w-4" />
            {t('items.storeComparison')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            {t('items.noHistory')}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Find cheapest store
  const cheapestStore = stores.reduce((min, store) =>
    store.avgPrice < min.avgPrice ? store : min
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Store className="h-4 w-4" />
          {t('items.storeComparison')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stores.map((store, index) => {
            const isCheapest = store.storeName === cheapestStore.storeName
            const priceDiff = ((store.avgPrice - cheapestStore.avgPrice) / cheapestStore.avgPrice) * 100

            return (
              <div
                key={store.storeName}
                className={`p-3 rounded-lg border ${
                  isCheapest ? 'border-green-500/50 bg-green-500/5' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-4">
                      {index + 1}.
                    </span>
                    <span className="font-medium">{store.storeName}</span>
                    {isCheapest && (
                      <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-xs font-medium rounded-full">
                        {t('items.minPrice')}
                      </span>
                    )}
                  </div>
                  {!isCheapest && priceDiff > 0 && (
                    <span className="flex items-center gap-1 text-xs text-destructive">
                      <TrendingUp className="h-3 w-3" />
                      +{priceDiff.toFixed(0)}%
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">{t('items.avgPrice')}</p>
                    <p className="font-medium">{formatPrice(store.avgPrice)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">{t('items.minPrice')}/{t('items.maxPrice')}</p>
                    <p className="font-medium">
                      {formatPrice(store.minPrice)} - {formatPrice(store.maxPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">{t('items.purchases')}</p>
                    <p className="font-medium">{store.purchaseCount}x</p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-2">
                  {t('items.lastPurchase')}: {format(new Date(store.lastDate), 'MMM d, yyyy')} - {formatPrice(store.lastPrice)}
                </p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
