import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '@/components/layout/app-layout'
import { PageContent } from '@/components/layout/page-content'
import { PageHeader } from '@/components/layout/page-header'
import { PageTransition } from '@/components/ui/animated'
import { RatingsTable } from '@/components/admin/ratings-table'

export default function AdminRatings() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)

  return (
    <AppLayout>
      <PageTransition>
        <PageHeader title={t('admin.ratings.title')} subtitle={t('admin.ratings.subtitle')} />

        <PageContent>
        <RatingsTable page={page} onPageChange={setPage} />
        </PageContent>
      </PageTransition>
    </AppLayout>
  )
}
