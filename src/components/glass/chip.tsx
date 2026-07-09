import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface ChipProps {
  label: ReactNode
  icon?: ReactNode
  active?: boolean
  /**
   * `dark` = high-contrast toggle on a page surface (quick-chips, rail date presets) —
   * active is the inverted foreground pill.
   * `soft` = primary-tinted toggle inside cards/dialogs/sheets (category & member
   * pickers, filter sheet) — active is `bg-primary-soft`, inactive sits on `bg-bg-subtle`
   * so it stays visible on a card surface.
   */
  tone?: 'dark' | 'soft'
  onClick?: () => void
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

/**
 * The single chip/pill toggle for the whole app — a 36px rounded-full bordered pill with
 * a ≥44px tap target. Use everywhere a small selectable/toggleable pill is needed
 * (filters, category pickers, member pickers). Don't hand-roll `h-[3Npx] … rounded-full
 * … px-3.5` chips per screen — they drift. For a non-toggle action pill use
 * `<Button variant="glass" size="pill">` instead.
 */
export function Chip({
  label,
  icon,
  active,
  tone = 'dark',
  onClick,
  disabled,
  className,
  'aria-label': ariaLabel,
}: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      aria-label={ariaLabel}
      className={cn(
        // Luma: 34px pill, hairline border, muted text; active inverts to primary.
        'hit-area inline-flex h-[34px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : tone === 'soft'
            ? 'border-border bg-subtle text-muted-foreground hover:text-foreground'
            : 'border-border bg-card text-muted-foreground hover:bg-subtle hover:text-foreground',
        className,
      )}
    >
      {icon}
      {label}
    </button>
  )
}
