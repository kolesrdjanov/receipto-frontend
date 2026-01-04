import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useAdminUsers, useDeleteUser } from '@/hooks/admin/use-admin-users'
import { Loader2, Trash2 } from 'lucide-react'

interface UsersTableProps {
  page: number
  onPageChange: (page: number) => void
}

export function UsersTable({ page, onPageChange }: UsersTableProps) {
  const { t } = useTranslation()
  const { data: response, isLoading, error } = useAdminUsers({ page, limit: 20 })
  const deleteUser = useDeleteUser()
  const users = response?.data ?? []
  const meta = response?.meta

  const [userToDelete, setUserToDelete] = useState<{ id: string; email: string } | null>(null)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const handleDeleteClick = (user: { id: string; email: string }) => {
    setUserToDelete(user)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return

    try {
      await deleteUser.mutateAsync(userToDelete.id)
      toast.success(t('admin.users.deleteSuccess'))
      setUserToDelete(null)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(t('admin.users.deleteError'), {
        description: errorMessage,
      })
    }
  }

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
          Admin
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
        User
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <p className="text-center text-destructive">
            {t('admin.users.loadError', {
              message: error instanceof Error ? error.message : 'Unknown error',
            })}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!users || users.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-muted-foreground">
            {t('admin.users.noUsers')}
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">
                    {user.firstName || user.lastName
                      ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                      : 'No name'}
                  </h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Role</span>
                    {getRoleBadge(user.role)}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {t('admin.users.table.receipts')}
                    </span>
                    <span className="font-medium">{user.receiptCount}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {t('admin.users.table.joined')}
                    </span>
                    <span className="font-medium">{formatDate(user.createdAt)}</span>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => handleDeleteClick({ id: user.id, email: user.email })}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('admin.users.table.delete')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {meta && meta.totalPages > 1 && (
          <div className="pt-2">
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              limit={meta.limit}
              onPageChange={onPageChange}
            />
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>
            {t('admin.users.totalUsers', { count: meta?.total || 0 })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.users.table.firstName')}</TableHead>
                <TableHead>{t('admin.users.table.lastName')}</TableHead>
                <TableHead>{t('admin.users.table.email')}</TableHead>
                <TableHead>{t('admin.users.table.role')}</TableHead>
                <TableHead>{t('admin.users.table.receipts')}</TableHead>
                <TableHead>{t('admin.users.table.joined')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.firstName || '-'}
                  </TableCell>
                  <TableCell className="font-medium">
                    {user.lastName || '-'}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{user.receiptCount}</TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick({ id: user.id, email: user.email })}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {meta && meta.totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                page={meta.page}
                totalPages={meta.totalPages}
                total={meta.total}
                limit={meta.limit}
                onPageChange={onPageChange}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
        title={t('admin.users.deleteTitle')}
        description={t('admin.users.deleteConfirm', { email: userToDelete?.email })}
        onConfirm={handleDeleteConfirm}
        confirmText={t('common.delete')}
        variant="destructive"
        isLoading={deleteUser.isPending}
      />
    </>
  )
}
