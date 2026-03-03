import { useTranslation } from 'react-i18next'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('analytics.chain')}</TableHead>
                <TableHead className="text-right">{t('analytics.avgShare')}</TableHead>
                <TableHead className="text-right">{t('analytics.minShare')}</TableHead>
                <TableHead className="text-right">{t('analytics.maxShare')}</TableHead>
                <TableHead className="text-right">{t('analytics.users')}</TableHead>
                <TableHead className="text-right">{t('analytics.totalSpend')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shares.map((share) => (
                <TableRow key={share.chainName}>
                  <TableCell className="font-medium">{share.chainName}</TableCell>
                  <TableCell className="text-right">{share.avgSharePercent}%</TableCell>
                  <TableCell className="text-right">{share.minSharePercent}%</TableCell>
                  <TableCell className="text-right">{share.maxSharePercent}%</TableCell>
                  <TableCell className="text-right">{share.userCount}</TableCell>
                  <TableCell className="text-right">{Number(share.totalSpend).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  )
}
