import { useTranslation } from 'react-i18next'
import { useActiveAnnouncements, type Announcement } from '@/hooks/announcements/use-announcements'
import { Drawer, DrawerHeader, DrawerTitle, DrawerContent } from '@/components/ui/drawer'
import { AlertTriangle, CheckCircle2, Info, ExternalLink, Megaphone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/lib/date-utils'

const typeStyles: Record<Announcement['type'], string> = {
  alert: 'bg-red-500/10 text-red-800 border-red-500/20 dark:text-red-200 dark:bg-red-500/15',
  success: 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20 dark:text-emerald-200 dark:bg-emerald-500/15',
  info: 'bg-blue-500/10 text-blue-800 border-blue-500/20 dark:text-blue-200 dark:bg-blue-500/15',
}

const typeIcons: Record<Announcement['type'], React.ReactNode> = {
  alert: <AlertTriangle className="h-4 w-4 shrink-0" />,
  success: <CheckCircle2 className="h-4 w-4 shrink-0" />,
  info: <Info className="h-4 w-4 shrink-0" />,
}

const typeBadgeStyles: Record<Announcement['type'], string> = {
  alert: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
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
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerHeader onClose={() => onOpenChange(false)}>
        <DrawerTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          {t('announcements.title')}
        </DrawerTitle>
      </DrawerHeader>
      <DrawerContent>
        {listItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Megaphone className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">{t('announcements.noAnnouncements')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {listItems.map((a) => (
              <div
                key={a.id}
                className={cn(
                  'rounded-lg border px-4 py-3',
                  typeStyles[a.type],
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{typeIcons[a.type]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">{a.title}</p>
                      <span className={cn(
                        'inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded-full',
                        typeBadgeStyles[a.type],
                      )}>
                        {t(`announcements.types.${a.type}`)}
                      </span>
                    </div>
                    <p className="text-sm opacity-80">{a.message}</p>
                    <div className="flex items-center justify-between mt-2">
                      {a.linkUrl ? (
                        <a
                          href={a.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium underline underline-offset-2 hover:opacity-80"
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
      </DrawerContent>
    </Drawer>
  )
}

export function useAnnouncementIndicator() {
  const { data: announcements } = useActiveAnnouncements()
  const listCount = (announcements ?? []).filter(
    (a) => a.displayMode === 'list' || a.displayMode === 'both',
  ).length
  return { hasAnnouncements: listCount > 0, count: listCount }
}
