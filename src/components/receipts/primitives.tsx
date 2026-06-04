import { useTranslation } from 'react-i18next'
import { QrCode, Pencil, Clock, X, Repeat, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

// Generic list primitives now live in the shared Glass layer; re-exported here for
// existing receipts consumers. New code should import from '@/components/glass/primitives'.
export { Amount, CatTile, CatName, SelectCheck } from '@/components/glass/primitives'

type Tone = 'ok' | 'info' | 'warn' | 'danger' | 'violet'
const STATUS: Record<string, { tone: Tone; icon: LucideIcon; key: string }> = {
  scraped:   { tone: 'ok',     icon: QrCode, key: 'receipts.status.completed' },
  completed: { tone: 'ok',     icon: QrCode, key: 'receipts.status.completed' },
  manual:    { tone: 'info',   icon: Pencil, key: 'receipts.status.manual' },
  pending:   { tone: 'warn',   icon: Clock,  key: 'receipts.status.pending' },
  failed:    { tone: 'danger', icon: X,      key: 'receipts.status.failed' },
  recurring: { tone: 'violet', icon: Repeat, key: 'receipts.status.recurring' },
}
const TONE_CLASS: Record<Tone, string> = {
  ok: 'bg-success-soft text-success-foreground',
  info: 'bg-info-soft text-info-foreground',
  warn: 'bg-warning-soft text-warning-foreground',
  danger: 'bg-destructive-soft text-[color:var(--destructive-foreground-on-soft)]',
  violet: 'bg-brand-violet-soft text-brand-violet-foreground',
}
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const { t } = useTranslation()
  const s = STATUS[status]
  if (!s) return null
  const Icon = s.icon
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold', TONE_CLASS[s.tone], className)}>
      <Icon className="size-3" />
      {t(s.key)}
    </span>
  )
}
