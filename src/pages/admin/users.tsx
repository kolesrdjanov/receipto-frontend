import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '@/components/layout/app-layout'
import { UsersTable } from '@/components/admin/users-table'
import { CreateUserModal } from '@/components/admin/create-user-modal'
import { Button } from '@/components/ui/button'
import { UserPlus } from 'lucide-react'

export default function AdminUsers() {
  const { t } = useTranslation()
  const [createModalOpen, setCreateModalOpen] = useState(false)

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="t-h1 text-[28px] mb-1 sm:mb-2">
            {t('admin.users.title')}
          </h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            {t('admin.users.subtitle')}
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <UserPlus className="h-4 w-4" />
          {t('admin.users.createUser')}
        </Button>
      </div>

      <UsersTable />

      <CreateUserModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </AppLayout>
  )
}
