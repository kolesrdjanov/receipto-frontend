import { useEffect, useState, useRef, useCallback, useMemo, type ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import { GlassDialog } from '@/components/glass/glass-dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Camera,
  X,
  Flashlight,
  FlashlightOff,
  Loader2,
  ImageIcon,
  CameraOff,
  RefreshCw,
  RotateCcw,
  Smartphone,
  ShieldCheck,
} from 'lucide-react'
import * as Sentry from '@sentry/react'
import { useDevices } from '@yudiel/react-qr-scanner'
import type { RetryMeta, ScanFlowState } from '@/hooks/receipts/scan-flow'

interface QrScannerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScan: (url: string) => Promise<void>
  onGalleryFallback?: () => void
  flowState?: ScanFlowState
  retryMeta?: RetryMeta | null
  errorMessage?: string | null
  onCancelRetry?: () => void
  onRetryNow?: () => void
  onFlowStateChange?: (state: ScanFlowState) => void
}

type ScannerResult = { rawValue: string }

type ScannerProps = {
  onScan: (result: ScannerResult[]) => void
  onError: (err: unknown) => void
  scanDelay?: number
  constraints?: unknown
  styles?: unknown
  components?: unknown
  formats?: string[]
}

// Extended MediaTrackCapabilities with torch
interface TorchCapabilities extends MediaTrackCapabilities {
  torch?: boolean
}

// Extended MediaTrackConstraintSet with torch
interface TorchConstraints extends MediaTrackConstraintSet {
  torch?: boolean
}

interface RecoverableScanError extends Error {
  recoverable: true
}

const CAMERA_TIMEOUT_MS = 10_000
const CAMERA_SELECTION_KEY = 'receipto-camera-selection'

// Glass camera-overlay buttons (white-on-black viewport)
const CAMBTN = 'inline-flex h-8 items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 text-[12px] font-semibold text-white transition-colors hover:bg-white/20 disabled:opacity-40 disabled:pointer-events-none'
const CAMBTN_SOLID = 'inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[12px] font-semibold text-[#111] transition-colors hover:bg-white/90'

type CameraSelection = 'auto' | 'rear' | 'front' | `device:${string}`

function getSavedCameraSelection(): CameraSelection {
  try {
    const saved = localStorage.getItem(CAMERA_SELECTION_KEY)
    if (saved === 'auto' || saved === 'rear' || saved === 'front' || saved?.startsWith('device:')) {
      return saved as CameraSelection
    }
  } catch {
    // localStorage unavailable
  }
  return 'auto'
}

function isRecoverableScanError(error: unknown): error is RecoverableScanError {
  return error instanceof Error && 'recoverable' in error && (error as RecoverableScanError).recoverable === true
}

