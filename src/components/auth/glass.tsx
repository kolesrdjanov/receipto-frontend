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

/* Pill chip showing the destination email address */
export function EmailChip({ email }: { email: string }) {
  return (
    <div className="mt-3.5 inline-block rounded-full border border-border bg-muted px-4 py-2.5 text-sm font-bold text-foreground">
      {email}
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
