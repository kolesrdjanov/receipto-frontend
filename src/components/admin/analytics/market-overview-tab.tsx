import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Database, Package, Store, MapPin, Users } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { KpiCard } from './kpi-card'
import { Sparkline } from './sparkline'
import {
  useAnalyticsOverviewComparison,
  useAnalyticsOverviewTrend,
  useAnalyticsChains,
  useAnalyticsChainTrends,
  type AnalyticsFilters,
} from '@/hooks/admin/use-analytics'

interface MarketOverviewTabProps {
  filters: AnalyticsFilters
}

export function MarketOverviewTab({ filters }: MarketOverviewTabProps) {
  const { t } = useTranslation()
  const { data: comparison, isLoading: compLoading } = useAnalyticsOverviewComparison(filters)
  const { data: trend } = useAnalyticsOverviewTrend(filters)
  const { data: chains, isLoading: chainsLoading } = useAnalyticsChains(filters)
  const { data: chainTrends } = useAnalyticsChainTrends(filters)

  const current = comparison?.current
  const previous = comparison?.previous

  // Build sparkline data per chain
  const chainSparklines = useMemo(() => {
    if (!chainTrends) return new Map<string, number[]>()
    const map = new Map<string, Map<string, number>>()
    for (const pt of chainTrends) {
      if (!map.has(pt.chainName)) map.set(pt.chainName, new Map())
      map.get(pt.chainName)!.set(pt.month, pt.transactions)
    }
    const months = [...new Set(chainTrends.map((p) => p.month))].sort()
    const result = new Map<string, number[]>()
    for (const [chain, monthMap] of map) {
      result.set(chain, months.map((m) => monthMap.get(m) || 0))
    }
    return result
  }, [chainTrends])

  // Compute market share
  const totalTransactions = chains?.reduce((s, c) => s + c.transactions, 0) || 0

  const trendData = trend?.map((pt) => ({
    month: pt.month,
    transactions: pt.transactions,
    revenue: Number(pt.totalRevenue),
    activeUsers: pt.activeUsers,
  }))

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard
          label={t('analytics.totalRecords')}
          value={current?.totalRecords ?? 0}
          previousValue={previous?.totalRecords}
          icon={Database}
        />
        <KpiCard
          label={t('analytics.uniqueProducts')}
          value={current?.uniqueProducts ?? 0}
          previousValue={previous?.uniqueProducts}
          icon={Package}
        />
        <KpiCard
          label={t('analytics.uniqueChains')}
          value={current?.uniqueChains ?? 0}
          previousValue={previous?.uniqueChains}
          icon={Store}
        />
        <KpiCard
          label={t('analytics.uniqueCities')}
          value={current?.uniqueCities ?? 0}
          previousValue={previous?.uniqueCities}
          icon={MapPin}
        />
        <KpiCard
          label={t('analytics.uniqueUsers')}
          value={current?.uniqueUsers ?? 0}
          previousValue={previous?.uniqueUsers}
          icon={Users}
        />
      </div>

      {/* Trend Chart */}
      {trendData && trendData.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold mb-4">{t('analytics.marketTrend')}</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="bg-popover/95 backdrop-blur-sm border border-border/50 rounded-xl shadow-xl p-3 space-y-1">
                        <p className="font-semibold text-sm">{label}</p>
                        {payload.map((p) => (
                          <p key={p.dataKey as string} className="text-xs" style={{ color: p.color }}>
                            {p.name}: {Number(p.value).toLocaleString()}
                          </p>
                        ))}
                      </div>
                    )
                  }}
                />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="transactions"
                  name={t('analytics.transactions')}
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.1}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  name={t('analytics.revenue')}
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.1}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="activeUsers"
                  name={t('analytics.activeUsers')}
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Chain Leaderboard */}
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <h3 className="font-semibold">{t('analytics.chainLeaderboard')}</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('analytics.chain')}</TableHead>
              <TableHead className="text-right">{t('analytics.transactions')}</TableHead>
              <TableHead className="text-right">{t('analytics.users')}</TableHead>
              <TableHead className="text-right">{t('analytics.revenue')}</TableHead>
              <TableHead className="text-right">{t('analytics.products')}</TableHead>
              <TableHead className="text-right">{t('analytics.cities')}</TableHead>
              <TableHead className="text-right">{t('analytics.marketShare')}</TableHead>
              <TableHead>{t('analytics.trend')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chainsLoading || compLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">{t('common.loading')}</TableCell></TableRow>
            ) : !chains?.length ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">{t('analytics.noData')}</TableCell></TableRow>
            ) : (
              chains.map((chain) => {
                const share = totalTransactions > 0
                  ? (chain.transactions / totalTransactions * 100).toFixed(1)
                  : '0'
                const sparkData = chainSparklines.get(chain.chainName) || []
                return (
                  <TableRow key={chain.chainName}>
                    <TableCell className="font-medium">{chain.chainName}</TableCell>
                    <TableCell className="text-right">{chain.transactions.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{chain.uniqueUsers.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{Number(chain.totalRevenue).toLocaleString()}</TableCell>
                    <TableCell className="text-right">{chain.uniqueProducts.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{chain.cities}</TableCell>
                    <TableCell className="text-right">{share}%</TableCell>
                    <TableCell>
                      <Sparkline data={sparkData} />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
