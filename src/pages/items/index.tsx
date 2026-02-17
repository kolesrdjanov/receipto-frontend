import { useState, useEffect, useRef } from 'react'
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
  HelpCircle,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { SavingsCard } from '@/components/items/savings-card'
import { ShoppingInsights } from '@/components/items/shopping-insights'

export default function ItemsPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const limit = 15
  const { data: itemsResponse, isLoading: itemsLoading, refetch: refetchItems } = useFrequentItems({ page, limit })
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useItemStats()
  const items = itemsResponse?.data
  const pagination = itemsResponse?.pagination
  const migrateReceipts = useMigrateReceipts()
  const { currency } = useSettingsStore()
  const [showGuide, setShowGuide] = useState(() => {
    return localStorage.getItem('items-guide-dismissed') !== 'true'
  })
  const [isAutoMigrating, setIsAutoMigrating] = useState(false)
  const autoMigrateAttempted = useRef(false)

  // Auto-migrate existing receipts on first visit if user has no items
  useEffect(() => {
    const shouldAutoMigrate = async () => {
      // Only run once per session
      if (autoMigrateAttempted.current) return

      // Wait for stats to load
      if (statsLoading) return

      // Check if already migrated before (has items) or already attempted this session
      const migrationKey = 'items-auto-migration-done'
      if (localStorage.getItem(migrationKey) === 'true') return

      // If user has no products, try to migrate
      if (stats?.totalProducts === 0) {
        autoMigrateAttempted.current = true
        setIsAutoMigrating(true)

        try {
          const result = await migrateReceipts.mutateAsync()

          // Mark migration as done
          localStorage.setItem(migrationKey, 'true')

          // Refetch data after migration
          await Promise.all([refetchItems(), refetchStats()])

          // Only show toast if items were actually created
          if (result.itemsCreated > 0) {
            toast.success(t('items.autoMigrate.success', {
              items: result.itemsCreated,
              receipts: result.processed,
            }))
          }
        } catch {
          // Silent fail for auto-migration - user can still manually migrate
          console.error('Auto-migration failed')
        } finally {
          setIsAutoMigrating(false)
        }
      } else {
        // User already has items, mark as done
        localStorage.setItem(migrationKey, 'true')
      }
    }

    shouldAutoMigrate()
  }, [statsLoading, stats?.totalProducts, migrateReceipts, refetchItems, refetchStats, t])

  const dismissGuide = () => {
    setShowGuide(false)
    localStorage.setItem('items-guide-dismissed', 'true')
  }

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

  const isLoading = itemsLoading || statsLoading || isAutoMigrating

  // Show special loading state during auto-migration
  if (isAutoMigrating) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-24">
          <div className="relative">
            <Sparkles className="h-12 w-12 text-primary animate-pulse" />
          </div>
          <h3 className="mt-6 text-xl font-semibold">{t('items.autoMigrate.title')}</h3>
          <p className="mt-2 text-muted-foreground text-center max-w-md">
            {t('items.autoMigrate.description')}
          </p>
          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('items.autoMigrate.processing')}
          </div>
        </div>
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
          {/* How It Works Guide */}
          {showGuide && (
            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    {t('items.guide.title')}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={dismissGuide}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <QrCode className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{t('items.guide.step1Title')}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t('items.guide.step1Description')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{t('items.guide.step2Title')}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t('items.guide.step2Description')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <PiggyBank className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{t('items.guide.step3Title')}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t('items.guide.step3Description')}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4 pt-3 border-t">
                  {t('items.guide.tip')}
                </p>
              </CardContent>
            </Card>
          )}

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
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg">{t('items.noItemsYet')}</p>
                  <p className="text-sm mt-1">{t('items.scanReceiptsToTrack')}</p>
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
