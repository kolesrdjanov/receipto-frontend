import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '@/components/layout/app-layout'
import { PageToolbar } from '@/components/layout/page-toolbar'
import { PageTransition } from '@/components/ui/animated'
import { AddButton } from '@/components/glass/empty-state'
import { UsersTable } from '@/components/admin/users-table'
import { CreateUserModal } from '@/components/admin/create-user-modal'
import { useFabStore } from '@/store/fab'
import { UserPlus } from 'lucide-react'

export default function AdminUsers() {
  const { t } = useTranslation()
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const openCreate = useCallback(() => setCreateModalOpen(true), [])

  // Take over the global mobile FAB so it opens the Create User sheet.
  const setFab = useFabStore((s) => s.setFab)
  const clearFab = useFabStore((s) => s.clearFab)
  useEffect(() => {
    setFab(openCreate)
    return () => clearFab()
  }, [setFab, clearFab, openCreate])

  return (
    <AppLayout>
      <PageTransition>
        <PageToolbar
          className="md:-mx-8 md:-mt-8 md:mb-6"
          title={t('admin.users.title')}
          subtitle={t('admin.users.subtitle')}
          actions={<AddButton onClick={openCreate} label={t('admin.users.createUser')} icon={UserPlus} />}
        />

        <div className="mb-5 md:hidden">
          <h1 className="t-h1 text-[28px]">{t('admin.users.title')}</h1>
          <p className="t-sm mt-1 text-muted-foreground">{t('admin.users.subtitle')}</p>
        </div>

        <UsersTable />
      </PageTransition>

      <CreateUserModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </AppLayout>
  )
}
