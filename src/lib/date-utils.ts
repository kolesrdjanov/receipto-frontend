import i18n from '@/i18n'

/**
 * BCP-47 locale for date formatting, derived from the active UI language.
 * Mirrors the `i18n.language === 'sr' ? 'sr-RS' : 'en-US'` convention used elsewhere
 * (e.g. coach-card.tsx) so the month name localizes instead of always rendering English.
 */
function dateLocale(): string {
  return i18n.language === 'sr' ? 'sr-Latn-RS' : 'en-US'
}

/**
 * Format date to "Dec 26 2026 14:14" format (month localized to the active language)
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string
 */
export function formatDateTime(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString

  const month = date.toLocaleString(dateLocale(), { month: 'short' })
  const day = date.getDate()
  const year = date.getFullYear()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')

  return `${month} ${day} ${year} ${hours}:${minutes}`
}

/**
 * Format date to "Dec 26 2026" format (without time; month localized to the active language)
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string
 */
export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString

  const month = date.toLocaleString(dateLocale(), { month: 'short' })
  const day = date.getDate()
  const year = date.getFullYear()

  return `${month} ${day} ${year}`
}

