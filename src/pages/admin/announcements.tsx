import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '@/components/layout/app-layout'
import { AnnouncementsTable } from '@/components/admin/announcements-table'
import { AnnouncementModal } from '@/components/admin/announcement-modal'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function AdminAnnouncements() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1 sm:text-3xl sm:mb-2">
            {t('admin.announcements.title')}
          </h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            {t('admin.announcements.subtitle')}
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-4 w-4" />
          {t('admin.announcements.createAnnouncement')}
        </Button>
      </div>

      <AnnouncementsTable page={page} onPageChange={setPage} />
      <AnnouncementModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </AppLayout>
  )
}
