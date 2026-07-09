import type { ReactNode } from 'react'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageToolbar } from '@/components/layout/page-toolbar'
import { AddButton } from '@/components/glass/empty-state'

interface PageHeaderAction {
  label: string
  onClick: () => void
  icon?: LucideIcon
  'data-testid'?: string
}

interface PageHeaderProps {
  title: string
  /** Subtitle shown at both breakpoints unless overridden by desktop/mobile variants. */
  subtitle?: ReactNode
  desktopSubtitle?: ReactNode
  mobileSubtitle?: ReactNode
  /** Convenience for the common case: renders the brand AddButton at both breakpoints. */
  action?: PageHeaderAction
  /** Custom desktop actions (overrides `action`). */
  actions?: ReactNode
  /** Custom mobile actions (overrides `action`). */
  mobileActions?: ReactNode
  className?: string
}

/**
 * Unified page header — the sticky frosted {@link PageToolbar} on desktop (md+) and the
 * inline title/subtitle/action block on mobile. Folds the two copies (and the repeated
 * `md:mb-6` breakout) that every list page used to inline. Pass `action`
 * for the common Add-button case, or `actions`/`mobileActions` for anything custom.
 */
export function PageHeader({
  title,
  subtitle,
  desktopSubtitle,
  mobileSubtitle,
  action,
  actions,
  mobileActions,
  className,
}: PageHeaderProps) {
  const desktopActions =
    actions ??
    (action ? (
      <AddButton
        onClick={action.onClick}
        label={action.label}
        icon={action.icon}
        data-testid={action['data-testid']}
      />
    ) : undefined)

  const mobileAction =
    mobileActions ??
    (action ? (
      <AddButton onClick={action.onClick} label={action.label} icon={action.icon} />
    ) : undefined)

  const mSub = mobileSubtitle ?? subtitle

  return (
    <>
      <PageToolbar
        className={cn('md:mb-6', className)}
        title={title}
        subtitle={desktopSubtitle ?? subtitle}
        actions={desktopActions}
      />
      <div className="mb-5 flex items-start justify-between gap-3 md:hidden">
        <div className="min-w-0">
          <h1 className="t-h1 text-[28px]">{title}</h1>
          {mSub && <p className="mt-1 text-[12.5px] text-muted-foreground">{mSub}</p>}
        </div>
        {mobileAction}
      </div>
    </>
  )
}
