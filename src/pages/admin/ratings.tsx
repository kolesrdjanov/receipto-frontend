import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '@/components/layout/app-layout'
import { PageToolbar } from '@/components/layout/page-toolbar'
import { PageTransition } from '@/components/ui/animated'
import { RatingsTable } from '@/components/admin/ratings-table'

export default function AdminRatings() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)

  return (
    <AppLayout>
      <PageTransition>
        <PageToolbar
          className="md:-mx-8 md:-mt-8 md:mb-6"
          title={t('admin.ratings.title')}
          subtitle={t('admin.ratings.subtitle')}
        />

        <div className="mb-5 md:hidden">
          <h1 className="t-h1 text-[28px]">{t('admin.ratings.title')}</h1>
          <p className="t-sm mt-1 text-muted-foreground">{t('admin.ratings.subtitle')}</p>
        </div>

        <RatingsTable page={page} onPageChange={setPage} />
      </PageTransition>
    </AppLayout>
  )
}
