import { useEffect, useState, useRef, useCallback, useMemo, type ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  Info,
  Flashlight,
  FlashlightOff,
  Loader2,
  ImageIcon,
  CameraOff,
  RefreshCw,
  RotateCcw,
  Smartphone,
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
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) handleClose()
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {t('receipts.qrScanner.scanTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('receipts.qrScanner.scanDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-muted-foreground" />
            <Select value={cameraSelection} onValueChange={handleCameraSelectionChange}>
              <SelectTrigger className="h-9">
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
          </div>

          {inlineNotice && (
            <p className="text-xs text-muted-foreground bg-muted/60 px-2 py-1.5 rounded-md">
              {inlineNotice}
            </p>
          )}
        </div>

        <div ref={containerRef} className="relative min-h-[350px] bg-muted rounded-lg overflow-hidden">
          {showBlockingState ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted rounded-lg p-4 z-10">
              <Loader2 className="h-12 w-12 text-primary mb-4 animate-spin" />
              {isRetrying ? (
                <>
                  <p className="text-base font-medium text-center mb-2">{t('receipts.qrScanner.retryingTitle')}</p>
                  <p className="text-sm text-center text-muted-foreground mb-3">
                    {retryMeta
                      ? t('receipts.qrScanner.retryingDescription', { attempt: retryMeta.attempt, max: retryMeta.maxAttempts })
                      : t('receipts.qrScanner.retryingGeneric')}
                  </p>
                  <p className="text-xs text-center text-muted-foreground mb-4">
                    {t('receipts.qrScanner.portalDelayHint')}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onRetryNow}
                      disabled={!onRetryNow}
                      className="gap-1.5"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      {t('receipts.qrScanner.retryNow')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onCancelRetry}
                      disabled={!onCancelRetry}
                      className="gap-1.5"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      {t('receipts.qrScanner.cancelRetry')}
                    </Button>
                    {onGalleryFallback && (
                      <Button
                        size="sm"
                        onClick={handleGalleryFallback}
                        className="gap-1.5"
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                        {t('receipts.qrScanner.useGallery')}
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-base font-medium text-center mb-2">{t('receipts.qrScanner.processing')}</p>
                  <p className="text-sm text-center text-muted-foreground">{t('receipts.qrScanner.processingDescription')}</p>
                  <p className="text-xs text-center text-muted-foreground mt-3">{t('receipts.qrScanner.portalDelayHint')}</p>
                </>
              )}
            </div>
          ) : activeError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted rounded-lg p-4 z-10">
              <X className="h-12 w-12 text-destructive mb-2" />
              <p className="text-sm text-center text-destructive mb-4">{activeError}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTryAgain}
                >
                  {t('receipts.qrScanner.tryAgain')}
                </Button>
                {onGalleryFallback && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGalleryFallback}
                    className="gap-1.5"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    {t('receipts.qrScanner.useGallery')}
                  </Button>
                )}
              </div>
            </div>
          ) : isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted rounded-lg p-6 z-10">
              {cameraTimedOut ? (
                <>
                  <CameraOff className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-center mb-1">{t('receipts.qrScanner.cameraSlowTitle')}</p>
                  <p className="text-xs text-center text-muted-foreground mb-4">{t('receipts.qrScanner.cameraSlowDescription')}</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTryAgain}
                    >
                      {t('receipts.qrScanner.tryAgain')}
                    </Button>
                    {onGalleryFallback && (
                      <Button
                        size="sm"
                        onClick={handleGalleryFallback}
                        className="gap-1.5"
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                        {t('receipts.qrScanner.useGallery')}
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Loader2 className="h-8 w-8 text-muted-foreground mb-2 animate-spin" />
                  <p className="text-sm text-center text-muted-foreground">{t('common.loading')}</p>
                </>
              )}
            </div>
          ) : null}

          {/* Scanner component */}
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
                  container: {
                    width: '100%',
                    height: '350px',
                  },
                  video: {
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  },
                }}
                components={{
                  finder: false,
                }}
              />

              {/* Torch controls (always visible area, explicit unsupported state) */}
              {!showBlockingState && !isLoading && (
                <div className="absolute bottom-3 right-3 z-10 flex flex-col items-end gap-1">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
                    onClick={() => toggleTorch(!torchEnabled)}
                    disabled={!torchSupported}
                    title={
                      torchSupported
                        ? t(torchEnabled ? 'receipts.qrScanner.torchOff' : 'receipts.qrScanner.torchOn')
                        : t('receipts.qrScanner.torchUnsupported')
                    }
                  >
                    {torchEnabled ? (
                      <FlashlightOff className="h-5 w-5" />
                    ) : (
                      <Flashlight className="h-5 w-5" />
                    )}
                  </Button>
                  {!torchSupported && (
                    <p className="max-w-[230px] rounded-md bg-background/80 px-2 py-1 text-[11px] text-right text-muted-foreground backdrop-blur-sm">
                      {t('receipts.qrScanner.torchUnsupportedHint')}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <p>{t('receipts.qrScanner.privacyNotice')}</p>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
