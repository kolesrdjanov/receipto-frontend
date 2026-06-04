import type { TFunction } from 'i18next'
import { differenceInCalendarMonths } from 'date-fns'
import { getWarrantyStatus, getRemainingDays, type Warranty } from '@/hooks/warranties/use-warranties'

export type WarrantyStatus = 'active' | 'expiring' | 'expired'

/* Most-urgent-first within the "All" tab: expiring → active → expired (dimmed last). */
export const STATUS_RANK: Record<WarrantyStatus, number> = { expiring: 0, active: 1, expired: 2 }

/* ------------------------------------------------------------------ */
/* Kind emoji — derived from the product name (no backend field).      */
/* EN + SR keywords; falls back to a neutral package.                  */
/* ------------------------------------------------------------------ */
const KIND_RULES: Array<{ emoji: string; re: RegExp }> = [
  { emoji: '📺', re: /(tv|televizor|qled|oled|monitor|display|ekran)/i },
  { emoji: '📱', re: /(phone|iphone|telefon|galaxy|pixel|xiaomi|mobilni|smartphone)/i },
  { emoji: '💻', re: /(laptop|notebook|macbook|thinkpad|računar|racunar|desktop|tablet|ipad)/i },
  { emoji: '🧊', re: /(fridge|frižider|frizider|freezer|zamrziva)/i },
  { emoji: '🧺', re: /(washer|washing|veš|ves|mašina|masina|sušilica|susilica|dryer|dishwasher|sudoper)/i },
  { emoji: '☕', re: /(coffee|espresso|kafa|delonghi|mixer|blender|toster|toaster|kuhinj|kitchen)/i },
  { emoji: '🎧', re: /(headphone|slušalice|slusalice|earbuds|audio|speaker|zvučnik|zvucnik|soundbar)/i },
  { emoji: '🧹', re: /(vacuum|usisivač|usisivac|dyson|roomba|robot)/i },
]

export function deriveKindEmoji(name?: string | null): string {
  if (!name) return '📦'
  const hit = KIND_RULES.find((r) => r.re.test(name))
  return hit ? hit.emoji : '📦'
}

/** Kind tile tint — a stable accent colour keyed off the emoji bucket. */
const KIND_COLOR: Record<string, string> = {
  '📺': '#0ea5e9',
  '📱': '#8b5cf6',
  '💻': '#06b6d4',
  '🧊': '#10b981',
  '🧺': '#22c55e',
  '☕': '#d97706',
  '🎧': '#ec4899',
  '🧹': '#f43f5e',
  '📦': '#64748b',
}

export function kindColor(emoji: string): string {
  return KIND_COLOR[emoji] || '#64748b'
}

/** 0..1 share of the warranty window that has elapsed (drives the coverage-bar fill). */
export function coveragePercent(w: Warranty): number {
  const start = new Date(w.purchaseDate).getTime()
  const end = new Date(w.warrantyExpires).getTime()
  const now = Date.now()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 1
  return Math.min(1, Math.max(0, (now - start) / (end - start)))
}

/** Granular human remaining label for the coverage-bar centre, e.g. "1 yr 3 mo left". */
export function formatRemaining(w: Warranty, t: TFunction): string {
  const status = getWarrantyStatus(w)
  const expiry = new Date(w.warrantyExpires)

  if (status === 'expired') {
    const days = Math.abs(getRemainingDays(w))
    const months = Math.abs(differenceInCalendarMonths(expiry, new Date()))
    if (days < 31) return t('warranties.remaining.expiredDaysAgo', { count: days })
    if (months < 12) return t('warranties.remaining.expiredMonthsAgo', { count: months })
    return t('warranties.remaining.expiredYearsAgo', { count: Math.round(months / 12) })
  }

  const days = getRemainingDays(w)
  if (days <= 0) return t('warranties.remaining.expiresToday')
  if (days < 31) return t('warranties.remaining.daysLeft', { count: days })

  const months = differenceInCalendarMonths(expiry, new Date())
  if (months < 12) return t('warranties.remaining.monthsLeft', { count: Math.max(1, months) })

  const years = Math.floor(months / 12)
  const rem = months % 12
  return rem === 0
    ? t('warranties.remaining.yearsLeft', { count: years })
    : t('warranties.remaining.yearsMonthsLeft', { years, months: rem })
}

/** Urgency triage sort: expiring → active → expired; tie-break soonest expiry first. */
export function sortWarranties(list: Warranty[]): Warranty[] {
  return [...list].sort((a, b) => {
    const r = STATUS_RANK[getWarrantyStatus(a)] - STATUS_RANK[getWarrantyStatus(b)]
    if (r !== 0) return r
    return new Date(a.warrantyExpires).getTime() - new Date(b.warrantyExpires).getTime()
  })
}
