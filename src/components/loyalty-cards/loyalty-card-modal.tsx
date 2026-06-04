import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { CreditCard, Barcode, Camera, Loader2, ImagePlus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { GlassDialog } from '@/components/glass/glass-dialog'
import { Field } from '@/components/glass/glass'
import { Button } from '@/components/ui/button'
import { ColorSwatches, CodeGlyph, FormatBadge } from '@/components/loyalty-cards/primitives'
import { CARD_COLORS, QR_FORMATS, randomCardColor } from '@/components/loyalty-cards/format'
import {
  useCreateLoyaltyCard,
  useUpdateLoyaltyCard,
  type LoyaltyCard,
  type CreateLoyaltyCardData,
} from '@/hooks/loyalty-cards/use-loyalty-cards'

const LoyaltyCardScanner = lazy(() =>
  import('./loyalty-card-scanner').then((m) => ({ default: m.LoyaltyCardScanner }))
)

const FORM_ID = 'loyalty-card-form'
// Hidden element ID for html5-qrcode file scanning (needs a DOM element)
const FILE_SCANNER_ID = 'loyalty-file-scanner'

interface LoyaltyCardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  card?: LoyaltyCard | null
  /** Routes Delete (edit mode) to the page's delete confirm flow. */
  onRequestDelete?: (card: LoyaltyCard) => void
}

