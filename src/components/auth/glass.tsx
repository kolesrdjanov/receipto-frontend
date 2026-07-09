import * as React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, type LucideIcon } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { Badge } from '@/components/glass/glass'

type BadgeKind = 'primary' | 'ok' | 'danger'

/* ------------------------------------------------------------------ */
/* Centered card header — logo mark or badge + title + subtitle        */
/* ------------------------------------------------------------------ */
export function CardHead({
  title,
  subtitle,
  badge,
  badgeKind,
  logo = false,
}: {
  title: string
  subtitle?: React.ReactNode
  badge?: LucideIcon
  badgeKind?: BadgeKind
  logo?: boolean
}) {
  return (
    <div className="mb-[22px] text-center">
      {logo ? (
        <div className="mb-4 flex justify-center">
          <Logo size="lg" showText={false} />
        </div>
      ) : badge ? (
        <Badge icon={badge} kind={badgeKind} />
      ) : null}
      <h1 className="text-[27px] font-bold leading-[1.1] tracking-[-0.022em] text-foreground">{title}</h1>
      {subtitle && <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">{subtitle}</p>}
    </div>
  )
}

/* Pill chip showing the destination email address, with an inline Change affordance */
export function EmailChip({ email, onChange, changeLabel }: { email: string; onChange?: () => void; changeLabel?: string }) {
  return (
    <div className="mt-3.5 inline-flex items-center gap-2.5 rounded-full border border-border bg-muted py-2 pl-4 pr-2 text-sm font-bold text-foreground">
      <span className="truncate">{email}</span>
      {onChange && (
        <button
          type="button"
          onClick={onChange}
          className="hit-area shrink-0 rounded-full bg-card px-2.5 py-1 text-[12px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          {changeLabel}
        </button>
      )}
    </div>
  )
}

/* "← Back to sign in" style footer link */
export function BackLink({ to = '/sign-in', children }: { to?: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold text-primary hover:underline"
    >
      <ArrowLeft className="size-3.5" />
      {children}
    </Link>
  )
}
