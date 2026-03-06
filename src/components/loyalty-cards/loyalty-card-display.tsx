import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { QRCodeSVG } from 'qrcode.react'
import Barcode from 'react-barcode'
import type { LoyaltyCard } from '@/hooks/loyalty-cards/use-loyalty-cards'

interface LoyaltyCardDisplayProps {
  card: LoyaltyCard | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

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

function getBarcodeFormat(codeFormat: string): string {
  return FORMAT_TO_JSBARCODE[codeFormat] || 'CODE128'
}

export function LoyaltyCardDisplay({ card, open, onOpenChange }: LoyaltyCardDisplayProps) {
  const { t } = useTranslation()

  // Increase brightness when showing card
  useEffect(() => {
    if (!open) return
    const meta = document.querySelector('meta[name="color-scheme"]')
    const originalBg = document.body.style.backgroundColor
    document.body.style.backgroundColor = '#ffffff'
    return () => {
      document.body.style.backgroundColor = originalBg
      if (meta) meta.setAttribute('content', meta.getAttribute('content') || '')
    }
  }, [open])

  if (!card) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[480px] bg-white text-black">
        <DialogHeader>
          <DialogTitle className="text-center text-black text-lg">
            {card.cardName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-4 sm:py-6 gap-4">
          {card.codeType === 'qr' ? (
            <div className="bg-white p-2 sm:p-4 rounded-lg">
              <QRCodeSVG
                value={card.codeValue}
                size={200}
                level="M"
                includeMargin
                className="h-auto w-full max-w-[200px] sm:max-w-[240px]"
              />
            </div>
          ) : (
            <div className="bg-white p-2 sm:p-4 rounded-lg overflow-x-auto max-w-full">
              <Barcode
                value={card.codeValue}
                format={getBarcodeFormat(card.codeFormat) as 'CODE128'}
                width={1.5}
                height={80}
                displayValue
                background="#ffffff"
                lineColor="#000000"
                fontSize={12}
              />
            </div>
          )}

          <p className="text-xs sm:text-sm text-gray-500 font-mono select-all break-all text-center">
            {card.codeValue}
          </p>
        </div>

        <div className="flex justify-center">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-black border-gray-300">
            {t('common.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
