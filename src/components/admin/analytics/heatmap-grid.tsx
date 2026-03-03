import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { GeoHeatmapCell } from '@/hooks/admin/use-analytics'

interface HeatmapGridProps {
  data: GeoHeatmapCell[]
  metric?: 'transactions' | 'revenue' | 'users'
}

export function HeatmapGrid({ data, metric: initialMetric = 'transactions' }: HeatmapGridProps) {
  const { t } = useTranslation()
  const [metric, setMetric] = useState(initialMetric)

  if (!data?.length) return null

  // Extract unique chains and cities
  const chains = [...new Set(data.map((d) => d.chainName))].sort()
  const cities = [...new Set(data.map((d) => d.city))]

  // Sort cities by total transactions
  const cityTotals = new Map<string, number>()
  for (const d of data) {
    cityTotals.set(d.city, (cityTotals.get(d.city) || 0) + d.transactions)
  }
  cities.sort((a, b) => (cityTotals.get(b) || 0) - (cityTotals.get(a) || 0))

  // Limit to top 10 cities and top 10 chains for readability
  const topCities = cities.slice(0, 10)
  const chainTotals = new Map<string, number>()
  for (const d of data) {
    chainTotals.set(d.chainName, (chainTotals.get(d.chainName) || 0) + d.transactions)
  }
  const topChains = chains.sort((a, b) => (chainTotals.get(b) || 0) - (chainTotals.get(a) || 0)).slice(0, 10)

  // Build lookup
  const lookup = new Map<string, GeoHeatmapCell>()
  for (const d of data) {
    lookup.set(`${d.chainName}|${d.city}`, d)
  }

  // Find max value for color scale
  const getValue = (cell: GeoHeatmapCell | undefined): number => {
    if (!cell) return 0
    if (metric === 'revenue') return Number(cell.revenue)
    return cell[metric]
  }

  let maxVal = 0
  for (const d of data) {
    const v = getValue(d)
    if (v > maxVal) maxVal = v
  }

  const getIntensity = (value: number) => {
    if (maxVal === 0) return 0
    return value / maxVal
  }

  const metricOptions = [
    { key: 'transactions' as const, label: t('analytics.transactions') },
    { key: 'revenue' as const, label: t('analytics.revenue') },
    { key: 'users' as const, label: t('analytics.users') },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {metricOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setMetric(opt.key)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              metric === opt.key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:bg-muted'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Header row with city names */}
          <div className="flex">
            <div className="w-28 shrink-0" />
            {topCities.map((city) => (
              <div key={city} className="w-20 shrink-0 text-[10px] font-medium text-muted-foreground text-center truncate px-0.5">
                {city}
              </div>
            ))}
          </div>

          {/* Chain rows */}
          {topChains.map((chain) => (
            <div key={chain} className="flex items-center">
              <div className="w-28 shrink-0 text-xs font-medium truncate pr-2">{chain}</div>
              {topCities.map((city) => {
                const cell = lookup.get(`${chain}|${city}`)
                const val = getValue(cell)
                const intensity = getIntensity(val)
                return (
                  <div
                    key={city}
                    className="w-20 h-8 shrink-0 m-0.5 rounded flex items-center justify-center text-[10px] border border-border/30"
                    style={{
                      backgroundColor: intensity > 0
                        ? `hsl(217, 91%, ${95 - intensity * 55}%)`
                        : 'transparent',
                      color: intensity > 0.5 ? 'white' : undefined,
                    }}
                    title={`${chain} - ${city}: ${val.toLocaleString()}`}
                  >
                    {val > 0 ? val.toLocaleString() : ''}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
