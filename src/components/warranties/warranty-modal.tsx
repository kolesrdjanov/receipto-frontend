import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Package, Store, Shield, UploadCloud, FileText, X, Info, Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { GlassDialog } from '@/components/glass/glass-dialog'
import { Field } from '@/components/glass/glass'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { StatusBadge } from '@/components/warranties/primitives'
import { formatDate } from '@/lib/date-utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import {
  useCreateWarranty,
  useUpdateWarranty,
  type Warranty,
  type CreateWarrantyData,
  MAX_WARRANTY_FILES,
} from '@/hooks/warranties/use-warranties'

const FORM_ID = 'warranty-form'

interface WarrantyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  warranty?: Warranty | null
  mode: 'create' | 'edit'
  /** Routes delete through the page-level shared ConfirmDialog. */
  onRequestDelete?: (warranty: Warranty) => void
}

type PreviewItem = {
  type: 'remote' | 'local'
  src: string
  remoteIndex?: number
  localIndex?: number
}

const today = () => new Date().toISOString().split('T')[0]

const createWarrantySchema = (t: (key: string, opts?: Record<string, unknown>) => string) =>
  z.object({
    productName: z.string().min(1, t('warranties.modal.errors.productNameRequired')),
    storeName: z.string().optional(),
    purchaseDate: z.string().min(1, t('warranties.modal.errors.purchaseDateRequired')),
    warrantyDuration: z.preprocess(
      (v) => (v === '' || v === null || v === undefined ? undefined : v),
      z.coerce.number().optional(),
    ),
    notes: z.string().optional(),
  })

type WarrantySchema = ReturnType<typeof createWarrantySchema>
type WarrantyFormInput = z.input<WarrantySchema>
type WarrantyForm = z.output<WarrantySchema>

