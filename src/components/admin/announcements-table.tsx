import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { AnnouncementModal } from './announcement-modal'
import { AdminCard, AdminCardHead, Pill, type PillTone } from '@/components/admin/primitives'
import {
  useAdminAnnouncements,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
  type AdminAnnouncement,
} from '@/hooks/announcements/use-announcements'
import { formatDateTime } from '@/lib/date-utils'
import { getErrorMessage } from '@/lib/api'
import { EmptyState } from '@/components/glass/empty-state'
import {
  Loader2,
  Pencil,
  Trash2,
  Check,
  X,
  AlertTriangle,
  CheckCircle2,
  Info,
  ExternalLink,
  Megaphone,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'

interface AnnouncementsTableProps {
  page: number
  onPageChange: (page: number) => void
}

const TYPE_TONE: Record<AdminAnnouncement['type'], PillTone> = {
  alert: 'danger',
  success: 'success',
  info: 'info',
}
const TYPE_ICON: Record<AdminAnnouncement['type'], LucideIcon> = {
  alert: AlertTriangle,
  success: CheckCircle2,
  info: Info,
}

export function AnnouncementsTable({ page, onPageChange }: AnnouncementsTableProps) {
  const { t } = useTranslation()
  const { data: response, isLoading, error } = useAdminAnnouncements(page, 20)
  const updateAnnouncement = useUpdateAnnouncement()
  const deleteAnnouncement = useDeleteAnnouncement()

  const [editingAnnouncement, setEditingAnnouncement] = useState<AdminAnnouncement | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const announcements = response?.data ?? []
  const meta = response?.meta

  const handleToggleActive = (id: string, currentActive: boolean) => {
    updateAnnouncement.mutate(
      { id, data: { isActive: !currentActive } },
      { onSuccess: () => toast.success(t('admin.announcements.updateSuccess')) },
    )
  }

  const handleDelete = (id: string) => {
    deleteAnnouncement.mutate(id, {
      onSuccess: () => {
        toast.success(t('admin.announcements.deleteSuccess'))
        setDeletingId(null)
      },
    })
  }

  const typePill = (type: AdminAnnouncement['type']) => (
    <Pill tone={TYPE_TONE[type]} icon={TYPE_ICON[type]}>{t(`admin.announcements.types.${type}`)}</Pill>
  )
  const displayPill = (mode: AdminAnnouncement['displayMode']) => (
    <Pill tone="neutral">{t(`admin.announcements.form.display${mode.charAt(0).toUpperCase() + mode.slice(1)}`)}</Pill>
  )
  const activePill = (a: AdminAnnouncement) => (
    <Pill
      tone={a.isActive ? 'emerald' : 'warn'}
      icon={a.isActive ? Check : X}
      onClick={() => handleToggleActive(a.id, a.isActive)}
      disabled={updateAnnouncement.isPending}
    >
      {a.isActive ? t('admin.announcements.table.active') : t('admin.announcements.table.inactive')}
    </Pill>
  )
  const rowActions = (a: AdminAnnouncement) => (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className="size-8" title={t('admin.announcements.table.actions')} onClick={() => setEditingAnnouncement(a)}>
        <Pencil className="size-4" />
      </Button>
      <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" title={t('admin.announcements.table.actions')} onClick={() => setDeletingId(a.id)}>
        <Trash2 className="size-4" />
      </Button>
    </div>
  )
  const externalLink = (a: AdminAnnouncement, fallbackLabel: string) =>
    a.linkUrl ? (
      <a href={a.linkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
        <ExternalLink className="size-3" />
        {a.linkText || fallbackLabel}
      </a>
    ) : null

  return (
    <>
      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error */}
      {error && (
        <AdminCard className="p-8">
          <p className="text-center text-destructive">{getErrorMessage(error, 'Unknown error')}</p>
        </AdminCard>
      )}

      {/* Empty */}
      {!isLoading && !error && announcements.length === 0 && (
        <EmptyState compact icon={Megaphone} title={t('admin.announcements.noAnnouncements')} />
      )}

      {/* Mobile Card View */}
      {!isLoading && !error && announcements.length > 0 && (
        <div className="space-y-4 md:hidden">
          {meta && (
            <div className="text-sm font-semibold">{t('admin.announcements.totalAnnouncements', { count: meta.total })}</div>
          )}
          {announcements.map((a) => (
            <div key={a.id} className="rounded-2xl border border-border bg-card p-4 shadow-glass-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-1 text-[15px] font-semibold">{a.title.en}</h3>
                {rowActions(a)}
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{a.message.en}</p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {typePill(a.type)}
                {displayPill(a.displayMode)}
                {activePill(a)}
              </div>
              {a.linkUrl && <div className="mt-3">{externalLink(a, a.linkUrl)}</div>}
              <div className="mt-3 text-xs text-muted-foreground">{formatDateTime(a.createdAt)}</div>
            </div>
          ))}

          {meta && meta.totalPages > 1 && (
            <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={onPageChange} />
          )}
        </div>
      )}

      {/* Desktop Table View */}
      {!isLoading && !error && announcements.length > 0 && (
        <AdminCard className="hidden md:block">
          <AdminCardHead title={t('admin.announcements.totalAnnouncements', { count: meta?.total || 0 })} />
          <div className="mt-3 overflow-x-auto custom-scrollbar">
            <table className="w-full caption-bottom text-sm">
              <TableHeader className="bg-transparent">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5 sm:pl-[22px]">{t('admin.announcements.table.type')}</TableHead>
                  <TableHead>{t('admin.announcements.table.title')}</TableHead>
                  <TableHead className="max-w-[300px]">{t('admin.announcements.table.message')}</TableHead>
                  <TableHead>{t('admin.announcements.table.displayMode')}</TableHead>
                  <TableHead>{t('admin.announcements.table.status')}</TableHead>
                  <TableHead>{t('admin.announcements.table.link')}</TableHead>
                  <TableHead>{t('admin.announcements.table.date')}</TableHead>
                  <TableHead className="pr-5 sm:pr-[22px]">{t('admin.announcements.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="pl-5 sm:pl-[22px]">{typePill(a.type)}</TableCell>
                    <TableCell className="font-semibold">{a.title.en}</TableCell>
                    <TableCell className="max-w-[300px]">
                      <p className="line-clamp-2 text-sm text-muted-foreground">{a.message.en}</p>
                    </TableCell>
                    <TableCell>{displayPill(a.displayMode)}</TableCell>
                    <TableCell>{activePill(a)}</TableCell>
                    <TableCell>{externalLink(a, t('admin.announcements.table.viewLink')) || <span className="text-xs text-muted-foreground">–</span>}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatDateTime(a.createdAt)}</TableCell>
                    <TableCell className="pr-5 sm:pr-[22px]">{rowActions(a)}</TableCell>
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

      {/* Edit Modal */}
      <AnnouncementModal
        open={!!editingAnnouncement}
        onOpenChange={(open) => { if (!open) setEditingAnnouncement(null) }}
        announcement={editingAnnouncement}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => { if (!open) setDeletingId(null) }}
        title={t('admin.announcements.deleteAnnouncement')}
        description={t('admin.announcements.deleteConfirm')}
        onConfirm={() => deletingId && handleDelete(deletingId)}
        confirmText={t('common.delete')}
        variant="destructive"
        isLoading={deleteAnnouncement.isPending}
      />
    </>
  )
}
