import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, UserPlus, UserCheck, ArrowRight } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area,
  PieChart, Pie, Cell,
} from 'recharts'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import {
  useAnalyticsUserActivity,
  useAnalyticsWalletShare,
  useAnalyticsWalletTrend,
  useAnalyticsChainSwitching,
  type AnalyticsFilters,
} from '@/hooks/admin/use-analytics'

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316']

interface ConsumerBehaviorTabProps {
  filters: AnalyticsFilters
}

export function ConsumerBehaviorTab({ filters }: ConsumerBehaviorTabProps) {
  const { t } = useTranslation()
  const { data: activity } = useAnalyticsUserActivity(filters)
  const { data: walletShares } = useAnalyticsWalletShare(filters)
  const { data: walletTrend } = useAnalyticsWalletTrend(filters)
  const { data: switching } = useAnalyticsChainSwitching(filters)

  // Retention summary
  const latestMonth = activity?.length ? activity[activity.length - 1] : null
  const totalEverActive = activity?.reduce((s, a) => s + a.newUsers, 0) || 0

  // Wallet share pie data
  const pieData = walletShares?.slice(0, 8).map((s, i) => ({
    name: s.chainName,
    value: Number(s.avgSharePercent),
    fill: COLORS[i % COLORS.length],
  }))

  // Wallet trend area chart data
  const walletTrendData = useMemo(() => {
    if (!walletTrend?.length) return null
    // Get top 5 chains by total share
    const chainTotals = new Map<string, number>()
    for (const pt of walletTrend) {
      chainTotals.set(pt.chainName, (chainTotals.get(pt.chainName) || 0) + Number(pt.avgSharePercent))
    }
    const topChains = [...chainTotals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name)

    const months = [...new Set(walletTrend.map((p) => p.month))].sort()
    return {
      chains: topChains,
      data: months.map((month) => {
        const point: Record<string, any> = { month }
        let otherTotal = 0
        const monthEntries = walletTrend.filter((p) => p.month === month)
        for (const entry of monthEntries) {
          if (topChains.includes(entry.chainName)) {
            point[entry.chainName] = Number(entry.avgSharePercent)
          } else {
            otherTotal += Number(entry.avgSharePercent)
          }
        }
        if (otherTotal > 0) point[t('analytics.other')] = Number(otherTotal.toFixed(1))
        return point
      }),
    }
  }, [walletTrend, t])

  return (
    <div className="space-y-6">
      {/* Row 1: User Activity + Retention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Activity Stacked Bar */}
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold mb-4">{t('analytics.userActivity')}</h3>
          {activity && activity.length > 0 ? (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activity}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null
                      return (
                        <div className="bg-popover/95 backdrop-blur-sm border border-border/50 rounded-xl shadow-xl p-3 space-y-0.5">
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
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="newUsers" name={t('analytics.newUsersLabel')} stackId="a" fill="#3b82f6" />
                  <Bar dataKey="returningUsers" name={t('analytics.returningUsersLabel')} stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">{t('analytics.noData')}</div>
          )}
        </div>

        {/* Retention Summary */}
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold mb-4">{t('analytics.retentionSummary')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Users className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">{t('analytics.totalUsersEver')}</span>
              </div>
              <div className="text-xl font-bold">{totalEverActive.toLocaleString()}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <UserCheck className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">{t('analytics.activeThisMonth')}</span>
              </div>
              <div className="text-xl font-bold">{latestMonth?.totalActive?.toLocaleString() || 0}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <UserPlus className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">{t('analytics.newThisMonth')}</span>
              </div>
              <div className="text-xl font-bold">{latestMonth?.newUsers?.toLocaleString() || 0}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Users className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">{t('analytics.retentionRate')}</span>
              </div>
              <div className="text-xl font-bold">
                {latestMonth && totalEverActive > 0
                  ? ((latestMonth.returningUsers / totalEverActive) * 100).toFixed(1)
                  : 0}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Wallet Share */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold mb-4">{t('analytics.walletShareChart')}</h3>
          {pieData && pieData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    dataKey="value"
                    label={({ name, value }) => `${name} ${value}%`}
                    labelLine
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload
                      return (
                        <div className="bg-popover/95 backdrop-blur-sm border border-border/50 rounded-xl shadow-xl p-3">
                          <p className="font-semibold text-sm">{d.name}</p>
                          <p className="text-sm">{d.value}%</p>
                        </div>
                      )
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">{t('analytics.noData')}</div>
          )}
        </div>

        {/* Wallet Trend Stacked Area */}
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold mb-4">{t('analytics.walletShareTrend')}</h3>
          {walletTrendData && walletTrendData.data.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={walletTrendData.data}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null
                      return (
                        <div className="bg-popover/95 backdrop-blur-sm border border-border/50 rounded-xl shadow-xl p-3 space-y-0.5">
                          <p className="font-semibold text-sm">{label}</p>
                          {payload.map((p) => (
                            <p key={p.dataKey as string} className="text-xs" style={{ color: p.color }}>
                              {p.dataKey as string}: {Number(p.value).toFixed(1)}%
                            </p>
                          ))}
                        </div>
                      )
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {[...walletTrendData.chains, t('analytics.other')].map((chain, i) => (
                    <Area
                      key={chain}
                      type="monotone"
                      dataKey={chain}
                      stackId="1"
                      stroke={COLORS[i % COLORS.length]}
                      fill={COLORS[i % COLORS.length]}
                      fillOpacity={0.6}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">{t('analytics.noData')}</div>
          )}
        </div>
      </div>

      {/* Row 3: Chain Switching */}
      <div className="rounded-lg bg-card">
        <div className="p-4">
          <h3 className="font-semibold">{t('analytics.chainSwitching')}</h3>
          <p className="text-xs text-muted-foreground mt-1">{t('analytics.chainSwitchingDesc')}</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('analytics.fromChain')}</TableHead>
              <TableHead className="w-10"></TableHead>
              <TableHead>{t('analytics.toChain')}</TableHead>
              <TableHead className="text-right">{t('analytics.users')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!switching?.length ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">{t('analytics.noData')}</TableCell></TableRow>
            ) : (
              switching.map((s, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{s.fromChain}</TableCell>
                  <TableCell><ArrowRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                  <TableCell className="font-medium">{s.toChain}</TableCell>
                  <TableCell className="text-right">{s.userCount}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
