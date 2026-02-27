import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
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
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAdminUsers, useDeleteUser, type SortField, type SortOrder } from '@/hooks/admin/use-admin-users'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { formatDateTime } from '@/lib/date-utils'
import { Loader2, Trash2, Search, X, Eye, ArrowUpDown, ArrowUp, ArrowDown, Check, Minus, Filter } from 'lucide-react'

interface UsersTableProps {
  page: number
  onPageChange: (page: number) => void
}

export function UsersTable({ page, onPageChange }: UsersTableProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('DESC')
  const [showFilters, setShowFilters] = useState(false)
  const [minReceipts, setMinReceipts] = useState('')
  const [maxReceipts, setMaxReceipts] = useState('')
  const [minWarranties, setMinWarranties] = useState('')
  const [maxWarranties, setMaxWarranties] = useState('')
  const [joinedFrom, setJoinedFrom] = useState('')
  const [joinedTo, setJoinedTo] = useState('')
  const [googleAuthFilter, setGoogleAuthFilter] = useState<'all' | 'yes' | 'no'>('all')
  const debouncedSearch = useDebouncedValue(search, 500)
  const debouncedMinReceipts = useDebouncedValue(minReceipts, 500)
  const debouncedMaxReceipts = useDebouncedValue(maxReceipts, 500)
  const debouncedMinWarranties = useDebouncedValue(minWarranties, 500)
  const debouncedMaxWarranties = useDebouncedValue(maxWarranties, 500)

  const hasActiveFilters = minReceipts || maxReceipts || minWarranties || maxWarranties || joinedFrom || joinedTo || googleAuthFilter !== 'all'

  const clearFilters = useCallback(() => {
    setMinReceipts('')
    setMaxReceipts('')
    setMinWarranties('')
    setMaxWarranties('')
    setJoinedFrom('')
    setJoinedTo('')
    setGoogleAuthFilter('all')
    onPageChange(1)
  }, [onPageChange])

  const { data: response, isLoading, error } = useAdminUsers({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    sortBy,
    sortOrder,
    minReceipts: debouncedMinReceipts ? Number(debouncedMinReceipts) : undefined,
    maxReceipts: debouncedMaxReceipts ? Number(debouncedMaxReceipts) : undefined,
    minWarranties: debouncedMinWarranties ? Number(debouncedMinWarranties) : undefined,
    maxWarranties: debouncedMaxWarranties ? Number(debouncedMaxWarranties) : undefined,
    joinedFrom: joinedFrom || undefined,
    joinedTo: joinedTo || undefined,
    hasGoogleAuth: googleAuthFilter === 'all' ? undefined : googleAuthFilter === 'yes',
  })

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')
    } else {
      setSortBy(field)
      setSortOrder('DESC')
    }
    onPageChange(1)
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground/50" />
    }
    return sortOrder === 'ASC'
      ? <ArrowUp className="ml-1 h-3 w-3" />
      : <ArrowDown className="ml-1 h-3 w-3" />
  }

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center hover:text-foreground transition-colors"
    >
      {children}
      <SortIcon field={field} />
    </button>
  )
  const deleteUser = useDeleteUser()
  const users = response?.data ?? []
  const meta = response?.meta

  const [userToDelete, setUserToDelete] = useState<{ id: string; email: string } | null>(null)


  const handleDeleteClick = (user: { id: string; email: string }) => {
    setUserToDelete(user)
  }

  const handleViewDetails = (userId: string) => {
    navigate(`/admin/users/${userId}`)
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

  return (
    <>
      {/* Search & Filters */}
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('admin.users.searchPlaceholder')}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  if (e.target.value !== '' && page !== 1) {
                    onPageChange(1)
                  }
                }}
                className="pl-10 pr-10"
              />
              {search && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearch('')}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button
              variant={hasActiveFilters ? 'default' : 'outline'}
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className="shrink-0"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {showFilters && (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    {t('admin.users.filters.minReceipts')}
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={minReceipts}
                    onChange={(e) => { setMinReceipts(e.target.value); onPageChange(1) }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    {t('admin.users.filters.maxReceipts')}
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="∞"
                    value={maxReceipts}
                    onChange={(e) => { setMaxReceipts(e.target.value); onPageChange(1) }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    {t('admin.users.filters.minWarranties')}
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={minWarranties}
                    onChange={(e) => { setMinWarranties(e.target.value); onPageChange(1) }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    {t('admin.users.filters.maxWarranties')}
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="∞"
                    value={maxWarranties}
                    onChange={(e) => { setMaxWarranties(e.target.value); onPageChange(1) }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    {t('admin.users.filters.joinedFrom')}
                  </label>
                  <DatePicker
                    value={joinedFrom}
                    onChange={(value) => { setJoinedFrom(value); onPageChange(1) }}
                    placeholder={t('admin.users.filters.joinedFrom')}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    {t('admin.users.filters.joinedTo')}
                  </label>
                  <DatePicker
                    value={joinedTo}
                    onChange={(value) => { setJoinedTo(value); onPageChange(1) }}
                    placeholder={t('admin.users.filters.joinedTo')}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    {t('admin.users.filters.hasGoogleAuth')}
                  </label>
                  <Select
                    value={googleAuthFilter}
                    onValueChange={(value: string) => { setGoogleAuthFilter(value as 'all' | 'yes' | 'no'); onPageChange(1) }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('admin.users.filters.googleAuthAll')}</SelectItem>
                      <SelectItem value="yes">{t('admin.users.filters.googleAuthYes')}</SelectItem>
                      <SelectItem value="no">{t('admin.users.filters.googleAuthNo')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full">
                      <X className="h-4 w-4 mr-1" />
                      {t('admin.users.filters.clearFilters')}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="p-8">
            <p className="text-center text-destructive">
              {t('admin.users.loadError', {
                message: error instanceof Error ? error.message : 'Unknown error',
              })}
            </p>
          </CardContent>
        </Card>
      )}

      {/* No Users State */}
      {!isLoading && !error && (!users || users.length === 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-muted-foreground">
              {t('admin.users.noUsers')}
            </CardTitle>
          </CardHeader>
        </Card>
      )}

      {/* Mobile Card View */}
      {!isLoading && !error && users && users.length > 0 && (
      <div className="md:hidden space-y-4">
        {/* Total users count for mobile */}
        {meta && (
          <div className="text-sm font-medium text-muted-foreground">
            {t('admin.users.totalUsers', { count: meta.total })}
          </div>
        )}
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
                      {t('admin.users.table.warranties')}
                    </span>
                    <span className="font-medium">{user.warrantyCount}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {t('admin.users.table.recurring')}
                    </span>
                    <span className="font-medium">{user.recurringExpenseCount}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {t('admin.users.table.googleAuth')}
                    </span>
                    <span className="font-medium">
                      {user.hasGoogleAuth ? <Check className="h-4 w-4 text-green-600" /> : <Minus className="h-4 w-4 text-muted-foreground" />}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewDetails(user.id)}
                  >
                    <Eye className="h-4 w-4" />
                    {t('common.view')}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDeleteClick({ id: user.id, email: user.email })}
                  >
                    <Trash2 className="h-4 w-4" />
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
      )}

      {/* Desktop Table View */}
      {!isLoading && !error && users && users.length > 0 && (
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
                <TableHead>
                  <SortableHeader field="firstName">
                    {t('admin.users.table.firstName')}
                  </SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader field="lastName">
                    {t('admin.users.table.lastName')}
                  </SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader field="email">
                    {t('admin.users.table.email')}
                  </SortableHeader>
                </TableHead>
                <TableHead>{t('admin.users.table.role')}</TableHead>
                <TableHead>
                  <SortableHeader field="receiptCount">
                    {t('admin.users.table.receipts')}
                  </SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader field="warrantyCount">
                    {t('admin.users.table.warranties')}
                  </SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader field="recurringExpenseCount">
                    {t('admin.users.table.recurring')}
                  </SortableHeader>
                </TableHead>
                <TableHead>{t('admin.users.table.googleAuth')}</TableHead>
                <TableHead>
                  <SortableHeader field="createdAt">
                    {t('admin.users.table.joined')}
                  </SortableHeader>
                </TableHead>
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
                  <TableCell>{user.warrantyCount}</TableCell>
                  <TableCell>{user.recurringExpenseCount}</TableCell>
                  <TableCell>
                    {user.hasGoogleAuth ? <Check className="h-4 w-4 text-green-600" /> : <Minus className="h-4 w-4 text-muted-foreground" />}
                  </TableCell>
                  <TableCell>{formatDateTime(user.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(user.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick({ id: user.id, email: user.email })}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
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
      )}

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
