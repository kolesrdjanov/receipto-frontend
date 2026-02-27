import { lazy, Suspense, useState, useCallback, useRef, useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import * as Sentry from '@sentry/react'
import { useCreateReceipt, type CreateReceiptInput } from './use-receipts'
import type { PfrData } from '@/components/receipts/pfr-entry-modal'
import { ApiError, isApiError } from '@/lib/api'
import type { RetryMeta, ScanFlowState } from './scan-flow'

const QrScanner = lazy(() => import('@/components/receipts/qr-scanner').then(m => ({ default: m.QrScanner })))
const PfrEntryModal = lazy(() => import('@/components/receipts/pfr-entry-modal').then(m => ({ default: m.PfrEntryModal })))

interface UseReceiptScannerOptions {
  /** Navigate to receipts page after successful scan. Default: false */
  navigateOnSuccess?: boolean
}

interface OpenQrScannerOptions {
  groupId?: string
  paidById?: string
}

type WaitSignal = 'retry_now' | 'cancel'

interface RecoverableScanError extends Error {
  recoverable: true
  code: string
}

const RETRY_DELAYS_MS = [0, 5000, 10000, 15000, 20000, 30000, 40000]
const MAX_RETRY_ATTEMPTS = RETRY_DELAYS_MS.length
const ALLOWED_FISCAL_HOSTNAMES = new Set(['suf.purs.gov.rs'])

function createRecoverableScanError(message: string, code: string): RecoverableScanError {
  const error = new Error(message) as RecoverableScanError
  error.recoverable = true
  error.code = code
  return error
}

function isRecoverableScanError(error: unknown): error is RecoverableScanError {
  return error instanceof Error && 'recoverable' in error && (error as RecoverableScanError).recoverable === true
}

function normalizeFiscalQrUrl(rawValue: string): string | null {
  const trimmed = rawValue.trim()
  if (!trimmed) return null

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'https:') return null
    if (!ALLOWED_FISCAL_HOSTNAMES.has(parsed.hostname.toLowerCase())) return null
    return parsed.toString()
  } catch {
    return null
  }
}

function isTransientPortalError(error: unknown): boolean {
  if (isApiError(error)) {
    const status = error.status
    if (status === 404 || status === 429 || (status !== undefined && status >= 500)) {
      return true
    }

    // A missing status usually means network/connectivity issue
    if (status === undefined) {
      return true
    }

    const message = `${error.message} ${error.rawMessage || ''}`.toLowerCase()
    return (
      message.includes('temporarily unavailable') ||
      message.includes('timed out') ||
      message.includes('timeout') ||
      message.includes('unable to reach fiscal portal') ||
      message.includes('network') ||
      message.includes('failed to fetch') ||
      message.includes('load failed')
    )
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return (
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('failed to fetch') ||
      message.includes('load failed')
    )
  }

  return false
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
function renderFiltered(source: DetectSource, filter: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = source.width
  canvas.height = source.height
  const ctx = canvas.getContext('2d')!
  ctx.filter = filter
  ctx.drawImage(source, 0, 0)
  return canvas
}

function rotateSource(source: ImageBitmap, degrees: 0 | 90 | 180 | 270): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!

  if (degrees === 90 || degrees === 270) {
    canvas.width = source.height
    canvas.height = source.width
  } else {
    canvas.width = source.width
    canvas.height = source.height
  }

  ctx.save()
  if (degrees === 90) {
    ctx.translate(canvas.width, 0)
  } else if (degrees === 180) {
    ctx.translate(canvas.width, canvas.height)
  } else if (degrees === 270) {
    ctx.translate(0, canvas.height)
  }
  ctx.rotate((degrees * Math.PI) / 180)
  ctx.drawImage(source, 0, 0)
  ctx.restore()

  return canvas
}

/**
 * Adaptive binarization: converts to high-contrast black & white.
 * Uses local mean thresholding for better results on uneven lighting.
 */
