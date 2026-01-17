import { useTranslation } from 'react-i18next'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  useFrequentItems,
  useItemStats,
  useMigrateReceipts,
  type FrequentItem,
} from '@/hooks/items/use-items'
import { useSettingsStore } from '@/store/settings'
import {
  Loader2,
  ShoppingCart,
  Package,
  Store,
  TrendingDown,
  TrendingUp,
  Minus,
  Database,
  ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'

export default function ItemsPage() {
  const { t } = useTranslation()
  const { data: items, isLoading: itemsLoading } = useFrequentItems(50)
  const { data: stats, isLoading: statsLoading } = useItemStats()
  const migrateReceipts = useMigrateReceipts()
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

  const handleMigrate = async () => {
    try {
      const result = await migrateReceipts.mutateAsync()
      toast.success(t('items.migrate.success', {
        items: result.itemsCreated,
        receipts: result.processed,
      }))
    } catch {
      toast.error(t('items.migrate.error'))
    }
  }

  const isLoading = itemsLoading || statsLoading

  return (
    <AppLayout>
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2 md:text-3xl">
              {t('items.title')}
            </h2>
            <p className="text-sm text-muted-foreground md:text-base">
              {t('items.subtitle')}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleMigrate}
            disabled={migrateReceipts.isPending}
          >
            {migrateReceipts.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('items.migrate.processing')}
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                {t('items.migrate.button')}
              </>
            )}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('items.stats.totalProducts')}
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats?.totalProducts || 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('items.stats.priceRecords')}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats?.totalPriceRecords || 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('items.stats.uniqueStores')}
                </CardTitle>
                <Store className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats?.uniqueStores || 0}</p>
              </CardContent>
            </Card>
          </div>

          {/* Items List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                {t('items.frequentlyBought')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!items || items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg">{t('items.noItemsYet')}</p>
                  <p className="text-sm mt-1">{t('items.scanReceiptsToTrack')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item) => {
                    const trend = getPriceTrend(item)
                    const TrendIcon = trend?.icon

                    return (
                      <Link
                        key={item.id}
                        to={`/items/${item.id}`}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.displayName}</p>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span>
                              {t('items.boughtTimes', { count: item.purchaseCount })}
                            </span>
                            <span>
                              {item.stores.length} {t('items.stores')}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 ml-4">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              {t('items.avgPrice')}
                            </p>
                            <p className="font-medium">{formatPrice(item.avgPrice)}</p>
                          </div>

                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              {t('items.lastPrice')}
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{formatPrice(item.lastPrice)}</p>
                              {trend && TrendIcon && (
                                <span className={`flex items-center gap-1 text-xs ${trend.color}`}>
                                  <TrendIcon className="h-3 w-3" />
                                  {trend.label}
                                </span>
                              )}
                            </div>
                          </div>

                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </AppLayout>
  )
}
