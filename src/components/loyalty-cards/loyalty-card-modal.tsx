import { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Camera, Loader2, ImagePlus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { GlassDialog } from '@/components/glass/glass-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
// Canonical form-modal field label — keep in sync with receipts/receipt-modal.tsx.
const fieldLabel = 'mb-1.5 ml-0.5 block text-[12px] font-semibold text-fg-2'

const createLoyaltyCardSchema = (t: (key: string, opts?: Record<string, unknown>) => string) =>
  z.object({
    cardName: z.string().trim().min(1, t('common.validation.fieldRequired', { field: t('loyaltyCards.cardName') })),
    codeValue: z.string().trim().min(1, t('common.validation.fieldRequired', { field: t('loyaltyCards.codeValue') })),
    codeType: z.enum(['qr', 'barcode']),
    codeFormat: z.string(),
    color: z.string(),
  })

type LoyaltyCardForm = z.infer<ReturnType<typeof createLoyaltyCardSchema>>

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

  const [scannerOpen, setScannerOpen] = useState(false)
  const [scanningFile, setScanningFile] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const isEditing = !!card

  const schema = useMemo(() => createLoyaltyCardSchema(t), [t])
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LoyaltyCardForm>({
    resolver: zodResolver(schema),
    defaultValues: { cardName: '', codeValue: '', codeType: 'barcode', codeFormat: 'code_128', color: CARD_COLORS[0] },
  })

  const cardName = watch('cardName')
  const codeValue = watch('codeValue')
  const codeType = watch('codeType')
  const codeFormat = watch('codeFormat')
  const color = watch('color')

  useEffect(() => {
    if (!open) return
    if (card) {
      reset({
        cardName: card.cardName,
        codeValue: card.codeValue,
        codeType: card.codeType,
        codeFormat: card.codeFormat,
        color: card.color || CARD_COLORS[0],
      })
    } else {
      reset({
        cardName: '',
        codeValue: '',
        codeType: 'barcode',
        codeFormat: 'code_128',
        color: randomCardColor(),
      })
    }
  }, [open, card, reset])

  const applyScanResult = (value: string, format: string) => {
    setValue('codeValue', value, { shouldValidate: true })
    setValue('codeFormat', format)
    setValue('codeType', QR_FORMATS.includes(format) ? 'qr' : 'barcode')
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

  const onSubmit = async (form: LoyaltyCardForm) => {
    const data: CreateLoyaltyCardData = {
      cardName: form.cardName.trim(),
      codeType: form.codeType,
      codeFormat: form.codeFormat,
      codeValue: form.codeValue.trim(),
      color: form.color,
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

  const actions = {
    primary: (
      <Button type="submit" form={FORM_ID} disabled={!canSubmit}>
        {isPending && <Loader2 className="size-4 animate-spin" />}
        {primaryLabel}
      </Button>
    ),
    secondary: (
      <Button type="button" variant="outline" onClick={close} disabled={isPending}>
        {t('common.cancel')}
      </Button>
    ),
    destructive: isEditing ? (
      <Button
        type="button"
        variant="ghost"
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={requestDelete}
      >
        <Trash2 className="size-4" />
        {t('common.delete')}
      </Button>
    ) : undefined,
  }

  return (
    <>
      <GlassDialog
        open={open}
        onOpenChange={(v) => (v ? onOpenChange(true) : close())}
        title={isEditing ? t('loyaltyCards.editCard') : t('loyaltyCards.addCard')}
        description={isEditing ? t('loyaltyCards.editDescription') : t('loyaltyCards.addDescription')}
        desktopWidth={440}
        actions={actions}
      >
        <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Card name */}
          <div>
            <label htmlFor="loyalty-card-name" className={fieldLabel}>
              {t('loyaltyCards.cardName')}
            </label>
            <Input
              id="loyalty-card-name"
              placeholder={t('loyaltyCards.cardNamePlaceholder')}
              {...register('cardName')}
            />
            {errors.cardName?.message && (
              <p className="mt-1 ml-0.5 text-[13px] text-destructive">{errors.cardName.message}</p>
            )}
          </div>

          {/* Card code + scan affordances */}
          <div>
            <label htmlFor="loyalty-code-value" className={fieldLabel}>
              {t('loyaltyCards.codeValue')}
            </label>
            <Input
              id="loyalty-code-value"
              className="font-mono"
              placeholder={t('loyaltyCards.codeValuePlaceholder')}
              {...register('codeValue')}
            />
            {errors.codeValue?.message && (
              <p className="mt-1 ml-0.5 text-[13px] text-destructive">{errors.codeValue.message}</p>
            )}
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
            <label className={fieldLabel}>
              {t('loyaltyCards.cardColor')}
            </label>
            <ColorSwatches value={color} onChange={(c) => setValue('color', c)} />
          </div>

          {/* Live preview */}
          {cardName.trim() && codeValue.trim() && (
            <div>
              <label className={fieldLabel}>
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