function binarize(source: DetectSource, srcWidth: number, srcHeight: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = srcWidth
  canvas.height = srcHeight
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
    const rotationPasses: Array<0 | 90 | 180 | 270> = [0, 90, 180, 270]

    for (const rotation of rotationPasses) {
      const source = rotation === 0 ? bitmap : rotateSource(bitmap, rotation)

      // Pass 1: Original image (fast path for clean receipts)
      let result = await tryDetect(detector, source)
      if (result) return result

      // Pass 2: High contrast + grayscale (helps faded receipts)
      const sourceWidth = source.width
      const sourceHeight = source.height

      const contrastCanvas = renderFiltered(source, 'contrast(2) grayscale(1)')
      result = await tryDetect(detector, contrastCanvas)
      if (result) return result

      // Pass 3: Extreme contrast + brightness boost (very faded)
      const extremeCanvas = renderFiltered(source, 'contrast(3) brightness(1.3) grayscale(1)')
      result = await tryDetect(detector, extremeCanvas)
      if (result) return result

      // Pass 4: Adaptive binarization (handles uneven lighting, creases, shadows)
      const binarizedCanvas = binarize(source, sourceWidth, sourceHeight)
      result = await tryDetect(detector, binarizedCanvas)
      if (result) return result

      // Pass 5: Sharpen then binarize (damaged/blurry QR codes)
      // CSS filters don't support convolution, so we simulate sharpening
      // via unsharp mask: overlay a blurred negative at 50% to enhance edges
      const sharpCanvas = renderFiltered(source, 'contrast(1.8) brightness(1.1) saturate(0)')
      const sharpBinarized = document.createElement('canvas')
      sharpBinarized.width = sourceWidth
      sharpBinarized.height = sourceHeight
      const sCtx = sharpBinarized.getContext('2d')!
      sCtx.drawImage(sharpCanvas, 0, 0)
      // Apply a second contrast pass on the already-enhanced image
      sCtx.filter = 'contrast(3) brightness(1.2)'
      sCtx.drawImage(sharpBinarized, 0, 0)
      result = await tryDetect(detector, sharpBinarized)
      if (result) return result
    }

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
  const [scanFlowState, setScanFlowState] = useState<ScanFlowState>('idle')
  const [retryMeta, setRetryMeta] = useState<RetryMeta | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [qrContext, setQrContext] = useState<OpenQrScannerOptions | null>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const retryCancelledRef = useRef(false)
  const waitSignalResolverRef = useRef<((signal: WaitSignal) => void) | null>(null)

  const resolveWaitSignal = useCallback((signal: WaitSignal) => {
    const resolver = waitSignalResolverRef.current
    if (!resolver) return
    waitSignalResolverRef.current = null
    resolver(signal)
  }, [])

  const resetScanFlow = useCallback(() => {
    setScanFlowState('idle')
    setRetryMeta(null)
    setScanError(null)
    retryCancelledRef.current = false
    waitSignalResolverRef.current = null
  }, [])

  const waitForRetryDelay = useCallback((delayMs: number): Promise<'timeout' | WaitSignal> => {
    if (delayMs <= 0) {
      return Promise.resolve('timeout')
    }

    return new Promise((resolve) => {
      function cleanup(timeoutId: number, resolver: (signal: WaitSignal) => void) {
        clearTimeout(timeoutId)
        if (waitSignalResolverRef.current === resolver) {
          waitSignalResolverRef.current = null
        }
      }

      const timeoutId = window.setTimeout(() => {
        cleanup(timeoutId, resolver)
        resolve('timeout')
      }, delayMs)

      const resolver = (signal: WaitSignal) => {
        cleanup(timeoutId, resolver)
        resolve(signal)
      }

      waitSignalResolverRef.current = resolver
    })
  }, [])

  const cancelPortalRetry = useCallback(() => {
    retryCancelledRef.current = true
    resolveWaitSignal('cancel')
  }, [resolveWaitSignal])

  const retryPortalNow = useCallback(() => {
    resolveWaitSignal('retry_now')
  }, [resolveWaitSignal])

  const createReceiptWithRetry = useCallback(async (payload: CreateReceiptInput) => {
    const startedAt = Date.now()

    for (let index = 0; index < RETRY_DELAYS_MS.length; index++) {
      const attempt = index + 1
      const delayMs = RETRY_DELAYS_MS[index]

      if (retryCancelledRef.current) {
        throw createRecoverableScanError(t('receipts.qrScanner.retryCancelled'), 'RETRY_CANCELLED')
      }

      if (attempt > 1) {
        setScanFlowState('retrying_portal')
        setRetryMeta({
          attempt,
          maxAttempts: MAX_RETRY_ATTEMPTS,
          nextDelayMs: delayMs,
          startedAt,
        })

        const waitResult = await waitForRetryDelay(delayMs)
        if (waitResult === 'cancel') {
          throw createRecoverableScanError(t('receipts.qrScanner.retryCancelled'), 'RETRY_CANCELLED')
        }
      }

      setScanFlowState('submitting')
      setRetryMeta(null)

      try {
        const receipt = await createReceipt.mutateAsync(payload)
        setScanFlowState('success')
        setScanError(null)
        setRetryMeta(null)

        Sentry.captureMessage('qr_scan_success', {
          level: 'info',
          tags: {
            feature: 'qr_scan',
            attempts: String(attempt),
            path: payload.groupId ? 'group' : 'receipts',
          },
          extra: {
            receiptId: receipt.id,
          },
        })

        return receipt
      } catch (error) {
        const isTransient = isTransientPortalError(error)
        const hasMoreAttempts = attempt < MAX_RETRY_ATTEMPTS

        Sentry.captureMessage('qr_scan_attempt_failed', {
          level: isTransient ? 'info' : 'warning',
          tags: {
            feature: 'qr_scan',
            attempt: String(attempt),
            transient: String(isTransient),
            status: isApiError(error) && error.status !== undefined ? String(error.status) : 'none',
          },
          extra: {
            message: error instanceof Error ? error.message : String(error),
          },
        })

        if (!isTransient || !hasMoreAttempts) {
          throw error
        }
      }
    }

    throw new ApiError(t('receipts.qrScanner.scanError'))
  }, [createReceipt, t, waitForRetryDelay])

  const handleQrScan = useCallback(async (rawValue: string) => {
    setScanError(null)

    const normalizedUrl = normalizeFiscalQrUrl(rawValue)
    if (!normalizedUrl) {
      throw createRecoverableScanError(
        t('receipts.qrScanner.nonFiscalQrError'),
        'NON_FISCAL_QR',
      )
    }

    try {
      await createReceiptWithRetry({
        qrCodeUrl: normalizedUrl,
        groupId: qrContext?.groupId,
        paidById: qrContext?.paidById,
      })

      toast.success(t('receipts.qrScanner.scanSuccess'), {
        description: t('receipts.qrScanner.scanSuccessDescription'),
      })

      if (navigateOnSuccess) navigate('/receipts')
    } catch (error) {
      if (isRecoverableScanError(error)) {
        if (error.code !== 'RETRY_CANCELLED') {
          Sentry.captureMessage('qr_scan_recoverable_error', {
            level: 'info',
            tags: {
              feature: 'qr_scan',
              code: error.code,
            },
            extra: {
              message: error.message,
            },
          })
        }
        setScanFlowState('scanning')
        throw error
      }

      const errorMessage = error instanceof Error ? error.message : t('receipts.qrScanner.scanError')
      setScanFlowState('failed_terminal')
      setScanError(errorMessage)

      Sentry.captureException(error, {
        tags: {
          feature: 'qr_scan',
          stage: 'create_receipt',
        },
      })

      throw new Error(errorMessage)
    }
  }, [createReceiptWithRetry, navigate, navigateOnSuccess, qrContext?.groupId, qrContext?.paidById, t])

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
      const scannedQrValue = await decodeQrFromImage(file)
      const normalizedUrl = normalizeFiscalQrUrl(scannedQrValue)
      if (!normalizedUrl) {
        toast.error(t('receipts.qrScanner.nonFiscalQrError'))
        return
      }

      await createReceiptWithRetry({
        qrCodeUrl: normalizedUrl,
        groupId: qrContext?.groupId,
        paidById: qrContext?.paidById,
      })

      toast.success(t('receipts.qrScanner.scanSuccess'), {
        description: t('receipts.qrScanner.scanSuccessDescription'),
      })
      if (navigateOnSuccess) navigate('/receipts')
    } catch (error) {
      if (error instanceof Error && error.message === 'NO_QR_FOUND') {
        toast.error(t('receipts.gallery.noQrFound'))
      } else if (error instanceof Error && error.message === 'INVALID_IMAGE') {
        toast.error(t('receipts.gallery.invalidImage'))
      } else if (isRecoverableScanError(error)) {
        toast.error(error.message)
      } else {
        const errorMessage = error instanceof Error ? error.message : t('receipts.gallery.error')
        toast.error(t('receipts.gallery.error'), { description: errorMessage })
      }

      Sentry.captureException(error, {
        tags: {
          feature: 'qr_scan',
          stage: 'gallery_scan',
        },
      })
    } finally {
      setIsGalleryProcessing(false)
    }
  }, [createReceiptWithRetry, navigate, navigateOnSuccess, qrContext?.groupId, qrContext?.paidById, t])

  const openQrScannerWithContext = useCallback((context?: OpenQrScannerOptions) => {
    setQrContext({
      groupId: context?.groupId,
      paidById: context?.paidById,
    })
    setScanError(null)
    setRetryMeta(null)
    setScanFlowState('camera_loading')
    retryCancelledRef.current = false
    setIsScannerOpen(true)
  }, [])

  const openQrScanner = useCallback(() => {
    openQrScannerWithContext()
  }, [openQrScannerWithContext])

  const openPfrEntry = useCallback(() => setIsPfrEntryOpen(true), [])

  const openGalleryScanner = useCallback((context?: OpenQrScannerOptions) => {
    setQrContext({
      groupId: context?.groupId,
      paidById: context?.paidById,
    })
    galleryInputRef.current?.click()
  }, [])

  const handleScannerOpenChange = useCallback((open: boolean) => {
    setIsScannerOpen(open)

    if (!open) {
      cancelPortalRetry()
      resetScanFlow()
    }
  }, [cancelPortalRetry, resetScanFlow])

  const handleFlowStateChange = useCallback((nextState: ScanFlowState) => {
    setScanFlowState(nextState)
    if (nextState === 'camera_loading' || nextState === 'scanning') {
      setScanError(null)
    }
  }, [])

  useEffect(() => () => {
    retryCancelledRef.current = true
    resolveWaitSignal('cancel')
  }, [resolveWaitSignal])

  // Return as ReactNode, not as a component function, to avoid remounting
  // on every parent re-render (which would lose QrScanner's internal error state)
  const scannerModals: ReactNode = (
    <>
      <Suspense fallback={null}>
        {isScannerOpen && (
          <QrScanner
            open={isScannerOpen}
            onOpenChange={handleScannerOpenChange}
            onScan={handleQrScan}
            onGalleryFallback={() => galleryInputRef.current?.click()}
            flowState={scanFlowState}
            retryMeta={retryMeta}
            errorMessage={scanError}
            onRetryNow={retryPortalNow}
            onCancelRetry={cancelPortalRetry}
            onFlowStateChange={handleFlowStateChange}
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

  const isCreating = createReceipt.isPending || scanFlowState === 'submitting' || scanFlowState === 'retrying_portal'

  return {
    openQrScanner,
    openQrScannerWithContext,
    openPfrEntry,
    openGalleryScanner,
    scannerModals,
    isCreating,
    isGalleryProcessing,
    scanFlowState,
    retryMeta,
  }
}
