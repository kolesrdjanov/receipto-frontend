import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { CircleAlert, Check, Eye, EyeOff, Loader2, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* Decorative brand wash — three blurred radial blobs, purely cosmetic */
/* ------------------------------------------------------------------ */
export function BrandWash({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <div
        className="absolute -left-24 -top-28 size-[380px] rounded-full opacity-20 blur-[72px] dark:opacity-30"
        style={{ background: 'var(--brand-emerald)' }}
      />
      <div
        className="absolute -bottom-24 -right-20 size-[340px] rounded-full opacity-20 blur-[72px] dark:opacity-30"
        style={{ background: 'var(--brand-violet)' }}
      />
      <div
        className="absolute left-[34%] top-[42%] size-[300px] rounded-full opacity-[0.12] blur-[72px]"
        style={{ background: 'var(--brand-cyan)' }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Glass floating-label field                                          */
/* ------------------------------------------------------------------ */
interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon?: LucideIcon
  error?: string
  /** Red border without a helper message (e.g. a top-of-form API error). */
  invalid?: boolean
  trailing?: React.ReactNode
  containerClassName?: string
}

export const Field = React.forwardRef<HTMLInputElement, FieldProps>(
  ({ label, icon: Icon, error, invalid, trailing, id, name, className, containerClassName, ...props }, ref) => {
    const inputId = id || name
    const showError = !!error || !!invalid
    return (
      <div className={cn('min-w-0 flex-1', containerClassName)}>
        <label htmlFor={inputId} className="mb-1.5 ml-0.5 block text-xs font-semibold text-muted-foreground">
          {label}
        </label>
        <div
          className={cn(
            'flex h-[50px] items-center gap-2.5 rounded-[14px] border bg-muted/60 px-3.5 transition-[border-color,box-shadow]',
            'focus-within:ring-4',
            showError
              ? 'border-destructive focus-within:border-destructive focus-within:ring-destructive/15'
              : 'border-border focus-within:border-primary focus-within:ring-primary/15',
          )}
        >
          {Icon && <Icon className="size-[17px] shrink-0 text-fg-faint" />}
          <input
            id={inputId}
            name={name}
            ref={ref}
            className={cn(
              'min-w-0 flex-1 border-0 bg-transparent text-[15px] font-medium text-foreground outline-none',
              'placeholder:font-normal placeholder:text-fg-faint',
              className,
            )}
            {...props}
          />
          {trailing}
        </div>
        {error && (
          <p className="mt-1.5 ml-0.5 flex items-center gap-1.5 text-xs font-medium text-destructive">
            <CircleAlert className="size-3.5 shrink-0" />
            {error}
          </p>
        )}
      </div>
    )
  },
)
Field.displayName = 'Field'

/* Glass field with a built-in password visibility toggle */
export const PasswordField = React.forwardRef<HTMLInputElement, Omit<FieldProps, 'trailing' | 'type'>>(
  (props, ref) => {
    const { t } = useTranslation()
    const [show, setShow] = React.useState(false)
    return (
      <Field
        {...props}
        ref={ref}
        type={show ? 'text' : 'password'}
        trailing={
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShow((v) => !v)}
            aria-label={show ? t('auth.hidePassword') : t('auth.showPassword')}
            className="grid size-[30px] shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        }
      />
    )
  },
)
PasswordField.displayName = 'PasswordField'

/* ------------------------------------------------------------------ */
/* Password strength meter (scoring mirrors the sign-up zod rule)      */
/* ------------------------------------------------------------------ */
export function scorePassword(v: string): number {
  let s = 0
  if (v.length >= 8) s++
  if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++
  if (/\d/.test(v)) s++
  if (v.length >= 12 && /[^A-Za-z0-9]/.test(v)) s++
  return Math.min(s, 4)
}

const STRENGTH = [
  { key: 'auth.passwordStrength.weak', bar: 'bg-destructive', text: 'text-destructive' },
  { key: 'auth.passwordStrength.fair', bar: 'bg-warning', text: 'text-warning-foreground' },
  { key: 'auth.passwordStrength.good', bar: 'bg-info', text: 'text-info-foreground' },
  { key: 'auth.passwordStrength.strong', bar: 'bg-success', text: 'text-success-foreground' },
] as const

export function PasswordStrengthMeter({ value }: { value: string }) {
  const { t } = useTranslation()
  const score = scorePassword(value)
  const meta = score > 0 ? STRENGTH[score - 1] : null
  return (
    <div className="mt-2.5 flex items-center gap-2">
      <div className="flex flex-1 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn('h-1 flex-1 rounded-full transition-colors', i < score && meta ? meta.bar : 'bg-border')}
          />
        ))}
      </div>
      <span
        className={cn('min-w-[42px] text-right text-[11.5px] font-semibold', meta ? meta.text : 'text-fg-faint')}
      >
        {meta ? t(meta.key) : '—'}
      </span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Inline alert block (err / warn / ok / info)                         */
/* ------------------------------------------------------------------ */
type AlertKind = 'err' | 'warn' | 'ok' | 'info'

const ALERT_STYLES: Record<AlertKind, string> = {
  err: 'bg-destructive/10 text-destructive',
  warn: 'bg-warning-soft text-warning-foreground',
  ok: 'bg-success-soft text-success-foreground',
  info: 'bg-info-soft text-info-foreground',
}

export function Alert({
  kind = 'err',
  icon: Icon,
  children,
  className,
}: {
  kind?: AlertKind
  icon?: LucideIcon
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'mb-4 flex items-start gap-2.5 rounded-[10px] px-3.5 py-3 text-[13px] font-medium leading-relaxed',
        ALERT_STYLES[kind],
        className,
      )}
    >
      {Icon && <Icon className="mt-px size-4 shrink-0" />}
      <div className="flex-1">{children}</div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Round icon badge (screen header for non-logo screens)               */
/* ------------------------------------------------------------------ */
type BadgeKind = 'primary' | 'ok' | 'danger'

const BADGE_STYLES: Record<BadgeKind, string> = {
  primary: 'bg-primary-soft text-primary',
  ok: 'bg-success-soft text-success-foreground',
  danger: 'bg-destructive/10 text-destructive',
}

export function Badge({ icon: Icon, kind = 'primary' }: { icon: LucideIcon; kind?: BadgeKind }) {
  return (
    <div className={cn('mx-auto mb-[18px] grid size-[60px] place-items-center rounded-[18px] shadow-sm', BADGE_STYLES[kind])}>
      <Icon className="size-[26px]" />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Brand-gradient primary CTA                                          */
/* ------------------------------------------------------------------ */
interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  loadingText?: string
}

export function GradientButton({
  loading = false,
  loadingText,
  children,
  className,
  disabled,
  ...props
}: GradientButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading}
      className={cn(
        'btn-brand inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full text-base font-semibold',
        'disabled:opacity-90',
        loading && 'cursor-progress',
        className,
      )}
    >
      {loading ? (
        <>
          <Loader2 className="size-[18px] animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  )
}

/* Neutral secondary pill button (resend actions) */
export function SecondaryButton({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border bg-card text-[15px] font-semibold text-foreground shadow-sm transition-colors hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
    >
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Custom checkbox (no shadcn Checkbox in this app)                    */
/* ------------------------------------------------------------------ */
type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>

export function Checkbox({ className, checked, ...props }: CheckboxProps) {
  return (
    <label className={cn('relative inline-flex shrink-0 cursor-pointer', className)}>
      <input type="checkbox" checked={checked} className="peer sr-only" {...props} />
      <span
        className={cn(
          'grid size-5 place-items-center rounded-md border-2 transition-colors',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-focus-visible:ring-offset-1',
          checked ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
        )}
      >
        <Check className={cn('size-3.5', checked ? 'opacity-100' : 'opacity-0')} strokeWidth={3} />
      </span>
    </label>
  )
}

/* ------------------------------------------------------------------ */
/* Official 4-color Google "G"                                         */
/* ------------------------------------------------------------------ */
export function GoogleGIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* "or" divider with hairline rules                                    */
/* ------------------------------------------------------------------ */
export function Divider({ label }: { label: string }) {
  return (
    <div className="my-[18px] flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-fg-faint">{label}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}
