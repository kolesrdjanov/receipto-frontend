import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { Textarea } from '@/components/ui/textarea'
import {
  useCreateWarranty,
  useUpdateWarranty,
  useDeleteWarranty,
  type Warranty,
  type CreateWarrantyData,
} from '@/hooks/warranties/use-warranties'
import { toast } from 'sonner'
import { Info, X, FileText } from 'lucide-react'

interface WarrantyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  warranty?: Warranty | null
  mode: 'create' | 'edit'
}

// Helper type for preview items
type PreviewItem = {
  type: 'remote1' | 'remote2' | 'local'
  src: string
  localIndex?: number
}

export function WarrantyModal({ open, onOpenChange, warranty, mode }: WarrantyModalProps) {
  const { t } = useTranslation()

  // Track which original remote images should be removed
  const [removeImage1, setRemoveImage1] = useState(false)
  const [removeImage2, setRemoveImage2] = useState(false)

  // New local images to upload
  const [localImages, setLocalImages] = useState<File[]>([])
  const [localPreviews, setLocalPreviews] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { isSubmitting },
  } = useForm<CreateWarrantyData>({
    defaultValues: {
      productName: '',
      storeName: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      warrantyDuration: 24,
      notes: '',
    },
  })

  const createWarranty = useCreateWarranty()
  const updateWarranty = useUpdateWarranty()
  const deleteWarranty = useDeleteWarranty()

  // Build combined preview list: remaining remote images + new local images
  const buildPreviewItems = (): PreviewItem[] => {
    const items: PreviewItem[] = []

    // Add remote image 1 if exists and not removed
    if (mode === 'edit' && warranty?.fileUrl && !removeImage1) {
      items.push({ type: 'remote1', src: warranty.fileUrl })
    }

    // Add remote image 2 if exists and not removed
    if (mode === 'edit' && warranty?.fileUrl2 && !removeImage2) {
      items.push({ type: 'remote2', src: warranty.fileUrl2 })
    }

    // Add local images
    localPreviews.forEach((src, idx) => {
      items.push({ type: 'local', src, localIndex: idx })
    })

    return items
  }

  const previewItems = buildPreviewItems()
  const totalImageCount = previewItems.length
  const remainingSlots = Math.max(0, 2 - totalImageCount)
  const canAddMore = remainingSlots > 0

  const revokePreviews = (previews: string[]) => {
    previews.forEach((p) => {
      if (p.startsWith('blob:')) URL.revokeObjectURL(p)
    })
  }

  const resetFileInputs = () => {
    const lib = document.getElementById('warranty-images') as HTMLInputElement | null
    const cam = document.getElementById('warranty-camera') as HTMLInputElement | null
    if (lib) lib.value = ''
    if (cam) cam.value = ''
  }

  const clearAll = () => {
    setRemoveImage1(false)
    setRemoveImage2(false)
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
    }

    if (mode === 'create') {
      reset({
        productName: '',
        storeName: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        warrantyDuration: 24,
        notes: '',
      })
    }

    // Always clear state when modal opens
    clearAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, warranty?.id])

  const isHeicFile = (file: File): boolean => {
    return (
      file.type === 'image/heic' ||
      file.type === 'image/heif' ||
      file.name.toLowerCase().endsWith('.heic') ||
      file.name.toLowerCase().endsWith('.heif')
    )
  }

  const convertIfHeic = async (file: File): Promise<File> => {
    if (!isHeicFile(file)) return file

    try {
      const { default: heic2any } = await import('heic2any')

      const convertedBlob = (await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.85,
      })) as Blob

      return new File(
        [convertedBlob],
        file.name.replace(/\.(heic|heif)$/i, '.jpg'),
        { type: 'image/jpeg' }
      )
    } catch {
      // If conversion fails, return original file - Cloudinary will handle it
      return file
    }
  }

  const addFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    if (!canAddMore) return

    try {
      const incoming = Array.from(files)
      const toAdd = incoming.slice(0, remainingSlots)

      // Only convert HEIC files, leave PDFs as-is
      const processed = await Promise.all(
        toAdd.map(file => file.type === 'application/pdf' ? file : convertIfHeic(file))
      )

      // Clear inputs so selecting the same file again triggers onChange
      resetFileInputs()

      // Add to local files
      setLocalImages((prev) => [...prev, ...processed])
      setLocalPreviews((prev) => [
        ...prev,
        ...processed.map((f) => {
          if (f.type === 'application/pdf') {
            return 'pdf-placeholder'
          }
          if (isHeicFile(f)) {
            return 'heic-placeholder'
          }
          return URL.createObjectURL(f)
        }),
      ])
    } catch (error) {
      console.log(error)
      toast.error(t('warranties.modal.createError'), {
        description: 'Failed to process file. Please try a different format.',
      })
    }
  }

  const handleLibrarySelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await addFiles(e.target.files)
  }

  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await addFiles(e.target.files)
  }

  const removePreviewItem = (item: PreviewItem) => {
    if (item.type === 'remote1') {
      setRemoveImage1(true)
    } else if (item.type === 'remote2') {
      setRemoveImage2(true)
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

  const onSubmit = async (data: CreateWarrantyData) => {
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
          removeImage1: removeImage1 || undefined,
          removeImage2: removeImage2 || undefined,
        })
        toast.success(t('warranties.modal.updateSuccess'))
      }
      onOpenChange(false)
      reset()
      clearAll()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      toast.error(
        mode === 'create'
          ? t('warranties.modal.createError')
          : t('warranties.modal.updateError'),
        { description: errorMessage }
      )
    }
  }

  const handleDelete = async () => {
    if (!warranty) return

    if (window.confirm(t('warranties.modal.deleteConfirm'))) {
      try {
        await deleteWarranty.mutateAsync(warranty.id)
        toast.success(t('warranties.modal.deleteSuccess'))
        onOpenChange(false)
        reset()
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred'
        toast.error(t('warranties.modal.deleteError'), { description: errorMessage })
      }
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    reset()
    clearAll()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-125 overflow-x-hidden max-h-[90dvh] p-0">
        <div className="flex h-full flex-col">
          <div className="">
            <DialogHeader>
              <DialogTitle>
                {mode === 'create'
                  ? t('warranties.modal.createTitle')
                  : t('warranties.modal.editTitle')}
              </DialogTitle>
              <DialogDescription>
                {mode === 'create'
                  ? t('warranties.modal.createDescription')
                  : t('warranties.modal.editDescription')}
              </DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="productName">{t('warranties.modal.productName')}</Label>
                  <Input
                    id="productName"
                    {...register('productName', { required: true })}
                    placeholder={t('warranties.modal.productNamePlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storeName">{t('warranties.modal.storeName')}</Label>
                  <Input
                    id="storeName"
                    {...register('storeName')}
                    placeholder={t('warranties.modal.storeNamePlaceholder')}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="purchaseDate">{t('warranties.modal.purchaseDate')}</Label>
                    <Controller
                      name="purchaseDate"
                      control={control}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <DatePicker
                          id="purchaseDate"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="warrantyDuration">{t('warranties.modal.duration')}</Label>
                    <Input
                      id="warrantyDuration"
                      type="number"
                      min="1"
                      {...register('warrantyDuration', { valueAsNumber: true })}
                      placeholder="24"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('warranties.modal.durationHelp')}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">{t('warranties.modal.notes')}</Label>
                  <Textarea
                    id="notes"
                    {...register('notes')}
                    placeholder={t('warranties.modal.notesPlaceholder')}
                    rows={2}
                  />
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>{t('warranties.modal.image')}</Label>

                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    {canAddMore && (
                      <>
                        <Button type="button" variant="outline" asChild className="shrink-0">
                          <Label htmlFor="warranty-images" className="cursor-pointer">
                            {t('warranties.modal.uploadImage')}
                          </Label>
                        </Button>
                        <Button type="button" variant="outline" asChild className="shrink-0">
                          <Label htmlFor="warranty-camera" className="cursor-pointer">
                            {t('warranties.modal.captureImage')}
                          </Label>
                        </Button>
                      </>
                    )}
                    <p className="text-xs text-muted-foreground sm:ml-auto sm:self-center">
                      {totalImageCount}/2
                    </p>
                  </div>

                  <input
                    id="warranty-images"
                    type="file"
                    accept="image/*,.heic,.heif,image/heic,image/heif,.pdf,application/pdf"
                    multiple
                    onChange={handleLibrarySelect}
                    className="hidden"
                    disabled={!canAddMore}
                  />

                  <input
                    id="warranty-camera"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleCameraCapture}
                    className="hidden"
                    disabled={!canAddMore}
                  />

                  {previewItems.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {previewItems.map((item, idx) => {
                        const isPdf = item.src === 'pdf-placeholder' || item.src.toLowerCase().endsWith('.pdf')
                        return (
                          <div key={`${item.type}-${idx}`} className="relative overflow-hidden rounded-lg border">
                            {item.src === 'heic-placeholder' ? (
                              <div className="w-full h-48 bg-muted flex items-center justify-center">
                                <span className="text-sm text-muted-foreground">HEIC Image</span>
                              </div>
                            ) : isPdf ? (
                              <div className="w-full h-48 bg-muted flex flex-col items-center justify-center gap-2">
                                <FileText className="h-12 w-12 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">PDF Document</span>
                              </div>
                            ) : (
                              <img
                                src={
                                  item.src.startsWith('blob:')
                                    ? item.src
                                    : `${item.src}${item.src.includes('?') ? '&' : '?'}f_auto,q_auto`
                                }
                                alt={`Preview ${idx + 1}`}
                                className="w-full h-48 object-cover"
                              />
                            )}
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2"
                              onClick={() => removePreviewItem(item)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-8 text-center text-sm text-muted-foreground">
                      {t('warranties.modal.imageSlots')}
                    </div>
                  )}

                  <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground mt-4">
                    <Info className="h-4 w-4 mt-0.5 shrink-0" />
                    <p>{t('warranties.modal.heicNotice')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 bg-background mt-4">
              <DialogFooter className="gap-2 sm:gap-0">
                {mode === 'edit' && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleteWarranty.isPending || isSubmitting}
                    className="sm:mr-auto"
                  >
                    {deleteWarranty.isPending ? t('common.deleting') : t('common.delete')}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting || createWarranty.isPending || updateWarranty.isPending}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || createWarranty.isPending || updateWarranty.isPending}
                >
                  {isSubmitting || createWarranty.isPending || updateWarranty.isPending
                    ? mode === 'create'
                      ? t('common.creating')
                      : t('common.updating')
                    : mode === 'create'
                    ? t('common.create')
                    : t('common.update')}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
