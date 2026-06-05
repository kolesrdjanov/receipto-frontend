import * as React from 'react'
import { OTPInput, OTPInputContext } from 'input-otp'
import { Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn('flex items-center gap-2 has-[:disabled]:opacity-50', containerClassName)}
    className={cn('disabled:cursor-not-allowed', className)}
    {...props}
  />
))
InputOTP.displayName = 'InputOTP'

const InputOTPGroup = React.forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center gap-2', className)} {...props} />
))
InputOTPGroup.displayName = 'InputOTPGroup'

const InputOTPSlot = React.forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'> & { index: number }
>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext)
  const slot = inputOTPContext?.slots[index]
  const char = slot?.char
  const hasFakeCaret = slot?.hasFakeCaret
  const isActive = slot?.isActive

  return (
    <div
      ref={ref}
      className={cn(
        // Filled glass cell — matches the app-wide Input/Select look.
        'relative grid size-12 place-items-center rounded-xl border border-border bg-bg-subtle/70 text-lg font-semibold text-foreground transition-[border-color,box-shadow] dark:bg-input/55',
        isActive && 'z-10 border-primary ring-4 ring-primary/15',
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-5 w-px animate-pulse bg-foreground" />
        </div>
      )}
    </div>
  )
})
InputOTPSlot.displayName = 'InputOTPSlot'

const InputOTPSeparator = React.forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'>
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <Minus className="size-4 text-fg-faint" />
  </div>
))
InputOTPSeparator.displayName = 'InputOTPSeparator'

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
