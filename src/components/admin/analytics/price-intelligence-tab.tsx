import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend,
  BarChart, Bar,
} from 'recharts'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import {
  useAnalyticsCpi,
  useAnalyticsPriceMovers,
  useAnalyticsTopProducts,
  useAnalyticsProductPrices,
  useAnalyticsPriceTrends,
  type AnalyticsFilters,
  type PriceMover,
} from '@/hooks/admin/use-analytics'

interface PriceIntelligenceTabProps {
  filters: AnalyticsFilters
}

const CHAIN_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316']

export function PriceIntelligenceTab({ filters }: PriceIntelligenceTabProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const debouncedSearch = useDebouncedValue(search, 300)

  const { data: cpi } = useAnalyticsCpi(filters)
  const { data: movers } = useAnalyticsPriceMovers(filters)
  const { data: products, isLoading } = useAnalyticsTopProducts(filters)

  const cpiData = cpi?.map((p) => ({ month: p.month, index: Number(p.indexValue) }))

  const filtered = products?.filter((p) =>
    !debouncedSearch || p.displayName.toLowerCase().includes(debouncedSearch.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Row 1: CPI + Top Movers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPI Chart */}
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold mb-4">{t('analytics.cpiTitle')}</h3>
          {cpiData && cpiData.length > 0 ? (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cpiData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null
                      return (
                        <div className="bg-popover border border-border rounded-lg shadow-md p-3">
                          <p className="font-semibold text-sm">{label}</p>
                          <p className="text-sm">CPI: {Number(payload[0].value).toFixed(1)}</p>
                        </div>
                      )
                    }}
                  />
                  <ReferenceLine y={100} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: '100', position: 'left', fontSize: 10 }} />
                  <Line type="monotone" dataKey="index" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">{t('analytics.noData')}</div>
          )}
        </div>

        {/* Top Price Movers */}
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold mb-4">{t('analytics.topMovers')}</h3>
          {movers && movers.length > 0 ? (
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {movers.slice(0, 10).map((mover: PriceMover) => {
                const change = Number(mover.changePercent)
                const isUp = change > 0
                return (
                  <div key={mover.productItemId} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                    <div className="text-sm truncate flex-1 pr-2">{mover.displayName}</div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {Number(mover.previousPrice).toLocaleString()} → {Number(mover.currentPrice).toLocaleString()}
                      </span>
                      <span className={`flex items-center text-xs font-semibold px-1.5 py-0.5 rounded ${
                        isUp
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {Math.abs(change).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">{t('analytics.noData')}</div>
          )}
        </div>
      </div>

      {/* Row 2: Product Search + Table */}
      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('analytics.searchProducts')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-background"
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>{t('analytics.productName')}</TableHead>
              <TableHead className="text-right">{t('analytics.purchases')}</TableHead>
              <TableHead className="text-right">{t('analytics.avgPrice')}</TableHead>
              <TableHead className="text-right">{t('analytics.stores')}</TableHead>
              <TableHead className="text-right">{t('analytics.buyers')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{t('common.loading')}</TableCell></TableRow>
            ) : !filtered?.length ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{t('analytics.noData')}</TableCell></TableRow>
            ) : (
              filtered.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  isExpanded={expandedId === product.id}
                  onToggle={() => setExpandedId(expandedId === product.id ? null : product.id)}
                  filters={filters}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function ProductRow({ product, isExpanded, onToggle, filters }: {
  product: any
  isExpanded: boolean
  onToggle: () => void
  filters: AnalyticsFilters
}) {
  const { t } = useTranslation()
  const { data: prices } = useAnalyticsProductPrices(
    product.id,
    isExpanded ? { dateFrom: filters.dateFrom, dateTo: filters.dateTo } : undefined,
  )
  const { data: priceTrends } = useAnalyticsPriceTrends(
    isExpanded ? product.id : '',
    isExpanded ? { dateFrom: filters.dateFrom, dateTo: filters.dateTo } : undefined,
  )

  const Icon = isExpanded ? ChevronUp : ChevronDown

  // Transform price trends into chart data grouped by month, with chains as separate keys
  const trendChartData = (() => {
    if (!priceTrends?.length) return null
    const months = [...new Set(priceTrends.map((p) => p.month))].sort()
    const chains = [...new Set(priceTrends.map((p) => p.chainName))]
    return months.map((month) => {
      const point: Record<string, any> = { month }
      for (const chain of chains) {
        const entry = priceTrends.find((p) => p.month === month && p.chainName === chain)
        if (entry) point[chain] = Number(entry.avgPrice)
      }
      return point
    })
  })()

  const trendChains = priceTrends ? [...new Set(priceTrends.map((p) => p.chainName))] : []

  return (
    <>
      <TableRow className="cursor-pointer" onClick={onToggle}>
        <TableCell><Icon className="h-4 w-4 text-muted-foreground" /></TableCell>
        <TableCell className="font-medium">{product.displayName}</TableCell>
        <TableCell className="text-right">{product.purchaseCount}</TableCell>
        <TableCell className="text-right">{Number(product.avgPrice).toLocaleString()} {product.currency}</TableCell>
        <TableCell className="text-right">{product.storeCount}</TableCell>
        <TableCell className="text-right">{product.uniqueBuyers}</TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={6} className="bg-muted/20 p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Price trend line chart */}
              {trendChartData && trendChartData.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-3">{t('analytics.priceTrend')}</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={trendChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null
                          return (
                            <div className="bg-popover border border-border rounded-lg shadow-md p-3 space-y-0.5">
                              <p className="font-semibold text-xs">{label}</p>
                              {payload.map((p) => (
                                <p key={p.dataKey as string} className="text-xs" style={{ color: p.color }}>
                                  {p.dataKey as string}: {Number(p.value).toLocaleString()} {product.currency}
                                </p>
                              ))}
                            </div>
                          )
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {trendChains.map((chain, i) => (
                        <Line
                          key={chain}
                          type="monotone"
                          dataKey={chain}
                          stroke={CHAIN_COLORS[i % CHAIN_COLORS.length]}
                          strokeWidth={1.5}
                          dot={{ r: 2 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Price by chain bar chart */}
              {prices && prices.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-3">{t('analytics.priceByChain')}</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={prices} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="chainName" type="category" width={100} tick={{ fontSize: 10 }} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null
                          const d = payload[0]
                          return (
                            <div className="bg-popover border border-border rounded-lg shadow-md p-3">
                              <p className="font-semibold text-sm">{d.payload.chainName}</p>
                              <p className="text-sm">{Number(d.value).toLocaleString()} {prices[0]?.currency || ''}</p>
                            </div>
                          )
                        }}
                      />
                      <Bar dataKey="avgPrice" name={t('analytics.avgPrice')} fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}
