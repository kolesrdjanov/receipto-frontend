import { useTranslation } from 'react-i18next'
import { useActiveAnnouncements, type Announcement } from '@/hooks/announcements/use-announcements'
import { GlassDialog } from '@/components/glass/glass-dialog'
import { ModalEmptyState } from '@/components/glass/empty-state'
import { AlertTriangle, CheckCircle2, Info, ExternalLink, Megaphone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/lib/date-utils'

// Type-tinted card: soft semantic fill + readable on-soft text (glass tokens).
const typeStyles: Record<Announcement['type'], string> = {
  alert: 'bg-destructive-soft border-destructive/20 text-destructive',
  success: 'bg-success-soft border-success/20 text-success-foreground',
  info: 'bg-info-soft border-info/20 text-info-foreground',
}

const typeIcons: Record<Announcement['type'], React.ReactNode> = {
  alert: <AlertTriangle className="h-4 w-4 shrink-0" />,
  success: <CheckCircle2 className="h-4 w-4 shrink-0" />,
  info: <Info className="h-4 w-4 shrink-0" />,
}

interface AnnouncementDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AnnouncementDrawer({ open, onOpenChange }: AnnouncementDrawerProps) {
  const { t } = useTranslation()
  const { data: announcements } = useActiveAnnouncements()

  const listItems = (announcements ?? []).filter(
    (a) => a.displayMode === 'list' || a.displayMode === 'both',
  )

  return (
    <GlassDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('announcements.title')}
      desktopWidth={452}
      header={
        <div className="flex items-center gap-2">
          <span className="t-h3">{t('announcements.title')}</span>
        </div>
      }
    >
      {listItems.length === 0 ? (
        <ModalEmptyState icon={Megaphone} title={t('announcements.noAnnouncements')} />
      ) : (
        <div className="space-y-3">
          {listItems.map((a) => (
            <div key={a.id} className={cn('rounded-xl border px-4 py-3', typeStyles[a.type])}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{typeIcons[a.type]}</div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <p className="text-sm font-semibold">{a.title}</p>
                    <span className="inline-flex items-center rounded-full border border-current/30 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                      {t(`announcements.types.${a.type}`)}
                    </span>
                  </div>
                  <p className="text-sm opacity-80">{a.message}</p>
                  <div className="mt-2 flex items-center justify-between">
                    {a.linkUrl ? (
                      <a
                        href={a.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2 hover:opacity-80"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {a.linkText || t('announcements.learnMore')}
                      </a>
                    ) : (
                      <div />
                    )}
                    <span className="text-[11px] opacity-50">{formatDateTime(a.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassDialog>
  )
}

export function useAnnouncementIndicator() {
  const { data: announcements } = useActiveAnnouncements()
  const listCount = (Array.isArray(announcements) ? announcements : []).filter(
    (a) => a.displayMode === 'list' || a.displayMode === 'both',
  ).length
  return { hasAnnouncements: listCount > 0, count: listCount }
}
