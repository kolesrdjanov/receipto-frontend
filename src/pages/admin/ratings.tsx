import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '@/components/layout/app-layout'
import { RatingsTable } from '@/components/admin/ratings-table'

export default function AdminRatings() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1 sm:text-3xl sm:mb-2">
            {t('admin.ratings.title')}
          </h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            {t('admin.ratings.subtitle')}
          </p>
        </div>
      </div>

      <RatingsTable page={page} onPageChange={setPage} />
    </AppLayout>
  )
}
