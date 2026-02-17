import { lazy, Suspense, useState, useCallback, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useCreateReceipt } from './use-receipts'
import type { PfrData } from '@/components/receipts/pfr-entry-modal'

const QrScanner = lazy(() => import('@/components/receipts/qr-scanner').then(m => ({ default: m.QrScanner })))
const PfrEntryModal = lazy(() => import('@/components/receipts/pfr-entry-modal').then(m => ({ default: m.PfrEntryModal })))

interface UseReceiptScannerOptions {
  /** Navigate to receipts page after successful scan. Default: false */
  navigateOnSuccess?: boolean
}

async function prepareImageBlob(file: File): Promise<Blob> {
  const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')
  if (!isHeic) return file

  // Try native decode first (Safari/iOS support HEIC natively)
  try {
    await createImageBitmap(file)
    return file
  } catch {
    // Browser can't decode HEIC natively, convert with heic2any
  }

  const heic2any = (await import('heic2any')).default
  const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.8 }) as Blob
  return blob
}

/**
 * Renders source bitmap onto a canvas with the given CSS filter string.
 * Returns the canvas (BarcodeDetector.detect() accepts canvas elements).
 */
function renderFiltered(source: ImageBitmap, filter: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = source.width
  canvas.height = source.height
  const ctx = canvas.getContext('2d')!
  ctx.filter = filter
  ctx.drawImage(source, 0, 0)
  return canvas
}

/**
 * Adaptive binarization: converts to high-contrast black & white.
 * Uses local mean thresholding for better results on uneven lighting.
 */
function binarize(source: ImageBitmap): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = source.width
  canvas.height = source.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(source, 0, 0)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const { data, width, height } = imageData

  // Convert to grayscale luminance array
  const gray = new Uint8Array(width * height)
  for (let i = 0; i < gray.length; i++) {
    const r = data[i * 4]
    const g = data[i * 4 + 1]
    const b = data[i * 4 + 2]
    gray[i] = (r * 299 + g * 587 + b * 114) / 1000
  }

  // Compute integral image for fast local mean calculation
  const integral = new Float64Array(width * height)
  for (let y = 0; y < height; y++) {
    let rowSum = 0
    for (let x = 0; x < width; x++) {
      rowSum += gray[y * width + x]
      integral[y * width + x] = rowSum + (y > 0 ? integral[(y - 1) * width + x] : 0)
    }
  }

  // Adaptive threshold using local mean (Wellner's method)
  const blockSize = Math.max(15, Math.round(Math.min(width, height) / 40)) | 1
  const halfBlock = blockSize >> 1
  const C = 10 // bias — pixels must be this much darker than local mean to be "black"

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const x1 = Math.max(0, x - halfBlock - 1)
      const y1 = Math.max(0, y - halfBlock - 1)
      const x2 = Math.min(width - 1, x + halfBlock)
      const y2 = Math.min(height - 1, y + halfBlock)

      const area = (x2 - x1) * (y2 - y1)
      const sum = integral[y2 * width + x2]
        - (x1 > 0 ? integral[y2 * width + x1] : 0)
        - (y1 > 0 ? integral[y1 * width + x2] : 0)
        + (x1 > 0 && y1 > 0 ? integral[y1 * width + x1] : 0)

      const mean = sum / area
      const val = gray[y * width + x] < mean - C ? 0 : 255
      const idx = (y * width + x) * 4
      data[idx] = data[idx + 1] = data[idx + 2] = val
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas
}

type DetectSource = ImageBitmap | HTMLCanvasElement

async function tryDetect(
  detector: InstanceType<typeof import('barcode-detector/pure').BarcodeDetector>,
  source: DetectSource,
): Promise<string | null> {
  const results = await detector.detect(source)
  if (results.length > 0 && results[0].rawValue) {
    return results[0].rawValue
  }
  return null
}

async function decodeQrFromImage(file: File): Promise<string> {
  let blob: Blob
  try {
    blob = await prepareImageBlob(file)
  } catch {
    throw new Error('INVALID_IMAGE')
  }

  const { BarcodeDetector } = await import('barcode-detector/pure')
  const detector = new BarcodeDetector({ formats: ['qr_code'] })

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(blob)
  } catch {
    throw new Error('INVALID_IMAGE')
  }

  try {
    // Pass 1: Original image (fast path for clean receipts)
    let result = await tryDetect(detector, bitmap)
    if (result) return result

    // Pass 2: High contrast + grayscale (helps faded receipts)
    const contrastCanvas = renderFiltered(bitmap, 'contrast(2) grayscale(1)')
    result = await tryDetect(detector, contrastCanvas)
    if (result) return result

    // Pass 3: Extreme contrast + brightness boost (very faded)
    const extremeCanvas = renderFiltered(bitmap, 'contrast(3) brightness(1.3) grayscale(1)')
    result = await tryDetect(detector, extremeCanvas)
    if (result) return result

    // Pass 4: Adaptive binarization (handles uneven lighting, creases, shadows)
    const binarizedCanvas = binarize(bitmap)
    result = await tryDetect(detector, binarizedCanvas)
    if (result) return result

    // Pass 5: Sharpen then binarize (damaged/blurry QR codes)
    // CSS filters don't support convolution, so we simulate sharpening
    // via unsharp mask: overlay a blurred negative at 50% to enhance edges
    const sharpCanvas = renderFiltered(bitmap, 'contrast(1.8) brightness(1.1) saturate(0)')
    const sharpBinarized = document.createElement('canvas')
    sharpBinarized.width = bitmap.width
    sharpBinarized.height = bitmap.height
    const sCtx = sharpBinarized.getContext('2d')!
    sCtx.drawImage(sharpCanvas, 0, 0)
    // Apply a second contrast pass on the already-enhanced image
    sCtx.filter = 'contrast(3) brightness(1.2)'
    sCtx.drawImage(sharpBinarized, 0, 0)
    result = await tryDetect(detector, sharpBinarized)
    if (result) return result

    throw new Error('NO_QR_FOUND')
  } finally {
    bitmap.close()
  }
}

