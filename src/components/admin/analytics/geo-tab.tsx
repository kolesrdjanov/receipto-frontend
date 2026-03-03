import { useTranslation } from 'react-i18next'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { useAnalyticsCities, type AnalyticsFilters } from '@/hooks/admin/use-analytics'

interface GeoTabProps {
  filters: AnalyticsFilters
}

export function GeoTab({ filters }: GeoTabProps) {
  const { t } = useTranslation()
  const { data: cities, isLoading } = useAnalyticsCities(filters)

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('analytics.city')}</TableHead>
          <TableHead className="text-right">{t('analytics.transactions')}</TableHead>
          <TableHead className="text-right">{t('analytics.users')}</TableHead>
          <TableHead className="text-right">{t('analytics.revenue')}</TableHead>
          <TableHead className="text-right">{t('analytics.stores')}</TableHead>
          <TableHead className="text-right">{t('analytics.chains')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{t('common.loading')}</TableCell></TableRow>
        ) : !cities?.length ? (
          <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{t('analytics.noData')}</TableCell></TableRow>
        ) : (
          cities.map((city) => (
            <TableRow key={city.city}>
              <TableCell className="font-medium">{city.city}</TableCell>
              <TableCell className="text-right">{city.transactions.toLocaleString()}</TableCell>
              <TableCell className="text-right">{city.uniqueUsers.toLocaleString()}</TableCell>
              <TableCell className="text-right">{Number(city.totalRevenue).toLocaleString()}</TableCell>
              <TableCell className="text-right">{city.uniqueStores}</TableCell>
              <TableCell className="text-right">{city.uniqueChains}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
