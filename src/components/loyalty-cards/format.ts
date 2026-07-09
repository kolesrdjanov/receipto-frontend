import type { LoyaltyCard } from '@/hooks/loyalty-cards/use-loyalty-cards'

// Per-card colour was dropped with the Luma redesign (handoff §6) — cards are neutral;
// the code-type glyph + format badge carry the identity. The backend `color` column is
// simply no longer written or read.

/** Formats html5-qrcode reports as QR (vs 1-D barcodes). */
export const QR_FORMATS = ['qr_code', 'data_matrix', 'aztec', 'pdf417']

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
