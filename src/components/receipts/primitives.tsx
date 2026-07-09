import { useTranslation } from 'react-i18next'
import { QrCode, Pencil, Clock, X, Repeat, type LucideIcon } from 'lucide-react'
import { StatusBadge as GlassStatusBadge, type Tone } from '@/components/glass/primitives'

// Generic list primitives now live in the shared Glass layer; re-exported here for
// existing receipts consumers. New code should import from '@/components/glass/primitives'.
export { Amount, CatTile, CatName, SelectCheck } from '@/components/glass/primitives'

const STATUS: Record<string, { tone: Tone; icon: LucideIcon; key: string }> = {
  scraped:   { tone: 'ok',     icon: QrCode, key: 'receipts.status.completed' },
  completed: { tone: 'ok',     icon: QrCode, key: 'receipts.status.completed' },
  manual:    { tone: 'info',   icon: Pencil, key: 'receipts.status.manual' },
  pending:   { tone: 'outline', icon: Clock,  key: 'receipts.status.pending' },
  failed:    { tone: 'danger', icon: X,      key: 'receipts.status.failed' },
  recurring: { tone: 'violet', icon: Repeat, key: 'receipts.status.recurring' },
}
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const { t } = useTranslation()
  const s = STATUS[status]
  if (!s) return null
  return (
    <GlassStatusBadge tone={s.tone} icon={s.icon} className={className}>
      {t(s.key)}
    </GlassStatusBadge>
  )
}
