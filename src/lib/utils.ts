import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import i18n from "@/i18n"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Canonical money formatter — whole-unit currency whose grouping/symbol localizes to the
 * active UI language (mirrors the `date-utils` locale convention). Use this everywhere
 * instead of re-deriving `Intl.NumberFormat`; the glass `<Amount>` component delegates here.
 */
export function formatMoney(amount: number | string | null | undefined, currency = 'RSD'): string {
  const locale = i18n.language === 'sr' ? 'sr-Latn-RS' : 'en-US'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency || 'RSD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(Number(amount) || 0))
}
