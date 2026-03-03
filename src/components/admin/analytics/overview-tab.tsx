import { useTranslation } from 'react-i18next'
import { Database, Package, Store, MapPin, Users } from 'lucide-react'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('analytics.chain')}</TableHead>
            <TableHead className="text-right">{t('analytics.transactions')}</TableHead>
            <TableHead className="text-right">{t('analytics.users')}</TableHead>
            <TableHead className="text-right">{t('analytics.revenue')}</TableHead>
            <TableHead className="text-right">{t('analytics.products')}</TableHead>
            <TableHead className="text-right">{t('analytics.cities')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {chainsLoading ? (
            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{t('common.loading')}</TableCell></TableRow>
          ) : !chains?.length ? (
            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{t('analytics.noData')}</TableCell></TableRow>
          ) : (
            chains.map((chain) => (
              <TableRow key={chain.chainName}>
                <TableCell className="font-medium">{chain.chainName}</TableCell>
                <TableCell className="text-right">{chain.transactions.toLocaleString()}</TableCell>
                <TableCell className="text-right">{chain.uniqueUsers.toLocaleString()}</TableCell>
                <TableCell className="text-right">{Number(chain.totalRevenue).toLocaleString()}</TableCell>
                <TableCell className="text-right">{chain.uniqueProducts.toLocaleString()}</TableCell>
                <TableCell className="text-right">{chain.cities}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
