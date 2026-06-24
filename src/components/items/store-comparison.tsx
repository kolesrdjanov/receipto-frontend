import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Loader2, Store, TrendingUp } from 'lucide-react'
import { EmptyState } from '@/components/glass/empty-state'
import { useStorePriceComparison } from '@/hooks/items/use-items'
import { useSettingsStore } from '@/store/settings'
import { formatMoney } from '@/lib/utils'
import { format } from 'date-fns'

interface StoreComparisonProps {
  productId: string
}

export function StoreComparison({ productId }: StoreComparisonProps) {
  const { t } = useTranslation()
  const { data: stores, isLoading } = useStorePriceComparison(productId)
  const { currency } = useSettingsStore()

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
          <EmptyState
            compact
            className="border-0 bg-transparent shadow-none"
            icon={Store}
            title={t('items.noHistory')}
          />
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
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <Store className="h-4 w-4" />
          {t('items.storeComparison')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 sm:space-y-4">
          {stores.map((store, index) => {
            const isCheapest = store.storeName === cheapestStore.storeName
            const priceDiff = ((store.avgPrice - cheapestStore.avgPrice) / cheapestStore.avgPrice) * 100

            return (
              <div
                key={store.storeName}
                className={`p-2.5 sm:p-3 rounded-lg border ${
                  isCheapest ? 'border-success/50 bg-success-soft' : ''
                }`}
              >
                <div className="flex items-start sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-muted-foreground shrink-0">
                      {index + 1}.
                    </span>
                    <span className="font-medium text-sm sm:text-base truncate">{store.storeName}</span>
                    {isCheapest && (
                      <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-success-soft text-success text-xs font-medium rounded-full shrink-0">
                        <Check className="h-3 w-3" aria-hidden="true" />
                        {t('items.minPrice')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isCheapest && (
                      <span className="sm:hidden inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-success-soft text-success text-[10px] font-medium rounded-full">
                        <Check className="h-2.5 w-2.5" aria-hidden="true" />
                        {t('items.minPrice')}
                      </span>
                    )}
                    {!isCheapest && priceDiff > 0 && (
                      <span className="flex items-center gap-1 text-xs text-destructive">
                        <TrendingUp className="h-3 w-3" />
                        +{priceDiff.toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Mobile: 2-column grid */}
                <div className="grid grid-cols-2 gap-2 text-sm sm:hidden">
                  <div>
                    <p className="text-muted-foreground text-[10px]">{t('items.avgPrice')}</p>
                    <p className="font-medium text-sm">{formatMoney(store.avgPrice, currency)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px]">{t('items.purchases')}</p>
                    <p className="font-medium text-sm">{store.purchaseCount}x</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-[10px]">{t('items.priceRange')}</p>
                    <p className="font-medium text-sm">
                      {formatMoney(store.minPrice, currency)} – {formatMoney(store.maxPrice, currency)}
                    </p>
                  </div>
                </div>

                {/* Desktop: 3-column grid */}
                <div className="hidden sm:grid sm:grid-cols-3 sm:gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">{t('items.avgPrice')}</p>
                    <p className="font-medium">{formatMoney(store.avgPrice, currency)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">{t('items.minPrice')}/{t('items.maxPrice')}</p>
                    <p className="font-medium">
                      {formatMoney(store.minPrice, currency)} – {formatMoney(store.maxPrice, currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">{t('items.purchases')}</p>
                    <p className="font-medium">{store.purchaseCount}x</p>
                  </div>
                </div>

                <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
                  {t('items.lastPurchase')}: {format(new Date(store.lastDate), 'MMM d')} · {formatMoney(store.lastPrice, currency)}
                </p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
