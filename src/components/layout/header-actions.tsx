import { type ComponentProps, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CurrencySelect } from '@/components/ui/currency-select'
import { cn } from '@/lib/utils'

/**
 * Canonical header action-row system — one 40px pill language shared by every page
 * toolbar (desktop) and mobile header. Compose from these instead of hand-rolling
 * toolbar controls so the row never drifts screen-to-screen:
 *
 *  - {@link AddButton}        the brand CTA (h-10 rounded-full) — in `glass/empty-state`
 *  - {@link HeaderIconButton} 40px circular icon button (camera, overflow, import…)
 *  - {@link HeaderCurrencyPill} the single currency switcher
 *  - {@link HeaderStepper}    40px period stepper (‹ Month ›)
 *
 * All sit at exactly 40px tall with `gap-2` between them (the PageToolbar default).
 */

/** Shared trigger look for header pills: 40px, rounded-full, bordered card surface. */
export const HEADER_PILL =
  'h-10 rounded-full border border-border bg-card text-fg-2 shadow-sm transition-colors hover:bg-bg-subtle hover:text-foreground'

/**
 * 40px circular icon button for header toolbars (camera, overflow menu, import/export…).
 * 40px visual + a ≥44px tap target via `hit-area`. Requires an accessible `label`.
 */
export function HeaderIconButton({
  icon: Icon,
  label,
  className,
  ...props
}: {
  icon: LucideIcon
  label: string
} & Omit<ComponentProps<typeof Button>, 'children' | 'aria-label'>) {
  return (
    <Button
      type="button"
      variant="glass"
      aria-label={label}
      className={cn('size-10 shrink-0 rounded-full hit-area [&_svg]:size-[18px]', className)}
      {...props}
    >
      <Icon aria-hidden="true" />
    </Button>
  )
}

/**
 * The single currency switcher used in every header (dashboard, group detail, …).
 * A 40px rounded-full pill wrapping the shared {@link CurrencySelect} — flag + code +
 * chevron, no bespoke wrapper.
 */
export function HeaderCurrencyPill({
  value,
  onValueChange,
  placeholder,
  className,
  'data-testid': testId,
}: {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  'data-testid'?: string
}) {
  return (
    <CurrencySelect
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      data-testid={testId}
      triggerClassName={cn(
        HEADER_PILL,
        'w-auto min-w-[88px] gap-1.5 px-3.5 text-[13px] font-medium dark:bg-card',
        className,
      )}
    />
  )
}

/**
 * 40px period stepper pill: ‹ label ›. Used for the dashboard month switcher; reuse
 * for any prev/label/next header control.
 */
export function HeaderStepper({
  label,
  onPrev,
  onNext,
  prevLabel,
  nextLabel,
  prevDisabled,
  nextDisabled,
  labelClassName,
}: {
  label: ReactNode
  onPrev: () => void
  onNext: () => void
  prevLabel: string
  nextLabel: string
  prevDisabled?: boolean
  nextDisabled?: boolean
  labelClassName?: string
}) {
  return (
    <div className={cn('inline-flex shrink-0 items-center px-1', HEADER_PILL, 'hover:bg-card')}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onPrev}
        disabled={prevDisabled}
        aria-label={prevLabel}
        className="size-8 rounded-full text-fg-2 hit-area"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
      </Button>
      <span className={cn('min-w-[104px] text-center text-[13px] font-semibold', labelClassName)}>{label}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onNext}
        disabled={nextDisabled}
        aria-label={nextLabel}
        className="size-8 rounded-full text-fg-2 hit-area"
      >
        <ChevronRight className="size-4" aria-hidden="true" />
      </Button>
    </div>
  )
}
