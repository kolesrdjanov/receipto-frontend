import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Camera, Loader2, ImagePlus } from 'lucide-react'
import {
  useCreateLoyaltyCard,
  useUpdateLoyaltyCard,
  type LoyaltyCard,
  type CreateLoyaltyCardData,
} from '@/hooks/loyalty-cards/use-loyalty-cards'
import { toast } from 'sonner'

const LoyaltyCardScanner = lazy(() =>
  import('./loyalty-card-scanner').then((m) => ({ default: m.LoyaltyCardScanner }))
)

interface LoyaltyCardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  card?: LoyaltyCard | null
}

const CARD_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6',
]

const QR_FORMATS = ['qr_code', 'data_matrix', 'aztec', 'pdf417']

// Hidden element ID for html5-qrcode file scanning (needs a DOM element)
const FILE_SCANNER_ID = 'loyalty-file-scanner'

export function LoyaltyCardModal({ open, onOpenChange, card }: LoyaltyCardModalProps) {
  const { t } = useTranslation()
  const createCard = useCreateLoyaltyCard()
  const updateCard = useUpdateLoyaltyCard()

  const [cardName, setCardName] = useState('')
  const [codeValue, setCodeValue] = useState('')
  const [codeType, setCodeType] = useState<'qr' | 'barcode'>('barcode')
  const [codeFormat, setCodeFormat] = useState('code_128')
  const [color, setColor] = useState(CARD_COLORS[0])
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scanningFile, setScanningFile] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEditing = !!card

  useEffect(() => {
    if (open) {
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
        setColor(CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)])
      }
    }
  }, [open, card])

  const applyScanResult = (value: string, format: string) => {
    setCodeValue(value)
    setCodeFormat(format)
    setCodeType(QR_FORMATS.includes(format) ? 'qr' : 'barcode')
  }

  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setScanningFile(true)
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const html5QrCode = new Html5Qrcode(FILE_SCANNER_ID, { verbose: false })

      const result = await html5QrCode.scanFileV2(file, false)
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

  const handleSubmit = async () => {
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
      onOpenChange(false)
    } catch {
      toast.error(t('common.error'))
    }
  }

  const isPending = createCard.isPending || updateCard.isPending

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? t('loyaltyCards.editCard') : t('loyaltyCards.addCard')}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? t('loyaltyCards.editDescription') : t('loyaltyCards.addDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('loyaltyCards.cardName')}</Label>
              <Input
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder={t('loyaltyCards.cardNamePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('loyaltyCards.codeValue')}</Label>
              <Input
                value={codeValue}
                onChange={(e) => setCodeValue(e.target.value)}
                placeholder={t('loyaltyCards.codeValuePlaceholder')}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 flex-1"
                  disabled={scanningFile}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {scanningFile ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImagePlus className="h-4 w-4" />
                  )}
                  {t('loyaltyCards.scanFromImage')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 flex-1"
                  onClick={() => setScannerOpen(true)}
                >
                  <Camera className="h-4 w-4" />
                  {t('loyaltyCards.scanCard')}
                </Button>
              </div>
              {codeValue && (
                <p className="text-xs text-muted-foreground">
                  {t('loyaltyCards.detectedFormat')}: {codeFormat} ({codeType === 'qr' ? 'QR' : t('loyaltyCards.barcode')})
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t('loyaltyCards.cardColor')}</Label>
              <div className="flex gap-2 flex-wrap">
                {CARD_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="h-8 w-8 rounded-full border-2 transition-all"
                    style={{
                      backgroundColor: c,
                      borderColor: color === c ? '#fff' : 'transparent',
                      outline: color === c ? `2px solid ${c}` : 'none',
                    }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending || !cardName.trim() || !codeValue.trim()}
            >
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? t('common.save') : t('loyaltyCards.addCard')}
            </Button>
          </div>

          {/* Hidden elements for file scanning */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileScan}
          />
          <div id={FILE_SCANNER_ID} className="hidden" />
        </DialogContent>
      </Dialog>

      <Suspense fallback={null}>
        <LoyaltyCardScanner
          open={scannerOpen}
          onOpenChange={setScannerOpen}
          onScan={applyScanResult}
        />
      </Suspense>
    </>
  )
}
