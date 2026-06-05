import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAdminUsers, useDeleteUser, type SortField, type SortOrder } from '@/hooks/admin/use-admin-users'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { formatDateTime } from '@/lib/date-utils'
import { Check, Eye, SlidersHorizontal, Loader2, Minus, Search, Trash2, Users, X } from 'lucide-react'
import { EmptyState } from '@/components/glass/empty-state'
import { AdminCard, AdminCardHead, RoleBadge, SortHeader } from '@/components/admin/primitives'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

const STORAGE_KEY = 'admin-users-table'

function readStoredState() {
  try {
    const s = sessionStorage.getItem(STORAGE_KEY)
    return s ? JSON.parse(s) : null
  } catch { return null }
}

/** Compact label/value cell for the mobile user card stat stack. */
function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-bg-subtle/50 px-3 py-2">
      <div className="t-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 flex h-[22px] items-center text-[17px] font-bold leading-none">{value}</div>
    </div>
  )
}

export function UsersTable() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const stored = useMemo(() => readStoredState(), [])
  const [page, setPage] = useState<number>(stored?.page ?? 1)
  const [search, setSearch] = useState(stored?.search ?? '')
  const [sortBy, setSortBy] = useState<SortField>(stored?.sortBy ?? 'createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>(stored?.sortOrder ?? 'DESC')
  const [showFilters, setShowFilters] = useState(stored?.showFilters ?? false)
  const [minReceipts, setMinReceipts] = useState(stored?.minReceipts ?? '')
  const [maxReceipts, setMaxReceipts] = useState(stored?.maxReceipts ?? '')
  const [minWarranties, setMinWarranties] = useState(stored?.minWarranties ?? '')
  const [maxWarranties, setMaxWarranties] = useState(stored?.maxWarranties ?? '')
  const [joinedFrom, setJoinedFrom] = useState(stored?.joinedFrom ?? '')
  const [joinedTo, setJoinedTo] = useState(stored?.joinedTo ?? '')
  const [googleAuthFilter, setGoogleAuthFilter] = useState<'all' | 'yes' | 'no'>(stored?.googleAuthFilter ?? 'all')

  const onPageChange = useCallback((p: number) => setPage(p), [])

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      page, search, sortBy, sortOrder, showFilters,
      minReceipts, maxReceipts, minWarranties, maxWarranties,
      joinedFrom, joinedTo, googleAuthFilter,
    }))
  }, [page, search, sortBy, sortOrder, showFilters, minReceipts, maxReceipts, minWarranties, maxWarranties, joinedFrom, joinedTo, googleAuthFilter])
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

  const roleBadge = (role: string) => (
    <RoleBadge role={role} adminLabel={t('admin.users.form.roleAdmin')} userLabel={t('admin.users.form.roleUser')} />
  )
  const googleCell = (on: boolean) =>
    on ? <Check className="size-4 text-success" /> : <Minus className="size-4 text-fg-faint" />

  return (
    <div className="space-y-[18px]">
      {/* Search & Filters */}
      <AdminCard className="p-4 sm:p-5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-faint" />
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
                size="icon"
                onClick={() => setSearch('')}
                className="absolute right-1 top-1/2 size-8 -translate-y-1/2"
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
          <Button
            variant={hasActiveFilters ? 'default' : 'glass'}
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            aria-pressed={showFilters}
            className="size-10 shrink-0 rounded-xl"
          >
            <SlidersHorizontal className="size-4" />
          </Button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div>
              <label className="t-xs mb-1.5 block text-muted-foreground">{t('admin.users.filters.minReceipts')}</label>
              <Input type="number" min="0" placeholder="0" value={minReceipts}
                onChange={(e) => { setMinReceipts(e.target.value); onPageChange(1) }} />
            </div>
            <div>
              <label className="t-xs mb-1.5 block text-muted-foreground">{t('admin.users.filters.maxReceipts')}</label>
              <Input type="number" min="0" placeholder="∞" value={maxReceipts}
                onChange={(e) => { setMaxReceipts(e.target.value); onPageChange(1) }} />
            </div>
            <div>
              <label className="t-xs mb-1.5 block text-muted-foreground">{t('admin.users.filters.minWarranties')}</label>
              <Input type="number" min="0" placeholder="0" value={minWarranties}
                onChange={(e) => { setMinWarranties(e.target.value); onPageChange(1) }} />
            </div>
            <div>
              <label className="t-xs mb-1.5 block text-muted-foreground">{t('admin.users.filters.maxWarranties')}</label>
              <Input type="number" min="0" placeholder="∞" value={maxWarranties}
                onChange={(e) => { setMaxWarranties(e.target.value); onPageChange(1) }} />
            </div>
            <div>
              <label className="t-xs mb-1.5 block text-muted-foreground">{t('admin.users.filters.joinedFrom')}</label>
              <DatePicker value={joinedFrom} onChange={(value) => { setJoinedFrom(value); onPageChange(1) }}
                placeholder={t('admin.users.filters.joinedFrom')} />
            </div>
            <div>
              <label className="t-xs mb-1.5 block text-muted-foreground">{t('admin.users.filters.joinedTo')}</label>
              <DatePicker value={joinedTo} onChange={(value) => { setJoinedTo(value); onPageChange(1) }}
                placeholder={t('admin.users.filters.joinedTo')} />
            </div>
            <div>
              <label className="t-xs mb-1.5 block text-muted-foreground">{t('admin.users.filters.hasGoogleAuth')}</label>
              <Select value={googleAuthFilter}
                onValueChange={(value: string) => { setGoogleAuthFilter(value as 'all' | 'yes' | 'no'); onPageChange(1) }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <X className="size-4" />
                  {t('admin.users.filters.clearFilters')}
                </Button>
              )}
            </div>
          </div>
        )}
      </AdminCard>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <AdminCard className="p-8">
          <p className="text-center text-destructive">
            {t('admin.users.loadError', { message: error instanceof Error ? error.message : 'Unknown error' })}
          </p>
        </AdminCard>
      )}

      {/* No Users State */}
      {!isLoading && !error && (!users || users.length === 0) && (
        <EmptyState compact icon={Users} title={t('admin.users.noUsers')} />
      )}

      {/* Mobile Card View */}
      {!isLoading && !error && users && users.length > 0 && (
        <div className="space-y-4 md:hidden">
          {meta && (
            <div className="text-sm">
              <span className="font-semibold">{t('admin.users.activeUsers', { count: meta.total })}</span>
              <p className="mt-0.5 text-xs text-muted-foreground">{t('admin.users.statsDescription')}</p>
            </div>
          )}
          {users.map((user) => (
            <div key={user.id} className="rounded-2xl border border-border bg-card p-4 shadow-glass-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-[16px] font-bold">
                    {user.firstName || user.lastName
                      ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                      : t('admin.users.noName')}
                  </h3>
                  <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                </div>
                {roleBadge(user.role)}
              </div>

              <div className="mt-3.5 grid grid-cols-2 gap-2">
                <MiniStat label={t('admin.users.table.receipts')} value={user.receiptCount} />
                <MiniStat label={t('admin.users.table.warranties')} value={user.warrantyCount} />
                <MiniStat label={t('admin.users.table.recurring')} value={user.recurringExpenseCount} />
                <MiniStat label={t('admin.users.table.googleAuth')} value={googleCell(user.hasGoogleAuth)} />
              </div>

              <div className="mt-3.5 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleViewDetails(user.id)}>
                  <Eye className="size-4" />
                  {t('common.view')}
                </Button>
                <Button variant="destructive-soft" size="sm" className="flex-1"
                  onClick={() => handleDeleteClick({ id: user.id, email: user.email })}>
                  <Trash2 className="size-4" />
                  {t('admin.users.table.delete')}
                </Button>
              </div>
            </div>
          ))}

          {meta && meta.totalPages > 1 && (
            <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={onPageChange} />
          )}
        </div>
      )}

      {/* Desktop Table View */}
      {!isLoading && !error && users && users.length > 0 && (
        <AdminCard className="hidden md:block">
          <AdminCardHead
            title={t('admin.users.activeUsers', { count: meta?.total || 0 })}
            desc={t('admin.users.statsDescription')}
          />
          <div className="mt-3 overflow-x-auto custom-scrollbar">
            <table className="w-full caption-bottom text-sm">
              <TableHeader className="bg-transparent">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5 sm:pl-[22px]">
                    <SortHeader label={t('admin.users.table.firstName')} active={sortBy === 'firstName'} dir={sortOrder} onClick={() => handleSort('firstName')} />
                  </TableHead>
                  <TableHead>
                    <SortHeader label={t('admin.users.table.lastName')} active={sortBy === 'lastName'} dir={sortOrder} onClick={() => handleSort('lastName')} />
                  </TableHead>
                  <TableHead>
                    <SortHeader label={t('admin.users.table.email')} active={sortBy === 'email'} dir={sortOrder} onClick={() => handleSort('email')} />
                  </TableHead>
                  <TableHead>{t('admin.users.table.role')}</TableHead>
                  <TableHead>
                    <SortHeader label={t('admin.users.table.receipts')} active={sortBy === 'receiptCount'} dir={sortOrder} onClick={() => handleSort('receiptCount')} />
                  </TableHead>
                  <TableHead>
                    <SortHeader label={t('admin.users.table.warranties')} active={sortBy === 'warrantyCount'} dir={sortOrder} onClick={() => handleSort('warrantyCount')} />
                  </TableHead>
                  <TableHead>
                    <SortHeader label={t('admin.users.table.recurring')} active={sortBy === 'recurringExpenseCount'} dir={sortOrder} onClick={() => handleSort('recurringExpenseCount')} />
                  </TableHead>
                  <TableHead>{t('admin.users.table.googleAuth')}</TableHead>
                  <TableHead>
                    <SortHeader label={t('admin.users.table.joined')} active={sortBy === 'createdAt'} dir={sortOrder} onClick={() => handleSort('createdAt')} />
                  </TableHead>
                  <TableHead className="pr-5 text-right sm:pr-[22px]">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="pl-5 font-semibold sm:pl-[22px]">{user.firstName || '–'}</TableCell>
                    <TableCell className="font-semibold">{user.lastName || '–'}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>{roleBadge(user.role)}</TableCell>
                    <TableCell>{user.receiptCount}</TableCell>
                    <TableCell>{user.warrantyCount}</TableCell>
                    <TableCell>{user.recurringExpenseCount}</TableCell>
                    <TableCell>{googleCell(user.hasGoogleAuth)}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(user.createdAt)}</TableCell>
                    <TableCell className="pr-5 sm:pr-[22px]">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="size-8" title={t('admin.users.viewDetails', { defaultValue: 'View details' })} onClick={() => handleViewDetails(user.id)}>
                          <Eye className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" title={t('admin.users.table.delete')} onClick={() => handleDeleteClick({ id: user.id, email: user.email })}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </table>
          </div>
          {meta && meta.totalPages > 1 && (
            <div className="border-t border-hairline-soft px-5 py-4 sm:px-[22px]">
              <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={onPageChange} />
            </div>
          )}
        </AdminCard>
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
    </div>
  )
}
