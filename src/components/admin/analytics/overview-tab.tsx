import { useTranslation } from 'react-i18next'
import { Database, Package, Store, MapPin, Users } from 'lucide-react'
import { useAnalyticsOverview, useAnalyticsChains, type AnalyticsFilters } from '@/hooks/admin/use-analytics'

interface OverviewTabProps {
  filters: AnalyticsFilters
}

export function OverviewTab({ filters }: OverviewTabProps) {
  const { t } = useTranslation()
  const { data: overview, isLoading: overviewLoading } = useAnalyticsOverview(filters)
  const { data: chains, isLoading: chainsLoading } = useAnalyticsChains(filters)

  const statCards = [
    { label: t('analytics.totalRecords'), value: overview?.totalRecords ?? 0, icon: Database },
    { label: t('analytics.uniqueProducts'), value: overview?.uniqueProducts ?? 0, icon: Package },
    { label: t('analytics.uniqueChains'), value: overview?.uniqueChains ?? 0, icon: Store },
    { label: t('analytics.uniqueCities'), value: overview?.uniqueCities ?? 0, icon: MapPin },
    { label: t('analytics.uniqueUsers'), value: overview?.uniqueUsers ?? 0, icon: Users },
  ]

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <stat.icon className="h-4 w-4" />
              <span className="text-xs font-medium">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold">
              {overviewLoading ? '...' : stat.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Chain overview table */}
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <h3 className="font-semibold">{t('analytics.chainOverview')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">{t('analytics.chain')}</th>
                <th className="text-right p-3 font-medium">{t('analytics.transactions')}</th>
                <th className="text-right p-3 font-medium">{t('analytics.users')}</th>
                <th className="text-right p-3 font-medium">{t('analytics.revenue')}</th>
                <th className="text-right p-3 font-medium">{t('analytics.products')}</th>
                <th className="text-right p-3 font-medium">{t('analytics.cities')}</th>
              </tr>
            </thead>
            <tbody>
              {chainsLoading ? (
                <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">{t('common.loading')}</td></tr>
              ) : !chains?.length ? (
                <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">{t('analytics.noData')}</td></tr>
              ) : (
                chains.map((chain) => (
                  <tr key={chain.chainName} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-medium">{chain.chainName}</td>
                    <td className="p-3 text-right">{chain.transactions.toLocaleString()}</td>
                    <td className="p-3 text-right">{chain.uniqueUsers.toLocaleString()}</td>
                    <td className="p-3 text-right">{Number(chain.totalRevenue).toLocaleString()}</td>
                    <td className="p-3 text-right">{chain.uniqueProducts.toLocaleString()}</td>
                    <td className="p-3 text-right">{chain.cities}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
