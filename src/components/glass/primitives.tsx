import { useTranslation } from 'react-i18next'
import { Receipt as ReceiptIcon, Check } from 'lucide-react'
import { cn, formatMoney } from '@/lib/utils'

/**
 * Cross-feature Glass list primitives. These are shared by every list feature
 * (receipts, recurring, …) and intentionally carry no domain logic — keep
 * feature-specific maps (status→tone, palettes, emoji derivation) in the
 * feature's own `primitives.tsx`.
 */

/** Tabular formatted amount. Delegates to the canonical `formatMoney` so rows, totals and
 *  detail screens never disagree on how a currency renders (single source of truth). */
export function Amount({
  value, currency = 'RSD', size = 15.5, weight = 700, muted = false, className,
}: { value: number | string; currency?: string; size?: number; weight?: number; muted?: boolean; className?: string }) {
  return (
    <span
      className={cn('shrink-0', muted ? 'text-muted-foreground' : 'text-foreground', className)}
      style={{ fontSize: size, fontWeight: weight, lineHeight: 1 }}
    >
      {formatMoney(value, currency)}
    </span>
  )
}

/** Category emoji tile; uncategorized → dashed neutral tile + receipt glyph. */
export function CatTile({
  category, size = 42, radius = 13, font = 20, className,
}: { category?: { color?: string; icon?: string } | null; size?: number; radius?: number; font?: number; className?: string }) {
  if (category?.icon) {
    return (
      <div
        className={cn('grid shrink-0 place-items-center', className)}
        style={{ width: size, height: size, borderRadius: radius, fontSize: font, lineHeight: 1, background: (category.color || '#888') + '1f' }}
      >
        <span>{category.icon}</span>
      </div>
    )
  }
  return (
    <div
      className={cn('grid shrink-0 place-items-center border border-dashed border-border bg-bg-subtle text-fg-faint', className)}
      style={{ width: size, height: size, borderRadius: radius }}
    >
      <ReceiptIcon style={{ width: font, height: font }} />
    </div>
  )
}

/** Category name as plain muted text (list rows). */
export function CatName({ name, className }: { name?: string | null; className?: string }) {
  const { t } = useTranslation()
  return (
    <span className={cn('truncate text-[13px] font-medium text-muted-foreground', className)} style={{ maxWidth: 140 }}>
      {name || t('receipts.uncategorized', { defaultValue: 'Uncategorized' })}
    </span>
  )
}

/** Selection checkbox (on / off). */
export function SelectCheck({ on, className }: { on?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        'grid size-5 shrink-0 place-items-center rounded-md border-2 transition-colors',
        on ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card',
        className,
      )}
    >
      <Check className={cn('size-3.5', on ? 'opacity-100' : 'opacity-0')} strokeWidth={3} />
    </span>
  )
}