export function LoyaltyCardModal({ open, onOpenChange, card, onRequestDelete }: LoyaltyCardModalProps) {
  const { t } = useTranslation()
  const createCard = useCreateLoyaltyCard()
  const updateCard = useUpdateLoyaltyCard()

  const [cardName, setCardName] = useState('')
  const [codeValue, setCodeValue] = useState('')
  const [codeType, setCodeType] = useState<'qr' | 'barcode'>('barcode')
  const [codeFormat, setCodeFormat] = useState('code_128')
  const [color, setColor] = useState<string>(CARD_COLORS[0])
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scanningFile, setScanningFile] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const isEditing = !!card

  useEffect(() => {
    if (!open) return
    if (card) {
      setCardName(card.cardName)
      setCodeValue(card.codeValue)
      setCodeType(card.codeType)
      setCodeFormat(card.codeFormat)
      setColor(card.color || CARD_COLORS[0])
    } else {
      setCardName('')
      setCodeValue('')
      setCodeType('barcode')
      setCodeFormat('code_128')
      setColor(randomCardColor())
    }
  }, [open, card])

  const applyScanResult = (value: string, format: string) => {
    setCodeValue(value)
    setCodeFormat(format)
    setCodeType(QR_FORMATS.includes(format) ? 'qr' : 'barcode')
  }

  const resizeImage = (file: File, maxDimension = 1200): Promise<File> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        if (img.width <= maxDimension && img.height <= maxDimension) {
          URL.revokeObjectURL(img.src)
          resolve(file)
          return
        }
        const scale = maxDimension / Math.max(img.width, img.height)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        URL.revokeObjectURL(img.src)
        canvas.toBlob(
          (blob) => resolve(new File([blob!], file.name, { type: 'image/jpeg' })),
          'image/jpeg',
          0.9,
        )
      }
      img.onerror = () => {
        URL.revokeObjectURL(img.src)
        resolve(file)
      }
      img.src = URL.createObjectURL(file)
    })
  }

  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setScanningFile(true)
    try {
      const resized = await resizeImage(file)
      const { Html5Qrcode } = await import('html5-qrcode')
      const html5QrCode = new Html5Qrcode(FILE_SCANNER_ID, { verbose: false })

      const result = await html5QrCode.scanFileV2(resized, false)
      const format = result?.result?.format?.formatName || 'CODE_128'
      const normalizedFormat = format.toLowerCase().replace(/-/g, '_')

      html5QrCode.clear()
      applyScanResult(result.decodedText, normalizedFormat)
      toast.success(t('loyaltyCards.imageScanSuccess'))
    } catch {
      toast.error(t('loyaltyCards.imageScanError'))
    } finally {
      setScanningFile(false)
    }
  }

  const close = () => onOpenChange(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cardName.trim() || !codeValue.trim()) return

    const data: CreateLoyaltyCardData = {
      cardName: cardName.trim(),
      codeType,
      codeFormat,
      codeValue: codeValue.trim(),
      color,
    }

    try {
      if (isEditing && card) {
        await updateCard.mutateAsync({ id: card.id, data })
        toast.success(t('loyaltyCards.cardUpdated'))
      } else {
        await createCard.mutateAsync(data)
        toast.success(t('loyaltyCards.cardAdded'))
      }
      close()
    } catch {
      toast.error(t('common.error'))
    }
  }

  const requestDelete = () => {
    if (!card) return
    onOpenChange(false)
    onRequestDelete?.(card)
  }

  const isPending = createCard.isPending || updateCard.isPending
  const canSubmit = !!cardName.trim() && !!codeValue.trim() && !isPending
  const primaryLabel = isEditing ? t('common.save') : t('loyaltyCards.addCard')

  const previewCard = { cardName, codeType, codeFormat, codeValue, color } as LoyaltyCard

  const footer = (
    <>
      {/* Desktop */}
      <div className="hidden items-center gap-2 md:flex">
        {isEditing ? (
          <Button type="button" variant="destructive" size="sm" className="mr-auto" onClick={requestDelete}>
            <Trash2 className="size-4" />
            {t('common.delete')}
          </Button>
        ) : (
          <div className="flex-1" />
        )}
        <Button type="button" variant="outline" onClick={close} disabled={isPending}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" form={FORM_ID} disabled={!canSubmit}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {primaryLabel}
        </Button>
      </div>
      {/* Mobile */}
      <div className="flex flex-col gap-2 md:hidden">
        <Button type="submit" form={FORM_ID} className="w-full" disabled={!canSubmit}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {primaryLabel}
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={close} disabled={isPending}>
          {t('common.cancel')}
        </Button>
        {isEditing && (
          <Button type="button" variant="ghost" className="w-full text-destructive hover:text-destructive" onClick={requestDelete}>
            <Trash2 className="size-4" />
            {t('loyaltyCards.deleteTitle')}
          </Button>
        )}
      </div>
    </>
  )

  return (
    <>
      <GlassDialog
        open={open}
        onOpenChange={(v) => (v ? onOpenChange(true) : close())}
        title={isEditing ? t('loyaltyCards.editCard') : t('loyaltyCards.addCard')}
        description={isEditing ? t('loyaltyCards.editDescription') : t('loyaltyCards.addDescription')}
        desktopWidth={440}
        footer={footer}
      >
        <form id={FORM_ID} onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Card name */}
          <Field
            label={t('loyaltyCards.cardName')}
            icon={CreditCard}
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            placeholder={t('loyaltyCards.cardNamePlaceholder')}
          />

          {/* Card code + scan affordances */}
          <div>
            <Field
              label={t('loyaltyCards.codeValue')}
              icon={Barcode}
              value={codeValue}
              onChange={(e) => setCodeValue(e.target.value)}
              placeholder={t('loyaltyCards.codeValuePlaceholder')}
              className="font-mono"
            />
            <div className="mt-2.5 flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-10 flex-1 gap-2"
                disabled={scanningFile}
                onClick={() => fileInputRef.current?.click()}
              >
                {scanningFile ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
                {t('loyaltyCards.scanFromImage')}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10 flex-1 gap-2"
                onClick={() => setScannerOpen(true)}
              >
                <Camera className="size-4" />
                {t('loyaltyCards.scanCard')}
              </Button>
            </div>
            {codeValue && (
              <p className="ml-0.5 mt-2.5 text-[12px] font-medium text-muted-foreground">
                {t('loyaltyCards.detectedFormat')}: <b className="text-fg-2">{codeFormat}</b>{' '}
                ({codeType === 'qr' ? 'QR' : t('loyaltyCards.barcode')})
              </p>
            )}
          </div>

          {/* Card colour */}
          <div>
            <label className="mb-2 ml-0.5 block text-xs font-semibold text-muted-foreground">
              {t('loyaltyCards.cardColor')}
            </label>
            <ColorSwatches value={color} onChange={setColor} />
          </div>

          {/* Live preview */}
          {cardName.trim() && codeValue.trim() && (
            <div>
              <label className="mb-1.5 ml-0.5 block text-xs font-semibold text-muted-foreground">
                {t('loyaltyCards.preview')}
              </label>
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-glass-1">
                <div className="h-[5px] w-full" style={{ background: color }} />
                <div className="flex items-start gap-[11px] px-[15px] py-3.5">
                  <CodeGlyph card={previewCard} />
                  <div className="min-w-0 grow">
                    <div className="truncate text-[15px] font-bold leading-[1.25] tracking-[-0.01em]">{cardName}</div>
                    <div className="mt-[3px] truncate font-mono text-[12px] tracking-[0.02em] text-muted-foreground">
                      {codeValue}
                    </div>
                  </div>
                  <FormatBadge card={previewCard} />
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Hidden elements for file scanning */}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileScan} />
        <div id={FILE_SCANNER_ID} className="hidden" />
      </GlassDialog>

      <Suspense fallback={null}>
        <LoyaltyCardScanner open={scannerOpen} onOpenChange={setScannerOpen} onScan={applyScanResult} />
      </Suspense>
    </>
  )
}
