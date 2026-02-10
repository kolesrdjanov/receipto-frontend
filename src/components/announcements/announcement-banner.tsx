import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useActiveAnnouncements, type Announcement } from '@/hooks/announcements/use-announcements'
import { AlertTriangle, CheckCircle2, Info, X, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

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

export function AnnouncementBanner() {
  const { t } = useTranslation()
  const { data: announcements } = useActiveAnnouncements()
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try {
      const stored = sessionStorage.getItem('dismissed-announcements')
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch {
      return new Set()
    }
  })

  if (!announcements?.length) return null

  const visible = announcements.filter(
    (a) => (a.displayMode === 'banner' || a.displayMode === 'both') && !dismissed.has(a.id),
  )

  if (!visible.length) return null

  const handleDismiss = (id: string) => {
    const next = new Set(dismissed)
    next.add(id)
    setDismissed(next)
    try {
      sessionStorage.setItem('dismissed-announcements', JSON.stringify([...next]))
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-2 mb-4">
      {visible.map((a) => (
        <div
          key={a.id}
          className={cn(
            'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm',
            typeStyles[a.type],
          )}
        >
          <div className="mt-0.5">{typeIcons[a.type]}</div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{a.title}</p>
            <p className="text-xs opacity-80 mt-0.5">{a.message}</p>
            {a.linkUrl && (
              <a
                href={a.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium mt-1.5 underline underline-offset-2 hover:opacity-80"
              >
                <ExternalLink className="h-3 w-3" />
                {a.linkText || t('announcements.learnMore')}
              </a>
            )}
          </div>
          <button
            onClick={() => handleDismiss(a.id)}
            className="shrink-0 mt-0.5 rounded-sm p-0.5 opacity-60 hover:opacity-100 transition-opacity"
            aria-label={t('announcements.dismiss')}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
