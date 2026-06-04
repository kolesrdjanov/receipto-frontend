import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Canonical money formatter — Serbian dinar grouping with the currency symbol/code,
 * rounded to whole units. Use this everywhere instead of re-deriving `Intl.NumberFormat`.
 * (`sr-RS` and `sr-Latn-RS` produce identical money output, so the script choice is moot here.)
 */
export function formatMoney(amount: number | string | null | undefined, currency = 'RSD'): string {
  return new Intl.NumberFormat('sr-RS', {
    style: 'currency',
    currency: currency || 'RSD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(Number(amount) || 0))
}
