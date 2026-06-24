import * as React from 'react'
import { cn } from '@/lib/utils'

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  /** Extra classes for the fill indicator (e.g. `rounded-full`). */
  indicatorClassName?: string
  /** CSS color for the fill, overriding the default `bg-primary` (e.g. a status tint). */
  indicatorColor?: string
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, indicatorClassName, indicatorColor, ...props }, ref) => {
    const clamped = Math.round(Math.min(Math.max(value, 0), 100))
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-full bg-primary/20',
          className
        )}
        {...props}
      >
        <div
          className={cn('h-full bg-primary transition-all', indicatorClassName)}
          style={{
            width: `${clamped}%`,
            ...(indicatorColor ? { background: indicatorColor } : null),
          }}
        />
      </div>
    )
  }
)
Progress.displayName = 'Progress'

export { Progress }
