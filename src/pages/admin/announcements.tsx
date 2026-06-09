import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { PageTransition } from '@/components/ui/animated'
import { AddButton } from '@/components/glass/empty-state'
import { AnnouncementsTable } from '@/components/admin/announcements-table'
import { AnnouncementModal } from '@/components/admin/announcement-modal'
import { useFabStore } from '@/store/fab'

export default function AdminAnnouncements() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const openCreate = useCallback(() => setCreateModalOpen(true), [])

  // Take over the global mobile FAB so it opens the Create Announcement sheet.
  const setFab = useFabStore((s) => s.setFab)
  const clearFab = useFabStore((s) => s.clearFab)
  useEffect(() => {
    setFab(openCreate)
    return () => clearFab()
  }, [setFab, clearFab, openCreate])

  return (
    <AppLayout>
      <PageTransition>
        <PageHeader
          title={t('admin.announcements.title')}
          subtitle={t('admin.announcements.subtitle')}
          actions={<AddButton onClick={openCreate} label={t('admin.announcements.createAnnouncement')} />}
        />

        <AnnouncementsTable page={page} onPageChange={setPage} />
      </PageTransition>

      <AnnouncementModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </AppLayout>
  )
}
