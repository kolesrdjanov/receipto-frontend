import { useTranslation } from 'react-i18next'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useAnalyticsWalletShare, type AnalyticsFilters } from '@/hooks/admin/use-analytics'

const COLORS = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#f97316', // orange
]

interface WalletTabProps {
  filters: AnalyticsFilters
}

export function WalletTab({ filters }: WalletTabProps) {
  const { t } = useTranslation()
  const { data: shares, isLoading } = useAnalyticsWalletShare(filters)

  const chartData = shares?.slice(0, 8).map((s, i) => ({
    name: s.chainName,
    value: Number(s.avgSharePercent),
    fill: COLORS[i % COLORS.length],
  }))

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="text-center text-muted-foreground py-12">{t('common.loading')}</div>
      ) : !shares?.length ? (
        <div className="text-center text-muted-foreground py-12">{t('analytics.noData')}</div>
      ) : (
        <>
          {/* Pie chart */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold mb-4">{t('analytics.walletShareChart')}</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    dataKey="value"
                    label={({ name, value }) => `${name} ${value}%`}
                    labelLine
                  >
                    {chartData?.map((entry, i) => (
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
          </div>

          {/* Detail table */}
          <div className="rounded-lg border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">{t('analytics.chain')}</th>
                    <th className="text-right p-3 font-medium">{t('analytics.avgShare')}</th>
                    <th className="text-right p-3 font-medium">{t('analytics.minShare')}</th>
                    <th className="text-right p-3 font-medium">{t('analytics.maxShare')}</th>
                    <th className="text-right p-3 font-medium">{t('analytics.users')}</th>
                    <th className="text-right p-3 font-medium">{t('analytics.totalSpend')}</th>
                  </tr>
                </thead>
                <tbody>
                  {shares.map((share) => (
                    <tr key={share.chainName} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3 font-medium">{share.chainName}</td>
                      <td className="p-3 text-right">{share.avgSharePercent}%</td>
                      <td className="p-3 text-right">{share.minSharePercent}%</td>
                      <td className="p-3 text-right">{share.maxSharePercent}%</td>
                      <td className="p-3 text-right">{share.userCount}</td>
                      <td className="p-3 text-right">{Number(share.totalSpend).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
