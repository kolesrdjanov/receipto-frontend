import { useState } from 'react'
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
  QrCode,
  BarChart3,
  PiggyBank,
  Sparkles,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { Link, useSearchParams } from 'react-router-dom'
import { SavingsCard } from '@/components/items/savings-card'
import { ShoppingInsights } from '@/components/items/shopping-insights'

export default function ItemsPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page')) || 1
  const setPage = (updater: number | ((prev: number) => number)) => {
    const newPage = typeof updater === 'function' ? updater(page) : updater
    setSearchParams(newPage > 1 ? { page: String(newPage) } : {}, { replace: true })
  }
  const limit = 15
  const { data: itemsResponse, isLoading: itemsLoading } = useFrequentItems({ page, limit })
  const { data: stats, isLoading: statsLoading } = useItemStats()
  const items = itemsResponse?.data
  const pagination = itemsResponse?.pagination
  const migrateReceipts = useMigrateReceipts()
  const { currency } = useSettingsStore()
  const [isMigrating, setIsMigrating] = useState(false)
  const [showNoDataWarning, setShowNoDataWarning] = useState(false)

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: currency || 'RSD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getPriceTrend = (item: FrequentItem) => {
    if (!item || !item.avgPrice || !item.lastPrice) return null
    const diff = item.lastPrice - item.avgPrice
    const percentChange = (diff / item.avgPrice) * 100

    if (!isFinite(percentChange) || Math.abs(percentChange) < 2) {
      return { icon: Minus, color: 'text-muted-foreground', label: t('items.stable') }
    } else if (diff > 0) {
      return { icon: TrendingUp, color: 'text-destructive', label: `+${percentChange.toFixed(0)}%` }
    } else {
      return { icon: TrendingDown, color: 'text-green-500', label: `${percentChange.toFixed(0)}%` }
    }
  }

  const handleMigrate = async () => {
    setIsMigrating(true)
    try {
      const result = await migrateReceipts.mutateAsync()
      if (result.itemsCreated > 0) {
        toast.success(t('items.migrate.success', {
          items: result.itemsCreated,
          receipts: result.processed,
        }))
        setShowNoDataWarning(false)
      } else {
        setShowNoDataWarning(true)
      }
    } catch {
      toast.error(t('items.migrate.error'))
    } finally {
      setIsMigrating(false)
    }
  }

  const isLoading = itemsLoading || statsLoading
  const hasProducts = stats && stats.totalProducts > 0

  // Show importing state
  if (isMigrating) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-24">
          <div className="relative">
            <Sparkles className="h-12 w-12 text-primary animate-pulse" />
          </div>
          <h3 className="mt-6 text-xl font-semibold">{t('items.import.title')}</h3>
          <p className="mt-2 text-muted-foreground text-center max-w-md">
            {t('items.import.description')}
          </p>
          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('items.import.processing')}
          </div>
        </div>
      </AppLayout>
    )
  }

  // Show empty state when no products exist
  if (!isLoading && !hasProducts) {
    return (
      <AppLayout>
        <div className="mb-6 md:mb-8">
          <h2 className="text-2xl font-bold tracking-tight mb-2 md:text-3xl">
            {t('items.title')}
          </h2>
          <p className="text-sm text-muted-foreground md:text-base">
            {t('items.subtitle')}
          </p>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Package className="h-8 w-8 text-primary" />
            </div>

            <h3 className="text-xl font-semibold mb-2 text-center">
              {t('items.empty.title')}
            </h3>
            <p className="text-muted-foreground text-center max-w-md mb-8">
              {t('items.empty.description')}
            </p>

            <div className="grid gap-4 sm:grid-cols-3 w-full max-w-2xl mb-8">
              <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <QrCode className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{t('items.empty.step1Title')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('items.empty.step1Description')}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{t('items.empty.step2Title')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('items.empty.step2Description')}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <PiggyBank className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{t('items.empty.step3Title')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('items.empty.step3Description')}
                  </p>
                </div>
              </div>
            </div>

            {showNoDataWarning && (
              <div className="flex gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 w-full max-w-2xl mb-6">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">
                  {t('items.empty.noDataWarning')}
                </p>
              </div>
            )}

            <Button size="lg" onClick={handleMigrate}>
              <Sparkles className="h-4 w-4" />
              {t('items.empty.importButton')}
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              {t('items.empty.importHint')}
            </p>
          </CardContent>
        </Card>
      </AppLayout>
    )
  }

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
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('items.migrate.processing')}
              </>
            ) : (
              <>
                <Database className="h-4 w-4" />
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

          {/* Shopping Insights (AI or rule-based) */}
          {stats && stats.totalProducts > 0 && <ShoppingInsights />}

          {/* Savings Opportunities */}
          <SavingsCard />

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
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <ShoppingCart className="h-10 w-10 mb-4 opacity-50" />
                  <p className="font-medium">{t('items.noFrequentYet')}</p>
                  <p className="text-sm mt-1 text-center max-w-sm">{t('items.noFrequentDescription')}</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {items.map((item) => {
                      const trend = getPriceTrend(item)
                      const TrendIcon = trend?.icon

                      return (
                        <Link
                          key={item.id}
                          to={`/items/${item.id}`}
                          className="block p-3 sm:p-4 rounded-lg border hover:bg-accent transition-colors"
                        >
                          {/* Mobile layout */}
                          <div className="sm:hidden">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium leading-tight">{item.displayName}</p>
                              {trend && TrendIcon && (
                                <span className={`flex items-center gap-1 text-xs shrink-0 ${trend.color}`}>
                                  <TrendIcon className="h-3 w-3" />
                                  {trend.label}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-muted-foreground">
                                {t('items.boughtTimes', { count: item.purchaseCount })} · {item.stores.length} {t('items.stores')}
                              </span>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="text-muted-foreground">{formatPrice(item.avgPrice)}</span>
                                <span className="font-medium">{formatPrice(item.lastPrice)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Desktop layout */}
                          <div className="hidden sm:flex sm:items-center sm:justify-between">
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
                          </div>
                        </Link>
                      )
                    })}
                  </div>

                  {/* Pagination */}
                  {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        {t('common.pagination.showing', {
                          from: (pagination.page - 1) * pagination.limit + 1,
                          to: Math.min(pagination.page * pagination.limit, pagination.total),
                          total: pagination.total,
                        })}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          {t('common.pagination.previous')}
                        </Button>
                        <span className="text-sm text-muted-foreground px-2">
                          {pagination.page} / {pagination.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => p + 1)}
                          disabled={!pagination.hasMore}
                        >
                          {t('common.pagination.next')}
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </AppLayout>
  )
}
