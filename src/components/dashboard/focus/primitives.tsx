import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { WidgetHead } from '@/components/dashboard/primitives'
import { cn } from '@/lib/utils'

/* ============================================================
   Dashboard "Focus" primitives.
   The Focus direction layers a slightly lighter frosted surface
   than the canonical `.glass-card` (used for the hero): translucent
   card + blur, hairline border, soft shadow. Module cards compose
   `FocusCard`; the hero / safe-to-spend cards style their own
   bespoke surfaces in `modules.tsx`.
   ============================================================ */

/** Frosted module card with the standard icon + title + trailing header. */
export function FocusCard({
  icon,
  title,
  trailing,
  iconTone = 'muted',
  className,
  children,
}: {
  icon: LucideIcon
  title: ReactNode
  trailing?: ReactNode
  iconTone?: 'muted' | 'primary'
  className?: string
  children: ReactNode
}) {
  return (
    <section
      className={cn(
        'rounded-3xl border border-border bg-card px-[22px] py-5 shadow-glass-1',
        className,
      )}
    >
      <WidgetHead icon={icon} title={title} trailing={trailing} iconTone={iconTone} />
      {children}
    </section>
  )
}

/** Small muted trailing label used in card headers (e.g. "June 2026", "14 receipts this week"). */
export function FocusTrailing({ children }: { children: ReactNode }) {
  return <span className="text-[12px] font-semibold text-muted-foreground">{children}</span>
}

/** Round amounts hide/show toggle — the dashboard's single eye control, pinned in the hero. */
export function AmountsEyeToggle({
  visible,
  onToggle,
  className,
}: {
  visible: boolean
  onToggle: () => void
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? t('dashboard.hideAmounts') : t('dashboard.showAmounts')}
      className={cn(
        'grid size-[34px] place-items-center rounded-full border border-hairline-soft bg-bg-subtle/70 text-muted-foreground transition-colors hover:bg-bg-subtle',
        className,
      )}
    >
      {visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
    </button>
  )
}
