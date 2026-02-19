import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, TrendingUp } from 'lucide-react'
import { usePriceHistory } from '@/hooks/items/use-items'
import { useSettingsStore } from '@/store/settings'
import { format } from 'date-fns'

interface PriceHistoryChartProps {
  productId: string
}

// Secondary store colors — primary store uses the accent color
const SECONDARY_COLORS = [
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
]

export function PriceHistoryChart({ productId }: PriceHistoryChartProps) {
  const { t } = useTranslation()
  const { data: history, isLoading } = usePriceHistory(productId, { limit: 50 })
  const { currency } = useSettingsStore()

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: currency || 'RSD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const { chartData, stores, yDomain } = useMemo(() => {
    if (!history || history.length === 0) {
      return { chartData: [], stores: [], yDomain: [0, 100] as [number, number] }
    }

    const uniqueStores = [...new Set(history.map((h) => h.storeName))]

    const dataByDate = new Map<string, Record<string, number>>()

    history.forEach((point) => {
      const dateStr = format(new Date(point.date), 'MMM d')
      if (!dataByDate.has(dateStr)) {
        dataByDate.set(dateStr, {})
      }
      dataByDate.get(dateStr)![point.storeName] = point.price
    })

    const sortedHistory = [...history].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    const processedDates = new Set<string>()
    const result: Array<{ date: string; [key: string]: string | number }> = []

    sortedHistory.forEach((point) => {
      const dateStr = format(new Date(point.date), 'MMM d')
      if (!processedDates.has(dateStr)) {
        processedDates.add(dateStr)
        const dataPoint: { date: string; [key: string]: string | number } = { date: dateStr }
        const dateData = dataByDate.get(dateStr) || {}
        uniqueStores.forEach((store) => {
          if (dateData[store] !== undefined) {
            dataPoint[store] = dateData[store]
          }
        })
        result.push(dataPoint)
      }
    })

    // Calculate Y-axis domain with padding so the line isn't flat
    const allPrices = history.map((h) => h.price)
    const minVal = Math.min(...allPrices)
    const maxVal = Math.max(...allPrices)
    const padding = Math.max((maxVal - minVal) * 0.2, maxVal * 0.1)
    const yDomain: [number, number] = [
      Math.max(0, Math.floor(minVal - padding)),
      Math.ceil(maxVal + padding),
    ]

    return { chartData: result, stores: uniqueStores, yDomain }
  }, [history])

  const getStoreColor = (index: number) => {
    if (index === 0) return 'var(--primary)'
    return SECONDARY_COLORS[(index - 1) % SECONDARY_COLORS.length]
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border rounded-lg shadow-lg p-3">
          <p className="font-medium mb-2 text-sm">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium">{formatPrice(entry.value)}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            {t('items.priceHistory')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            {t('items.priceHistory')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            {t('items.noHistory')}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <TrendingUp className="h-4 w-4 shrink-0" />
          <span className="truncate">{t('items.priceHistory')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pl-0 pr-2 sm:pl-6 sm:pr-6">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
            <defs>
              {stores.map((store, index) => {
                const color = getStoreColor(index)
                return (
                  <linearGradient key={store} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                  </linearGradient>
                )
              })}
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-muted/50"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              className="fill-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}`}
              width={45}
              domain={yDomain}
              className="fill-muted-foreground"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
              formatter={(value) => <span className="text-foreground text-xs">{value}</span>}
            />
            {stores.map((store, index) => {
              const color = getStoreColor(index)
              return (
                <Area
                  key={store}
                  type="monotone"
                  dataKey={store}
                  name={store}
                  stroke={color}
                  strokeWidth={2.5}
                  fill={`url(#gradient-${index})`}
                  dot={{ r: 3, fill: color, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: color, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                  connectNulls
                />
              )
            })}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
