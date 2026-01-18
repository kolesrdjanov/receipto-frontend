import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LineChart,
  Line,
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

const STORE_COLORS = [
  'hsl(var(--primary))',
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

  const { chartData, stores } = useMemo(() => {
    if (!history || history.length === 0) {
      return { chartData: [], stores: [] }
    }

    // Get unique stores
    const uniqueStores = [...new Set(history.map((h) => h.storeName))]

    // Group by date and store
    const dataByDate = new Map<string, Record<string, number>>()

    history.forEach((point) => {
      const dateStr = format(new Date(point.date), 'MMM d')
      if (!dataByDate.has(dateStr)) {
        dataByDate.set(dateStr, {})
      }
      dataByDate.get(dateStr)![point.storeName] = point.price
    })

    // Convert to chart format (sorted by date)
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

    return { chartData: result, stores: uniqueStores }
  }, [history])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border rounded-lg shadow-lg p-3">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatPrice(entry.value)}
            </p>
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
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData} margin={{ left: 0, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}`}
              width={45}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            {stores.map((store, index) => (
              <Line
                key={store}
                type="monotone"
                dataKey={store}
                name={store}
                stroke={STORE_COLORS[index % STORE_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
