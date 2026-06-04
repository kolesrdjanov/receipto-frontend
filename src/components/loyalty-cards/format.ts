import type { LoyaltyCard } from '@/hooks/loyalty-cards/use-loyalty-cards'

/**
 * The 10 preset card colours. Loyalty cards are the one place where per-item colour
 * is the point, so this palette is intentionally its own (verbatim from the original
 * loyalty modal) — distinct from the calmer category/recurring palette.
 */
export const CARD_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6',
] as const

/** Formats html5-qrcode reports as QR (vs 1-D barcodes). */
export const QR_FORMATS = ['qr_code', 'data_matrix', 'aztec', 'pdf417']

/** A random preset — new cards default to one (matches the original behaviour). */
export function randomCardColor(): string {
  return CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)]
}

/** Short uppercase badge label: "QR" for QR codes, else e.g. "CODE 128" / "EAN 13". */
export function formatLabel(card: Pick<LoyaltyCard, 'codeType' | 'codeFormat'>): string {
  if (card.codeType === 'qr') return 'QR'
  return (card.codeFormat || 'code_128').replace(/_/g, ' ').toUpperCase()
}

/** Map our snake_case codeFormat onto the JsBarcode format names used by react-barcode. */
const FORMAT_TO_JSBARCODE: Record<string, string> = {
  code_128: 'CODE128',
  code_39: 'CODE39',
  code_93: 'CODE93',
  ean_13: 'EAN13',
  ean_8: 'EAN8',
  upc_a: 'UPC',
  upc_e: 'UPC',
  itf: 'ITF',
  codabar: 'codabar',
}

export function getBarcodeFormat(codeFormat: string): string {
  return FORMAT_TO_JSBARCODE[codeFormat] || 'CODE128'
}
