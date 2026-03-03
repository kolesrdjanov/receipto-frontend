import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '@/components/layout/app-layout'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { DatePicker } from '@/components/ui/date-picker'
import { OverviewTab } from '@/components/admin/analytics/overview-tab'
import { ProductsTab } from '@/components/admin/analytics/products-tab'
import { WalletTab } from '@/components/admin/analytics/wallet-tab'
import { PromosTab } from '@/components/admin/analytics/promos-tab'
import { GeoTab } from '@/components/admin/analytics/geo-tab'
import type { AnalyticsFilters } from '@/hooks/admin/use-analytics'

function getDefaultDateRange(): Pick<AnalyticsFilters, 'dateFrom' | 'dateTo'> {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 30)
  return {
    dateFrom: from.toISOString().split('T')[0],
    dateTo: to.toISOString().split('T')[0],
  }
}

export default function AdminAnalytics() {
  const { t } = useTranslation()
  const [filters, setFilters] = useState<AnalyticsFilters>(getDefaultDateRange)

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1 sm:text-3xl sm:mb-2">
            {t('analytics.title')}
          </h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            {t('analytics.subtitle')}
          </p>
        </div>

        {/* Date range picker */}
        <div className="flex items-center gap-2">
          <DatePicker
            value={filters.dateFrom}
            onChange={(val) => setFilters((f) => ({ ...f, dateFrom: val || undefined }))}
            placeholder={t('analytics.from')}
            className="w-[140px]"
          />
          <span className="text-muted-foreground">—</span>
          <DatePicker
            value={filters.dateTo}
            onChange={(val) => setFilters((f) => ({ ...f, dateTo: val || undefined }))}
            placeholder={t('analytics.to')}
            className="w-[140px]"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="mb-6 w-full sm:w-auto overflow-x-auto">
          <TabsTrigger value="overview">{t('analytics.tabOverview')}</TabsTrigger>
          <TabsTrigger value="products">{t('analytics.tabProducts')}</TabsTrigger>
          <TabsTrigger value="wallet">{t('analytics.tabWallet')}</TabsTrigger>
          <TabsTrigger value="promos">{t('analytics.tabPromos')}</TabsTrigger>
          <TabsTrigger value="geo">{t('analytics.tabGeo')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab filters={filters} />
        </TabsContent>

        <TabsContent value="products">
          <ProductsTab filters={filters} />
        </TabsContent>

        <TabsContent value="wallet">
          <WalletTab filters={filters} />
        </TabsContent>

        <TabsContent value="promos">
          <PromosTab filters={filters} />
        </TabsContent>

        <TabsContent value="geo">
          <GeoTab filters={filters} />
        </TabsContent>
      </Tabs>
    </AppLayout>
  )
}
