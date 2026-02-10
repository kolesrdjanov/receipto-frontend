import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { AnnouncementModal } from './announcement-modal'
import {
  useAdminAnnouncements,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
  type AdminAnnouncement,
} from '@/hooks/announcements/use-announcements'
import { formatDateTime } from '@/lib/date-utils'
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
} from 'lucide-react'
import { toast } from 'sonner'

interface AnnouncementsTableProps {
  page: number
  onPageChange: (page: number) => void
}

function TypeBadge({ type }: { type: AdminAnnouncement['type'] }) {
  const { t } = useTranslation()

  const styles = {
    alert: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  }

  const icons = {
    alert: <AlertTriangle className="h-3 w-3" />,
    success: <CheckCircle2 className="h-3 w-3" />,
    info: <Info className="h-3 w-3" />,
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${styles[type]}`}>
      {icons[type]}
      {t(`admin.announcements.types.${type}`)}
    </span>
  )
}

function DisplayBadge({ displayMode }: { displayMode: AdminAnnouncement['displayMode'] }) {
  const { t } = useTranslation()
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground">
      {t(`admin.announcements.form.display${displayMode.charAt(0).toUpperCase() + displayMode.slice(1)}`)}
    </span>
  )
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
      {
        onSuccess: () => {
          toast.success(t('admin.announcements.updateSuccess'))
        },
      },
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

  return (
    <>
      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error */}
      {error && (
        <Card>
          <CardContent className="p-8">
            <p className="text-center text-destructive">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Empty */}
      {!isLoading && !error && announcements.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-muted-foreground">
              {t('admin.announcements.noAnnouncements')}
            </CardTitle>
          </CardHeader>
        </Card>
      )}

      {/* Mobile Card View */}
      {!isLoading && !error && announcements.length > 0 && (
        <div className="md:hidden space-y-4">
          {meta && (
            <div className="text-sm font-medium text-muted-foreground">
              {t('admin.announcements.totalAnnouncements', { count: meta.total })}
            </div>
          )}
          {announcements.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-sm line-clamp-1">{a.title.en}</h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => setEditingAnnouncement(a)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-destructive"
                        onClick={() => setDeletingId(a.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">{a.message.en}</p>

                  <div className="flex items-center gap-2 flex-wrap">
                    <TypeBadge type={a.type} />
                    <DisplayBadge displayMode={a.displayMode} />
                    <button
                      onClick={() => handleToggleActive(a.id, a.isActive)}
                      disabled={updateAnnouncement.isPending}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full transition-colors ${
                        a.isActive
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                      }`}
                    >
                      {a.isActive ? (
                        <><Check className="h-3 w-3" />{t('admin.announcements.table.active')}</>
                      ) : (
                        <><X className="h-3 w-3" />{t('admin.announcements.table.inactive')}</>
                      )}
                    </button>
                  </div>

                  {a.linkUrl && (
                    <a
                      href={a.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {a.linkText || a.linkUrl}
                    </a>
                  )}

                  <div className="text-xs text-muted-foreground">
                    {formatDateTime(a.createdAt)}
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
      {!isLoading && !error && announcements.length > 0 && (
        <Card className="hidden md:block">
          <CardHeader>
            <CardTitle>
              {t('admin.announcements.totalAnnouncements', { count: meta?.total || 0 })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.announcements.table.type')}</TableHead>
                  <TableHead>{t('admin.announcements.table.title')}</TableHead>
                  <TableHead className="max-w-[300px]">{t('admin.announcements.table.message')}</TableHead>
                  <TableHead>{t('admin.announcements.table.displayMode')}</TableHead>
                  <TableHead>{t('admin.announcements.table.status')}</TableHead>
                  <TableHead>{t('admin.announcements.table.link')}</TableHead>
                  <TableHead>{t('admin.announcements.table.date')}</TableHead>
                  <TableHead>{t('admin.announcements.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <TypeBadge type={a.type} />
                    </TableCell>
                    <TableCell className="font-medium">{a.title.en}</TableCell>
                    <TableCell className="max-w-[300px]">
                      <p className="text-sm text-muted-foreground line-clamp-2">{a.message.en}</p>
                    </TableCell>
                    <TableCell>
                      <DisplayBadge displayMode={a.displayMode} />
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleToggleActive(a.id, a.isActive)}
                        disabled={updateAnnouncement.isPending}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full transition-colors cursor-pointer ${
                          a.isActive
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                        }`}
                      >
                        {a.isActive ? (
                          <><Check className="h-3 w-3" />{t('admin.announcements.table.active')}</>
                        ) : (
                          <><X className="h-3 w-3" />{t('admin.announcements.table.inactive')}</>
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      {a.linkUrl ? (
                        <a
                          href={a.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {a.linkText || t('admin.announcements.table.viewLink')}
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDateTime(a.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => setEditingAnnouncement(a)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive"
                          onClick={() => setDeletingId(a.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
        isLoading={deleteAnnouncement.isPending}
      />
    </>
  )
}