export function useReceiptScanner(options: UseReceiptScannerOptions = {}) {
  const { navigateOnSuccess = false } = options
  const { t } = useTranslation()
  const navigate = useNavigate()
  const createReceipt = useCreateReceipt()
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isPfrEntryOpen, setIsPfrEntryOpen] = useState(false)
  const [isGalleryProcessing, setIsGalleryProcessing] = useState(false)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const handleQrScan = useCallback(async (url: string) => {
    await createReceipt.mutateAsync({ qrCodeUrl: url })
    toast.success(t('receipts.qrScanner.scanSuccess'), {
      description: t('receipts.qrScanner.scanSuccessDescription'),
    })
    if (navigateOnSuccess) navigate('/receipts')
  }, [createReceipt, t, navigateOnSuccess, navigate])

  const handleOcrScan = useCallback(async (pfrData: PfrData) => {
    try {
      await createReceipt.mutateAsync({
        pfrData: {
          InvoiceNumberSe: pfrData.InvoiceNumberSe,
          InvoiceCounter: pfrData.InvoiceCounter,
          InvoiceCounterExtension: pfrData.InvoiceCounterExtension,
          TotalAmount: pfrData.TotalAmount,
          SdcDateTime: pfrData.SdcDateTime,
        },
      })
      toast.success(t('receipts.qrScanner.scanSuccess'), {
        description: t('receipts.qrScanner.scanSuccessDescription'),
      })
      setIsPfrEntryOpen(false)
      if (navigateOnSuccess) navigate('/receipts')
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred'
      toast.error(t('receipts.qrScanner.scanError'), {
        description: errorMessage,
      })
    }
  }, [createReceipt, t, navigateOnSuccess, navigate])

  const handleGalleryFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset input so the same file can be selected again
    if (galleryInputRef.current) galleryInputRef.current.value = ''

    setIsGalleryProcessing(true)
    try {
      const qrCodeUrl = await decodeQrFromImage(file)
      await createReceipt.mutateAsync({ qrCodeUrl })
      toast.success(t('receipts.qrScanner.scanSuccess'), {
        description: t('receipts.qrScanner.scanSuccessDescription'),
      })
      if (navigateOnSuccess) navigate('/receipts')
    } catch (error) {
      if (error instanceof Error && error.message === 'NO_QR_FOUND') {
        toast.error(t('receipts.gallery.noQrFound'))
      } else if (error instanceof Error && error.message === 'INVALID_IMAGE') {
        toast.error(t('receipts.gallery.invalidImage'))
      } else {
        const errorMessage = error instanceof Error ? error.message : t('receipts.gallery.error')
        toast.error(t('receipts.gallery.error'), { description: errorMessage })
      }
    } finally {
      setIsGalleryProcessing(false)
    }
  }, [createReceipt, t, navigateOnSuccess, navigate])

  const openQrScanner = useCallback(() => setIsScannerOpen(true), [])
  const openPfrEntry = useCallback(() => setIsPfrEntryOpen(true), [])
  const openGalleryScanner = useCallback(() => galleryInputRef.current?.click(), [])

  // Return as ReactNode, not as a component function, to avoid remounting
  // on every parent re-render (which would lose QrScanner's internal error state)
  const scannerModals: ReactNode = (
    <>
      <Suspense fallback={null}>
        {isScannerOpen && (
          <QrScanner
            open={isScannerOpen}
            onOpenChange={setIsScannerOpen}
            onScan={handleQrScan}
          />
        )}
      </Suspense>
      <Suspense fallback={null}>
        {isPfrEntryOpen && (
          <PfrEntryModal
            open={isPfrEntryOpen}
            onOpenChange={setIsPfrEntryOpen}
            onSubmit={handleOcrScan}
          />
        )}
      </Suspense>
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleGalleryFileChange}
        className="hidden"
      />
    </>
  )

  return {
    openQrScanner,
    openPfrEntry,
    openGalleryScanner,
    scannerModals,
    isCreating: createReceipt.isPending,
    isGalleryProcessing,
  }
}
