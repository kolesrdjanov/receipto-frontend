import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ScanLine } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import Barcode from 'react-barcode'
import { GlassDialog } from '@/components/glass/glass-dialog'
import { Button } from '@/components/ui/button'
import { getBarcodeFormat, CARD_COLORS } from '@/components/loyalty-cards/format'
import type { LoyaltyCard } from '@/hooks/loyalty-cards/use-loyalty-cards'

interface LoyaltyCardDisplayProps {
  card: LoyaltyCard | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoyaltyCardDisplay({ card, open, onOpenChange }: LoyaltyCardDisplayProps) {
  const { t } = useTranslation()

  // Brighten the screen while showing a code so it scans reliably at checkout.
  useEffect(() => {
    if (!open) return
    const originalBg = document.body.style.backgroundColor
    document.body.style.backgroundColor = '#ffffff'
    return () => {
      document.body.style.backgroundColor = originalBg
    }
  }, [open])

  if (!card) return null

  const color = card.color || CARD_COLORS[0]

  return (
    <GlassDialog
      open={open}
      onOpenChange={onOpenChange}
      title={card.cardName}
      header={<></>}
      desktopWidth={420}
    >
      <div className="flex flex-col items-center gap-[18px]">
        {/* Bright white panel — white in any theme so the code scans reliably. */}
        <div className="flex w-full flex-col items-center gap-4 rounded-3xl border border-[oklch(0_0_0/0.06)] bg-white px-[22px] pb-[18px] pt-[22px] shadow-[0_8px_30px_oklch(0_0_0/0.14)]">
          <div className="flex items-center gap-2 text-[17px] font-bold tracking-[-0.01em] text-[#0b0b0c]">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: color }} />
            {card.cardName}
          </div>

          <div className="overflow-x-auto rounded-xl bg-white p-2.5">
            {card.codeType === 'qr' ? (
              <QRCodeSVG value={card.codeValue} size={200} level="M" includeMargin />
            ) : (
              <Barcode
                value={card.codeValue}
                format={getBarcodeFormat(card.codeFormat) as 'CODE128'}
                width={1.5}
                height={84}
                displayValue
                background="#ffffff"
                lineColor="#000000"
                fontSize={12}
              />
            )}
          </div>

          <p className="select-all break-all text-center font-mono text-[13px] tracking-[0.06em] text-[#555]">
            {card.codeValue}
          </p>
        </div>

        <div className="flex items-center gap-[7px] text-center text-[12px] font-semibold text-muted-foreground">
          <ScanLine className="size-[15px] shrink-0 text-fg-faint" />
          {t('loyaltyCards.showHint')}
        </div>

        <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
          {t('common.close')}
        </Button>
      </div>
    </GlassDialog>
  )
}
