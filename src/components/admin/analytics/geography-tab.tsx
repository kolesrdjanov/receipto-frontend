import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { HeatmapGrid } from './heatmap-grid'
import {
  useAnalyticsCities,
  useAnalyticsGeoHeatmap,
  useAnalyticsCityDetail,
  type AnalyticsFilters,
  type CityStats,
} from '@/hooks/admin/use-analytics'

interface GeographyTabProps {
  filters: AnalyticsFilters
}

export function GeographyTab({ filters }: GeographyTabProps) {
  const { t } = useTranslation()
  const [expandedCity, setExpandedCity] = useState<string | null>(null)
  const { data: cities, isLoading } = useAnalyticsCities(filters)
  const { data: heatmap } = useAnalyticsGeoHeatmap(filters)

  const topCities = cities?.slice(0, 3) || []

  // Find market leader per city from heatmap data
  const cityLeaders = new Map<string, string>()
  if (heatmap) {
    const cityChainTx = new Map<string, Map<string, number>>()
    for (const cell of heatmap) {
      if (!cityChainTx.has(cell.city)) cityChainTx.set(cell.city, new Map())
      cityChainTx.get(cell.city)!.set(cell.chainName, cell.transactions)
    }
    for (const [city, chainMap] of cityChainTx) {
      let topChain = ''
      let topTx = 0
      for (const [chain, tx] of chainMap) {
        if (tx > topTx) { topChain = chain; topTx = tx }
      }
      if (topChain) cityLeaders.set(city, topChain)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top 3 City Cards */}
      {topCities.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {topCities.map((city, i) => (
            <div key={city.city} className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-bold ${
                  i === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                  i === 1 ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' :
                  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                }`}>
                  #{i + 1}
                </div>
                <div>
                  <div className="font-semibold">{city.city}</div>
                  <div className="text-xs text-muted-foreground">{cityLeaders.get(city.city) ? `${t('analytics.leader')}: ${cityLeaders.get(city.city)}` : ''}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">{t('analytics.transactions')}</span>
                  <div className="font-semibold">{city.transactions.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">{t('analytics.users')}</span>
                  <div className="font-semibold">{city.uniqueUsers.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">{t('analytics.revenue')}</span>
                  <div className="font-semibold">{Number(city.totalRevenue).toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">{t('analytics.chains')}</span>
                  <div className="font-semibold">{city.uniqueChains}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* City Table with expandable rows */}
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <h3 className="font-semibold">{t('analytics.cityBreakdown')}</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>{t('analytics.city')}</TableHead>
              <TableHead className="text-right">{t('analytics.transactions')}</TableHead>
              <TableHead className="text-right">{t('analytics.users')}</TableHead>
              <TableHead className="text-right">{t('analytics.revenue')}</TableHead>
              <TableHead className="text-right">{t('analytics.chains')}</TableHead>
              <TableHead>{t('analytics.leader')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">{t('common.loading')}</TableCell></TableRow>
            ) : !cities?.length ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">{t('analytics.noData')}</TableCell></TableRow>
            ) : (
              cities.map((city) => (
                <CityRow
                  key={city.city}
                  city={city}
                  leader={cityLeaders.get(city.city)}
                  isExpanded={expandedCity === city.city}
                  onToggle={() => setExpandedCity(expandedCity === city.city ? null : city.city)}
                  filters={filters}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Heatmap */}
      {heatmap && heatmap.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold mb-4">{t('analytics.heatmapTitle')}</h3>
          <HeatmapGrid data={heatmap} />
        </div>
      )}
    </div>
  )
}

function CityRow({ city, leader, isExpanded, onToggle, filters }: {
  city: CityStats
  leader?: string
  isExpanded: boolean
  onToggle: () => void
  filters: AnalyticsFilters
}) {
  const { t } = useTranslation()
  const { data: detail } = useAnalyticsCityDetail(isExpanded ? city.city : '', filters)
  const Icon = isExpanded ? ChevronUp : ChevronDown

  return (
    <>
      <TableRow className="cursor-pointer" onClick={onToggle}>
        <TableCell><Icon className="h-4 w-4 text-muted-foreground" /></TableCell>
        <TableCell className="font-medium">{city.city}</TableCell>
        <TableCell className="text-right">{city.transactions.toLocaleString()}</TableCell>
        <TableCell className="text-right">{city.uniqueUsers.toLocaleString()}</TableCell>
        <TableCell className="text-right">{Number(city.totalRevenue).toLocaleString()}</TableCell>
        <TableCell className="text-right">{city.uniqueChains}</TableCell>
        <TableCell>{leader || '-'}</TableCell>
      </TableRow>
      {isExpanded && detail && detail.length > 0 && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={7} className="bg-muted/20">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('analytics.chain')}</TableHead>
                  <TableHead className="text-right">{t('analytics.transactions')}</TableHead>
                  <TableHead className="text-right">{t('analytics.users')}</TableHead>
                  <TableHead className="text-right">{t('analytics.revenue')}</TableHead>
                  <TableHead className="text-right">{t('analytics.products')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.map((d) => (
                  <TableRow key={d.chainName}>
                    <TableCell className="font-medium">{d.chainName}</TableCell>
                    <TableCell className="text-right">{d.transactions.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{d.users.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{Number(d.revenue).toLocaleString()}</TableCell>
                    <TableCell className="text-right">{d.products}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}