export function QrScanner({
  open,
  onOpenChange,
  onScan,
  onGalleryFallback,
  flowState = 'idle',
  retryMeta,
  errorMessage,
  onCancelRetry,
  onRetryNow,
  onFlowStateChange,
}: QrScannerProps) {
  const { t } = useTranslation()
  const devices = useDevices()
  const [localError, setLocalError] = useState<string | null>(null)
  const [inlineNotice, setInlineNotice] = useState<string | null>(null)
  const [cameraTimedOut, setCameraTimedOut] = useState(false)
  const [torchEnabled, setTorchEnabled] = useState(false)
  const [torchSupported, setTorchSupported] = useState(false)
  const [ScannerComponent, setScannerComponent] = useState<null | ComponentType<ScannerProps>>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [scannerKey, setScannerKey] = useState(0)
  const [cameraSelection, setCameraSelection] = useState<CameraSelection>(getSavedCameraSelection)
  const [useSimpleConstraints, setUseSimpleConstraints] = useState(false)

  const lastScannedRef = useRef<string | null>(null)
  const scanningRef = useRef(false)
  const videoTrackRef = useRef<MediaStreamTrack | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const torchTelemetrySentRef = useRef(false)
  const noticeTimeoutRef = useRef<number | null>(null)

  const activeError = errorMessage || localError
  const isSubmitting = flowState === 'submitting'
  const isRetrying = flowState === 'retrying_portal'
  const showBlockingState = isSubmitting || isRetrying

  const cameraConstraints = useMemo(() => {
    const constraints: MediaTrackConstraints = {}

    if (cameraSelection.startsWith('device:')) {
      const deviceId = cameraSelection.replace('device:', '')
      constraints.deviceId = { exact: deviceId }
    } else if (cameraSelection === 'front') {
      constraints.facingMode = 'user'
    } else {
      constraints.facingMode = 'environment'
    }

    if (!useSimpleConstraints) {
      constraints.width = { ideal: 1280 }
      constraints.height = { ideal: 720 }
      constraints.aspectRatio = { ideal: 1.7777777778 }
    }

    return constraints
  }, [cameraSelection, useSimpleConstraints])

  const setNotice = useCallback((message: string) => {
    setInlineNotice(message)
    if (noticeTimeoutRef.current) {
      clearTimeout(noticeTimeoutRef.current)
    }
    noticeTimeoutRef.current = window.setTimeout(() => {
      setInlineNotice(null)
    }, 2600)
  }, [])

  // Toggle torch using the MediaStream API
  const toggleTorch = useCallback(async (enable: boolean) => {
    let track = videoTrackRef.current

    // If no track, try to get it again from the video element
    if (!track || track.readyState !== 'live') {
      const container = containerRef.current
      const video = container?.querySelector('video')
      if (video?.srcObject) {
        const stream = video.srcObject as MediaStream
        const tracks = stream.getVideoTracks()
        if (tracks.length > 0) {
          track = tracks[0]
          videoTrackRef.current = track
        }
      }
    }

    if (!track || track.readyState !== 'live') {
      return
    }

    try {
      await track.applyConstraints({
        advanced: [{ torch: enable } as TorchConstraints],
      })
      setTorchEnabled(enable)
    } catch (err) {
      Sentry.captureException(err, {
        tags: {
          feature: 'qr_scan',
          stage: 'torch_toggle',
        },
      })
      try {
        const capabilities = track.getCapabilities() as TorchCapabilities
        if (!capabilities.torch) {
          setTorchSupported(false)
        }
      } catch {
        setTorchSupported(false)
      }
    }
  }, [])

  const resetCameraRuntime = useCallback(() => {
    setCameraTimedOut(false)
    setTorchEnabled(false)
    setTorchSupported(false)
    setInlineNotice(null)
    setIsLoading(true)
    setLocalError(null)
    videoTrackRef.current = null
    if (noticeTimeoutRef.current) {
      clearTimeout(noticeTimeoutRef.current)
      noticeTimeoutRef.current = null
    }
  }, [])

  // Check for torch support and get video track reference
  useEffect(() => {
    if (!open || !ScannerComponent) return

    let intervalId: number | null = null
    let timeoutId: number | null = null

    const checkForVideoTrack = () => {
      const container = containerRef.current
      if (!container) return

      const video = container.querySelector('video')
      if (!video || !video.srcObject) return

      const stream = video.srcObject as MediaStream
      const tracks = stream.getVideoTracks()
      if (!tracks || tracks.length === 0) return

      const track = tracks[0]
      videoTrackRef.current = track

      // Camera is now ready - hide loading and cancel timeout
      setIsLoading(false)
      setCameraTimedOut(false)
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }

      // Check if torch is supported
      try {
        const capabilities = track.getCapabilities() as TorchCapabilities
        const hasTorch = Boolean(capabilities.torch)
        setTorchSupported(hasTorch)

        if (!torchTelemetrySentRef.current) {
          torchTelemetrySentRef.current = true
          Sentry.captureMessage('qr_scan_torch_capability', {
            level: 'info',
            tags: {
              feature: 'qr_scan',
              torch_supported: String(hasTorch),
            },
          })
        }
      } catch {
        setTorchSupported(false)
      }

      onFlowStateChange?.('scanning')

      // Stop polling once we have the track
      if (intervalId) {
        clearInterval(intervalId)
      }
    }

    onFlowStateChange?.('camera_loading')

    // Poll until video track is available (no attempt limit — user may take
    // a while to approve the camera permission prompt)
    intervalId = window.setInterval(checkForVideoTrack, 300)

    // Timeout: if camera hasn't started after 10s, show fallback options
    // (keeps polling in case permission is granted late)
    timeoutId = window.setTimeout(() => {
      setCameraTimedOut(true)
    }, CAMERA_TIMEOUT_MS)

    return () => {
      if (intervalId) clearInterval(intervalId)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [open, ScannerComponent, onFlowStateChange, scannerKey])

  // Load QR scanner component
  useEffect(() => {
    let cancelled = false

    if (!open) {
      setScannerComponent(null)
      lastScannedRef.current = null
      scanningRef.current = false
      resetCameraRuntime()
      setUseSimpleConstraints(false)
      torchTelemetrySentRef.current = false
      return
    }

    // Reset refs when opening
    lastScannedRef.current = null
    scanningRef.current = false
    resetCameraRuntime()

    ;(async () => {
      try {
        const mod = await import('@yudiel/react-qr-scanner')
        if (cancelled) return
        setScannerComponent(() => mod.Scanner as ComponentType<ScannerProps>)
      } catch {
        if (cancelled) return
        setLocalError(t('receipts.qrScanner.cameraError'))
        setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open, t, resetCameraRuntime])

  const handleScan = async (result: ScannerResult[]) => {
    if (result && result.length > 0) {
      const scannedText = result[0].rawValue

      // Prevent duplicate scans or scanning while processing
      if (!scannedText || scanningRef.current || lastScannedRef.current === scannedText || showBlockingState) {
        return
      }

      // Mark as scanning to prevent concurrent scans
      scanningRef.current = true
      lastScannedRef.current = scannedText

      setLocalError(null)
      setInlineNotice(null)

      try {
        onFlowStateChange?.('submitting')
        await onScan(scannedText)
        // Only close modal on success
        onOpenChange(false)
      } catch (err) {
        if (isRecoverableScanError(err)) {
          setNotice(err.message)
          scanningRef.current = false
          lastScannedRef.current = null
          onFlowStateChange?.('scanning')
          return
        }

        const errorMessage = err instanceof Error ? err.message : t('receipts.qrScanner.scanError')
        setLocalError(errorMessage)
        onFlowStateChange?.('failed_terminal')
        // Reset scanning refs so user can try again
        scanningRef.current = false
        lastScannedRef.current = null
      }
    }
  }

  const handleError = (err: unknown) => {
    const message = err instanceof Error ? err.message.toLowerCase() : ''

    if (!useSimpleConstraints && (message.includes('constraint') || message.includes('overconstrained'))) {
      setUseSimpleConstraints(true)
      setNotice(t('receipts.qrScanner.cameraFallbackApplied'))
      setScannerKey((prev) => prev + 1)
      onFlowStateChange?.('camera_loading')
      return
    }

    Sentry.captureException(err, {
      tags: {
        feature: 'qr_scan',
        stage: 'camera_start',
      },
    })

    if (err instanceof Error) {
      setLocalError(err.message)
    } else {
      setLocalError(t('receipts.qrScanner.cameraError'))
    }
    onFlowStateChange?.('failed_terminal')
    setIsLoading(false)
  }

  const handleClose = () => {
    if (isSubmitting) return
    onOpenChange(false)
  }

  const handleTryAgain = () => {
    setLocalError(null)
    resetCameraRuntime()
    onFlowStateChange?.('camera_loading')
    scanningRef.current = false
    lastScannedRef.current = null
    setScannerKey((prev) => prev + 1)

    // Re-trigger scanner component load
    setScannerComponent(null)
    setTimeout(() => {
      import('@yudiel/react-qr-scanner').then(mod => {
        setScannerComponent(() => mod.Scanner as ComponentType<ScannerProps>)
      }).catch(() => {
        setLocalError(t('receipts.qrScanner.cameraError'))
        setIsLoading(false)
      })
    }, 100)
  }

  const handleGalleryFallback = () => {
    onOpenChange(false)
    onGalleryFallback?.()
  }

  const handleCameraSelectionChange = (value: string) => {
    const selection = value as CameraSelection
    setCameraSelection(selection)
    try { localStorage.setItem(CAMERA_SELECTION_KEY, selection) } catch { /* noop */ }
    setUseSimpleConstraints(false)
    setScannerKey((prev) => prev + 1)
    setTorchEnabled(false)
    setTorchSupported(false)
    onFlowStateChange?.('camera_loading')
  }

  return (
    <GlassDialog
      open={open}
      onOpenChange={(next) => { if (!next) handleClose() }}
      title={t('receipts.qrScanner.scanTitle')}
      desktopWidth={460}
      dismissibleOnOverlay={!isSubmitting}
      header={
        <div>
          <div className="flex items-center gap-2">
            <Camera className="size-5 text-primary" />
            <h2 className="t-h3">{t('receipts.qrScanner.scanTitle')}</h2>
          </div>
          <p className="t-sm mt-1 text-muted-foreground">{t('receipts.qrScanner.description')}</p>
        </div>
      }
      actions={{
        secondary: (
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-xl"
          >
            {t('common.cancel')}
          </Button>
        ),
      }}
    >
      {/* Camera selection */}
      <Select value={cameraSelection} onValueChange={handleCameraSelectionChange}>
        <SelectTrigger className="mb-3 h-10 gap-2 rounded-lg border-border bg-bg-subtle px-3 text-[13px] font-semibold text-fg-2">
          <Smartphone className="size-[15px] shrink-0 text-muted-foreground" />
          <SelectValue placeholder={t('receipts.qrScanner.cameraAuto')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="auto">{t('receipts.qrScanner.cameraAuto')}</SelectItem>
          <SelectItem value="rear">{t('receipts.qrScanner.cameraRear')}</SelectItem>
          <SelectItem value="front">{t('receipts.qrScanner.cameraFront')}</SelectItem>
          {devices.map((device) => (
            <SelectItem key={device.deviceId} value={`device:${device.deviceId}`}>
              {device.label || t('receipts.qrScanner.cameraDeviceFallback')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Recoverable inline notice (non-fiscal QR / camera fallback) */}
      {inlineNotice && (
        <p className="mb-3 rounded-lg bg-bg-subtle px-3 py-2 text-xs text-muted-foreground">
          {inlineNotice}
        </p>
      )}

      {/* Camera viewport */}
      <div
        ref={containerRef}
        className="relative grid h-[240px] w-full place-items-center overflow-hidden rounded-2xl bg-[#0b0b0c]"
      >
        {showBlockingState ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2.5 p-5 text-center">
            <Loader2 className="size-9 animate-spin text-white" />
            {isRetrying ? (
              <>
                <p className="text-[15px] font-semibold text-white">{t('receipts.qrScanner.retryingTitle')}</p>
                <p className="max-w-[260px] text-[12.5px] text-white/70">
                  {retryMeta
                    ? t('receipts.qrScanner.retryingDescription', { attempt: retryMeta.attempt, max: retryMeta.maxAttempts })
                    : t('receipts.qrScanner.retryingGeneric')}
                </p>
                <p className="max-w-[260px] text-[11px] text-white/55">{t('receipts.qrScanner.portalDelayHint')}</p>
                <div className="mt-1.5 flex flex-wrap justify-center gap-2">
                  <button type="button" onClick={onRetryNow} disabled={!onRetryNow} className={CAMBTN}>
                    <RefreshCw className="size-3.5" />
                    {t('receipts.qrScanner.retryNow')}
                  </button>
                  <button type="button" onClick={onCancelRetry} disabled={!onCancelRetry} className={CAMBTN}>
                    <RotateCcw className="size-3.5" />
                    {t('receipts.qrScanner.cancelRetry')}
                  </button>
                  {onGalleryFallback && (
                    <button type="button" onClick={handleGalleryFallback} className={CAMBTN_SOLID}>
                      <ImageIcon className="size-3.5" />
                      {t('receipts.qrScanner.useGallery')}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="text-[15px] font-semibold text-white">{t('receipts.qrScanner.processing')}</p>
                <p className="max-w-[260px] text-[12.5px] text-white/70">{t('receipts.qrScanner.processingDescription')}</p>
                <p className="max-w-[260px] text-[11px] text-white/55">{t('receipts.qrScanner.portalDelayHint')}</p>
              </>
            )}
          </div>
        ) : activeError ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 p-5 text-center">
            <div className="grid size-[54px] place-items-center rounded-full bg-destructive">
              <X className="size-6 text-white" />
            </div>
            <p className="max-w-[260px] text-[13.5px] text-white">{activeError}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" onClick={handleTryAgain} className={CAMBTN}>
                {t('receipts.qrScanner.tryAgain')}
              </button>
              {onGalleryFallback && (
                <button type="button" onClick={handleGalleryFallback} className={CAMBTN_SOLID}>
                  <ImageIcon className="size-3.5" />
                  {t('receipts.qrScanner.useGallery')}
                </button>
              )}
            </div>
          </div>
        ) : isLoading ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2.5 p-5 text-center">
            {cameraTimedOut ? (
              <>
                <CameraOff className="size-9 text-white/80" />
                <p className="text-[14px] font-semibold text-white">{t('receipts.qrScanner.cameraSlowTitle')}</p>
                <p className="max-w-[260px] text-[12px] text-white/65">{t('receipts.qrScanner.cameraSlowDescription')}</p>
                <div className="mt-1 flex flex-wrap justify-center gap-2">
                  <button type="button" onClick={handleTryAgain} className={CAMBTN}>
                    {t('receipts.qrScanner.tryAgain')}
                  </button>
                  {onGalleryFallback && (
                    <button type="button" onClick={handleGalleryFallback} className={CAMBTN_SOLID}>
                      <ImageIcon className="size-3.5" />
                      {t('receipts.qrScanner.useGallery')}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <Loader2 className="size-8 animate-spin text-white/80" />
                <p className="text-[12.5px] text-white/70">{t('common.loading')}</p>
              </>
            )}
          </div>
        ) : null}

        {/* Live scanner + finder reticle + hint + torch */}
        {open && ScannerComponent && !activeError && (
          <>
            <ScannerComponent
              key={scannerKey}
              onScan={handleScan}
              onError={handleError}
              scanDelay={250}
              formats={['qr_code']}
              constraints={cameraConstraints}
              styles={{
                container: { width: '100%', height: '240px' },
                video: { width: '100%', height: '100%', objectFit: 'cover' },
              }}
              components={{ finder: false }}
            />

            {!showBlockingState && !isLoading && (
              <>
                <div className="pointer-events-none absolute inset-0 z-[5] grid place-items-center">
                  <div className="size-[148px] rounded-[18px] border-[3px] border-white/85" />
                </div>
                <p className="pointer-events-none absolute inset-x-0 bottom-4 z-[5] text-center text-[12.5px] text-white/80">
                  {t('receipts.qrScanner.scanHint')}
                </p>
                <button
                  type="button"
                  onClick={() => toggleTorch(!torchEnabled)}
                  disabled={!torchSupported}
                  title={
                    torchSupported
                      ? t(torchEnabled ? 'receipts.qrScanner.torchOff' : 'receipts.qrScanner.torchOn')
                      : t('receipts.qrScanner.torchUnsupported')
                  }
                  className="absolute bottom-3 right-3 z-10 grid size-[38px] place-items-center rounded-[10px] bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25 disabled:opacity-40 disabled:pointer-events-none"
                >
                  {torchEnabled ? <FlashlightOff className="size-[18px]" /> : <Flashlight className="size-[18px]" />}
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Torch-unsupported hint (below the viewport; preserves the explicit-unsupported UX) */}
      {open && ScannerComponent && !activeError && !showBlockingState && !isLoading && !torchSupported && (
        <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
          {t('receipts.qrScanner.torchUnsupportedHint')}
        </p>
      )}

      {/* Privacy notice */}
      <div className="mt-3 flex items-start gap-2 rounded-xl bg-bg-subtle px-3.5 py-3">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-[12.5px] leading-[1.45] text-muted-foreground">{t('receipts.qrScanner.privacyNotice')}</p>
      </div>
    </GlassDialog>
  )
}
