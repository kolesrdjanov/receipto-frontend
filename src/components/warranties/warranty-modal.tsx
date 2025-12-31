import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
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
import { Textarea } from '@/components/ui/textarea'
import {
  useCreateWarranty,
  useUpdateWarranty,
  useDeleteWarranty,
  type Warranty,
  type CreateWarrantyData,
} from '@/hooks/warranties/use-warranties'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import heic2any from 'heic2any'

interface WarrantyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  warranty?: Warranty | null
  mode: 'create' | 'edit'
}

export function WarrantyModal({ open, onOpenChange, warranty, mode }: WarrantyModalProps) {
  const { t } = useTranslation()
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    reset,
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

  // Remote (already uploaded) images in edit mode.
  const remotePreviews = mode === 'edit'
    ? [warranty?.imageUrl, warranty?.imageUrl2].filter(Boolean)
    : []

  const previewsToShow = selectedImages.length > 0 ? imagePreviews : (remotePreviews as string[])
  const slotCount = previewsToShow.length

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

  const clearSelected = () => {
    setSelectedImages([])
    setImagePreviews((prev) => {
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

    // Always clear local selection when modal opens.
    clearSelected()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, warranty?.id])

  const convertIfHeic = async (file: File): Promise<File> => {
    const isHeic =
      file.type === 'image/heic' ||
      file.type === 'image/heif' ||
      file.name.toLowerCase().endsWith('.heic') ||
      file.name.toLowerCase().endsWith('.heif')

    if (!isHeic) return file

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
  }

  const addFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    try {
      const incoming = Array.from(files)
      const remainingSlots = Math.max(0, 2 - selectedImages.length)
      const toAdd = incoming.slice(0, remainingSlots)

      const processed = await Promise.all(toAdd.map(convertIfHeic))

      // Clear inputs so selecting the same file again triggers onChange
      resetFileInputs()

      // Single source of truth: update selectedImages once, then rebuild previews from that exact list.
      setSelectedImages((prev) => {
        const nextImages = [...prev, ...processed].slice(0, 2)

        setImagePreviews((prevPreviews) => {
          revokePreviews(prevPreviews)
          return nextImages.map((f) => URL.createObjectURL(f))
        })

        return nextImages
      })
    } catch {
      toast.error(t('warranties.modal.createError'), {
        description: 'Failed to process image. Please try a different file format.',
      })
    }
  }

  const handleLibrarySelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await addFiles(e.target.files)
  }

  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await addFiles(e.target.files)
  }

  const removeImageAt = (index: number) => {
    setSelectedImages((prevImages) => prevImages.filter((_, i) => i !== index))

    setImagePreviews((prevPreviews) => {
      const removed = prevPreviews[index]
      if (removed?.startsWith('blob:')) URL.revokeObjectURL(removed)
      return prevPreviews.filter((_, i) => i !== index)
    })

    resetFileInputs()
  }

  const onSubmit = async (data: CreateWarrantyData) => {
    try {
      if (mode === 'create') {
        await createWarranty.mutateAsync({
          data,
          images: selectedImages.length ? selectedImages : undefined,
        })
        toast.success(t('warranties.modal.createSuccess'))
      } else if (mode === 'edit' && warranty) {
        await updateWarranty.mutateAsync({
          id: warranty.id,
          data,
          images: selectedImages.length ? selectedImages : undefined,
        })
        toast.success(t('warranties.modal.updateSuccess'))
      }
      onOpenChange(false)
      reset()
      clearSelected()
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
    clearSelected()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-125 overflow-x-hidden max-h-[90dvh] overflow-y-auto">
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              <Input
                id="purchaseDate"
                type="date"
                {...register('purchaseDate', { required: true })}
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
              <p className="text-xs text-muted-foreground sm:ml-auto sm:self-center">
                {slotCount}/2
              </p>
            </div>

            <input
              id="warranty-images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleLibrarySelect}
              className="hidden"
            />

            <input
              id="warranty-camera"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraCapture}
              className="hidden"
            />

            {previewsToShow.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {previewsToShow.map((src, idx) => (
                  <div key={idx} className="relative overflow-hidden rounded-lg border">
                    <img
                      src={
                        src.startsWith('blob:')
                          ? src
                          : `${src}${src.includes('?') ? '&' : '?'}f_auto,q_auto`
                      }
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-48 object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => removeImageAt(idx)}
                      disabled={selectedImages.length === 0}
                      title={
                        selectedImages.length === 0
                          ? 'Removing already-uploaded images is not supported yet'
                          : undefined
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-8 text-center text-sm text-muted-foreground">
                Add up to 2 images (library or camera)
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 sticky bottom-0 bg-background pt-3 pb-2 border-t">
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
        </form>
      </DialogContent>
    </Dialog>
  )
}
