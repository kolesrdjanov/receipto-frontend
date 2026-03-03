import { useTranslation } from 'react-i18next'
import { useAnalyticsCities, type AnalyticsFilters } from '@/hooks/admin/use-analytics'

interface GeoTabProps {
  filters: AnalyticsFilters
}

export function GeoTab({ filters }: GeoTabProps) {
  const { t } = useTranslation()
  const { data: cities, isLoading } = useAnalyticsCities(filters)

  return (
    <div className="rounded-lg border bg-card">
      <div className="p-4 border-b">
        <h3 className="font-semibold">{t('analytics.cityBreakdown')}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">{t('analytics.city')}</th>
              <th className="text-right p-3 font-medium">{t('analytics.transactions')}</th>
              <th className="text-right p-3 font-medium">{t('analytics.users')}</th>
              <th className="text-right p-3 font-medium">{t('analytics.revenue')}</th>
              <th className="text-right p-3 font-medium">{t('analytics.stores')}</th>
              <th className="text-right p-3 font-medium">{t('analytics.chains')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">{t('common.loading')}</td></tr>
            ) : !cities?.length ? (
              <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">{t('analytics.noData')}</td></tr>
            ) : (
              cities.map((city) => (
                <tr key={city.city} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3 font-medium">{city.city}</td>
                  <td className="p-3 text-right">{city.transactions.toLocaleString()}</td>
                  <td className="p-3 text-right">{city.uniqueUsers.toLocaleString()}</td>
                  <td className="p-3 text-right">{Number(city.totalRevenue).toLocaleString()}</td>
                  <td className="p-3 text-right">{city.uniqueStores}</td>
                  <td className="p-3 text-right">{city.uniqueChains}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
