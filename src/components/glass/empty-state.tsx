import { type ReactNode } from 'react'
import { Plus, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

/**
 * Brand-gradient CTA pill — a thin preset of the shared `<Button variant="brand">`. The brand
 * gradient is reserved for the logo, this CTA, and the FAB — don't reuse it elsewhere. Shared so
 * every page stops re-declaring its own `AddButton`.
 */
export function AddButton({
  onClick,
  label,
  icon: Icon = Plus,
  className,
  'data-testid': testId,
}: {
  onClick: () => void
  label: string
  icon?: LucideIcon
  className?: string
  'data-testid'?: string
}) {
  return (
    <Button
      type="button"
      variant="brand"
      onClick={onClick}
      className={cn('h-10 rounded-full px-4 text-[15px] font-semibold [&_svg]:size-[17px]', className)}
      data-testid={testId}
    >
      <Icon strokeWidth={2.4} />
      {label}
    </Button>
  )
}

/**
 * Canonical Glass empty state — solid card + recessed icon tile + `t-h3`/`t-sm` copy + optional
 * action slot. The single shared "no data yet" vocabulary; compose this instead of re-deriving the
 * markup per screen. Use `compact` for tighter / in-context surfaces (filtered tabs, narrow cards).
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
  className,
  'data-testid': testId,
}: {
  icon: LucideIcon
  title: string
  description?: ReactNode
  action?: ReactNode
  compact?: boolean
  className?: string
  'data-testid'?: string
}) {
  return (
    <div
      className={cn(
        'grid place-items-center rounded-3xl border border-border bg-card text-center shadow-glass-1',
        compact ? 'px-5 py-10' : 'px-6 py-16',
        className,
      )}
      data-testid={testId}
    >
      <span
        className={cn(
          'grid place-items-center bg-bg-subtle text-muted-foreground',
          compact ? 'size-[56px] rounded-[18px]' : 'size-[76px] rounded-[22px]',
        )}
      >
        <Icon className={compact ? 'size-7' : 'size-8'} strokeWidth={1.75} />
      </span>
      <h3 className={cn(compact ? 't-title mt-3.5' : 't-h3 mt-[18px]')}>{title}</h3>
      {description && (
        <p className={cn('t-sm max-w-[320px] text-muted-foreground', compact ? 'mt-1.5' : 'mt-2')}>
          {description}
        </p>
      )}
      {action && <div className={compact ? 'mt-4' : 'mt-[22px]'}>{action}</div>}
    </div>
  )
}