export function WarrantyModal({ open, onOpenChange, warranty, mode, onRequestDelete }: WarrantyModalProps) {
  const { t } = useTranslation()
  const isMobile = useIsMobile(768)

  const [removeFileIndices, setRemoveFileIndices] = useState<number[]>([])
  const [localImages, setLocalImages] = useState<File[]>([])
  const [localPreviews, setLocalPreviews] = useState<string[]>([])

  const schema = useMemo(() => createWarrantySchema(t), [t])
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<WarrantyFormInput, unknown, WarrantyForm>({
    resolver: zodResolver(schema),
    defaultValues: { productName: '', storeName: '', purchaseDate: today(), warrantyDuration: 24, notes: '' },
  })

  const createWarranty = useCreateWarranty()
  const updateWarranty = useUpdateWarranty()
  const pending = isSubmitting || createWarranty.isPending || updateWarranty.isPending

  /* ---- file preview list (remaining remote + new local) ---- */
  const buildPreviewItems = (): PreviewItem[] => {
    const items: PreviewItem[] = []
    if (mode === 'edit' && Array.isArray(warranty?.files)) {
      warranty!.files.forEach((file, index) => {
        if (!removeFileIndices.includes(index)) items.push({ type: 'remote', src: file.url, remoteIndex: index })
      })
    }
    localPreviews.forEach((src, idx) => items.push({ type: 'local', src, localIndex: idx }))
    return items
  }
  const previewItems = buildPreviewItems()
  const totalFileCount = previewItems.length
  const remainingSlots = Math.max(0, MAX_WARRANTY_FILES - totalFileCount)
  const canAddMore = remainingSlots > 0

  const revokePreviews = (previews: string[]) =>
    previews.forEach((p) => p.startsWith('blob:') && URL.revokeObjectURL(p))
  const resetFileInputs = () => {
    const el = document.getElementById('warranty-files') as HTMLInputElement | null
    if (el) el.value = ''
  }
  const clearAll = () => {
    setRemoveFileIndices([])
    setLocalImages([])
    setLocalPreviews((prev) => {
      revokePreviews(prev)
      return []
    })
    resetFileInputs()
  }

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && warranty) {
      reset({
        productName: warranty.productName,
        storeName: warranty.storeName || '',
        purchaseDate: warranty.purchaseDate.split('T')[0],
        warrantyDuration: warranty.warrantyDuration || undefined,
        notes: warranty.notes || '',
      })
    } else {
      reset({ productName: '', storeName: '', purchaseDate: today(), warrantyDuration: 24, notes: '' })
    }
    clearAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, warranty?.id])

  /* ---- HEIC conversion (kept verbatim) ---- */
  const isHeicFile = (file: File): boolean =>
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    file.name.toLowerCase().endsWith('.heic') ||
    file.name.toLowerCase().endsWith('.heif')

  const convertIfHeic = async (file: File): Promise<File> => {
    if (!isHeicFile(file)) return file
    try {
      const { default: heic2any } = await import('heic2any')
      const convertedBlob = (await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 })) as Blob
      return new File([convertedBlob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' })
    } catch {
      return file
    }
  }

  const addFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !canAddMore) return
    try {
      const toAdd = Array.from(files).slice(0, remainingSlots)
      const processed = await Promise.all(
        toAdd.map((file) => (file.type === 'application/pdf' ? file : convertIfHeic(file))),
      )
      resetFileInputs()
      setLocalImages((prev) => [...prev, ...processed])
      setLocalPreviews((prev) => [
        ...prev,
        ...processed.map((f) =>
          f.type === 'application/pdf' ? 'pdf-placeholder' : isHeicFile(f) ? 'heic-placeholder' : URL.createObjectURL(f),
        ),
      ])
    } catch {
      toast.error(t('warranties.modal.createError'), { description: 'Failed to process file. Please try a different format.' })
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => addFiles(e.target.files)

  const removePreviewItem = (item: PreviewItem) => {
    if (item.type === 'remote' && item.remoteIndex !== undefined) {
      setRemoveFileIndices((prev) => [...prev, item.remoteIndex!])
    } else if (item.type === 'local' && item.localIndex !== undefined) {
      const idx = item.localIndex
      setLocalImages((prev) => prev.filter((_, i) => i !== idx))
      setLocalPreviews((prev) => {
        const removed = prev[idx]
        if (removed?.startsWith('blob:')) URL.revokeObjectURL(removed)
        return prev.filter((_, i) => i !== idx)
      })
    }
    resetFileInputs()
  }

  const onSubmit = async (form: WarrantyForm) => {
    const data: CreateWarrantyData = {
      productName: form.productName,
      storeName: form.storeName,
      purchaseDate: form.purchaseDate,
      warrantyDuration: form.warrantyDuration,
      notes: form.notes,
    }
    try {
      if (mode === 'create') {
        await createWarranty.mutateAsync({
          data,
          images: localImages.length ? localImages : undefined,
        })
        toast.success(t('warranties.modal.createSuccess'))
      } else if (mode === 'edit' && warranty) {
        await updateWarranty.mutateAsync({
          id: warranty.id,
          data,
          images: localImages.length ? localImages : undefined,
          removeFileIndices: removeFileIndices.length > 0 ? removeFileIndices : undefined,
        })
        toast.success(t('warranties.modal.updateSuccess'))
      }
      handleOpenChange(false)
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'An error occurred'
      toast.error(mode === 'create' ? t('warranties.modal.createError') : t('warranties.modal.updateError'), {
        description: msg,
      })
    }
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      reset()
      clearAll()
    }
    onOpenChange(next)
  }

  const requestDelete = () => {
    if (!warranty) return
    handleOpenChange(false)
    onRequestDelete?.(warranty)
  }

  /* ---- footer ---- */
  const submitLabel = pending
    ? mode === 'create'
      ? t('common.creating')
      : t('common.updating')
    : mode === 'create'
      ? t('common.create')
      : t('common.update')

  const footer = isMobile ? (
    <div className="flex flex-col gap-2">
      <Button type="submit" form={FORM_ID} disabled={pending} className="w-full">
        {submitLabel}
      </Button>
      <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={pending} className="w-full">
        {t('common.cancel')}
      </Button>
      {mode === 'edit' && (
        <Button type="button" variant="ghost" onClick={requestDelete} disabled={pending} className="w-full text-destructive hover:text-destructive">
          <Trash2 className="size-4" />
          {t('common.delete')}
        </Button>
      )}
    </div>
  ) : (
    <div className="flex items-center gap-2">
      {mode === 'edit' && (
        <Button type="button" variant="destructive" onClick={requestDelete} disabled={pending} className="mr-auto">
          <Trash2 className="size-4" />
          {t('common.delete')}
        </Button>
      )}
      <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={pending} className={cn(mode !== 'edit' && 'ml-auto')}>
        {t('common.cancel')}
      </Button>
      <Button type="submit" form={FORM_ID} disabled={pending}>
        {submitLabel}
      </Button>
    </div>
  )

  return (
    <GlassDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={mode === 'create' ? t('warranties.modal.createTitle') : t('warranties.modal.editTitle')}
      description={mode === 'create' ? t('warranties.modal.createDescription') : t('warranties.modal.editDescription')}
      desktopWidth={520}
      footer={footer}
    >
      <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field
          label={t('warranties.modal.productName')}
          icon={Package}
          error={errors.productName?.message}
          placeholder={t('warranties.modal.productNamePlaceholder')}
          {...register('productName')}
        />

        <Field
          label={t('warranties.modal.storeName')}
          icon={Store}
          placeholder={t('warranties.modal.storeNamePlaceholder')}
          {...register('storeName')}
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <label htmlFor="purchaseDate" className="mb-1.5 ml-0.5 block text-xs font-semibold text-muted-foreground">
              {t('warranties.modal.purchaseDate')}
            </label>
            <Controller
              name="purchaseDate"
              control={control}
              render={({ field }) => (
                <DatePicker id="purchaseDate" value={field.value} onChange={field.onChange} className="h-[50px] rounded-[14px]" />
              )}
            />
            {errors.purchaseDate?.message && (
              <p className="mt-1.5 ml-0.5 text-xs font-medium text-destructive">{errors.purchaseDate.message}</p>
            )}
          </div>

          <Field
            label={t('warranties.modal.duration')}
            type="number"
            min={1}
            placeholder="24"
            {...register('warrantyDuration')}
          />
        </div>

        {mode === 'edit' && warranty && (
          <div className="flex items-center gap-2 rounded-xl bg-bg-subtle px-3.5 py-3 text-[13px]">
            <Shield className="size-[15px] shrink-0 text-muted-foreground" />
            <span>{t('warranties.modal.expiryHint', { date: formatDate(warranty.warrantyExpires) })}</span>
            <StatusBadge w={warranty} small className="ml-auto" />
          </div>
        )}

        <div>
          <label htmlFor="notes" className="mb-1.5 ml-0.5 block text-xs font-semibold text-muted-foreground">
            {t('warranties.modal.notes')}
          </label>
          <textarea
            id="notes"
            rows={2}
            placeholder={t('warranties.modal.notesPlaceholder')}
            className="min-h-[76px] w-full rounded-[14px] border border-border bg-muted/60 px-3.5 py-3 text-[15px] font-medium text-foreground outline-none transition-[border-color,box-shadow] placeholder:font-normal placeholder:text-fg-faint focus:border-primary focus:ring-4 focus:ring-primary/15"
            {...register('notes')}
          />
        </div>

        {/* Files */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="ml-0.5 text-xs font-semibold text-muted-foreground">{t('warranties.modal.files')}</label>
            <span className="text-xs font-medium text-fg-faint tabular-nums">
              {totalFileCount}/{MAX_WARRANTY_FILES}
            </span>
          </div>

          <input
            id="warranty-files"
            type="file"
            accept="image/*,.heic,.heif,image/heic,image/heif,.pdf,application/pdf"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={!canAddMore}
          />

          {previewItems.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {previewItems.map((item, idx) => {
                const lower = item.src.toLowerCase()
                const isPdf = item.src === 'pdf-placeholder' || lower.endsWith('.pdf') || lower.includes('/raw/upload/')
                const isHeic = item.src === 'heic-placeholder'
                return (
                  <div key={`${item.type}-${item.remoteIndex ?? item.localIndex}-${idx}`} className="relative aspect-square overflow-hidden rounded-xl border border-border bg-bg-subtle">
                    {isHeic ? (
                      <div className="grid size-full place-items-center px-1 text-center text-[10px] text-muted-foreground">
                        {t('warranties.modal.heicPlaceholder')}
                      </div>
                    ) : isPdf ? (
                      <div className="grid size-full place-items-center gap-1 text-muted-foreground">
                        <FileText className="size-7" />
                      </div>
                    ) : (
                      <img
                        src={item.src.startsWith('blob:') ? item.src : `${item.src}${item.src.includes('?') ? '&' : '?'}f_auto,q_auto`}
                        alt=""
                        className="size-full object-cover"
                        loading="lazy"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removePreviewItem(item)}
                      aria-label={t('common.delete')}
                      className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-destructive text-white shadow-sm transition-transform hover:scale-105"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                )
              })}
              {canAddMore && (
                <label
                  htmlFor="warranty-files"
                  className="grid aspect-square cursor-pointer place-items-center gap-1 rounded-xl border-2 border-dashed border-border text-fg-faint transition-colors hover:border-primary/50 hover:text-primary"
                >
                  <Plus className="size-5" />
                  <span className="text-[11px] font-medium">{t('warranties.modal.addFile')}</span>
                </label>
              )}
            </div>
          ) : (
            <label
              htmlFor="warranty-files"
              className="flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border-2 border-dashed border-border bg-bg-subtle/50 px-6 py-7 text-center transition-colors hover:border-primary/50"
            >
              <UploadCloud className="size-6 text-muted-foreground" />
              <span className="text-[13px] font-semibold">{t('warranties.modal.addUpToFiles')}</span>
              <span className="text-[12px] text-fg-faint">{t('warranties.modal.filesHint')}</span>
            </label>
          )}

          <div className="mt-3 flex items-start gap-2 rounded-xl bg-muted/50 px-3 py-2.5 text-[12.5px] text-muted-foreground">
            <Info className="mt-px size-4 shrink-0" />
            <p>{t('warranties.modal.heicNotice')}</p>
          </div>
        </div>
      </form>
    </GlassDialog>
  )
}
