import { useEffect, useState, useRef, useCallback, type ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Camera, X, Info, Flashlight, FlashlightOff, Loader2, ImageIcon, CameraOff } from 'lucide-react'

interface QrScannerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScan: (url: string) => Promise<void>
  onGalleryFallback?: () => void
}

type ScannerResult = { rawValue: string }

type ScannerProps = {
  onScan: (result: ScannerResult[]) => void
  onError: (err: unknown) => void
  scanDelay?: number
  constraints?: unknown
  styles?: unknown
  components?: unknown
}

// Extended MediaTrackCapabilities with torch
interface TorchCapabilities extends MediaTrackCapabilities {
  torch?: boolean
}

// Extended MediaTrackConstraintSet with torch
interface TorchConstraints extends MediaTrackConstraintSet {
  torch?: boolean
}

const CAMERA_TIMEOUT_MS = 10_000

export function QrScanner({ open, onOpenChange, onScan, onGalleryFallback }: QrScannerProps) {
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)
  const [cameraTimedOut, setCameraTimedOut] = useState(false)
  const [torchEnabled, setTorchEnabled] = useState(false)
  const [torchSupported, setTorchSupported] = useState(false)
  const [ScannerComponent, setScannerComponent] = useState<null | ComponentType<ScannerProps>>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const lastScannedRef = useRef<string | null>(null)
  const scanningRef = useRef(false)
  const videoTrackRef = useRef<MediaStreamTrack | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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
      console.warn('No active video track for torch control')
      return
    }

    try {
      await track.applyConstraints({
        advanced: [{ torch: enable } as TorchConstraints],
      })
      setTorchEnabled(enable)
    } catch (err) {
      console.error('Failed to toggle torch:', err)
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
        if (capabilities.torch) {
          setTorchSupported(true)
        }
      } catch {
        setTorchSupported(false)
      }

      // Stop polling once we have the track
      if (intervalId) {
        clearInterval(intervalId)
      }
    }

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
  }, [open, ScannerComponent])

  // Load QR scanner component
  useEffect(() => {
    let cancelled = false

    if (!open) {
      setScannerComponent(null)
      lastScannedRef.current = null
      scanningRef.current = false
      setError(null)
      setCameraTimedOut(false)
      setTorchEnabled(false)
      setTorchSupported(false)
      setIsProcessing(false)
      setIsLoading(true)
      videoTrackRef.current = null
      return
    }

    // Reset refs when opening
    lastScannedRef.current = null
    scanningRef.current = false

    ;(async () => {
      try {
        const mod = await import('@yudiel/react-qr-scanner')
        if (cancelled) return
        setScannerComponent(() => mod.Scanner as ComponentType<ScannerProps>)
      } catch {
        if (cancelled) return
        setError(t('receipts.qrScanner.cameraError'))
        setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open, t])

  const handleScan = async (result: ScannerResult[]) => {
    if (result && result.length > 0) {
      const scannedText = result[0].rawValue

      // Prevent duplicate scans or scanning while processing
      if (!scannedText || scanningRef.current || lastScannedRef.current === scannedText || isProcessing) {
        return
      }

      // Mark as scanning to prevent concurrent scans
      scanningRef.current = true
      lastScannedRef.current = scannedText

      // Set processing state
      setIsProcessing(true)
      setError(null)

      try {
        await onScan(scannedText)
        // Only close modal on success
        onOpenChange(false)
      } catch (err) {
        // Show error in modal
        const errorMessage = err instanceof Error ? err.message : t('receipts.qrScanner.scanError')
        setError(errorMessage)
        // Reset scanning refs so user can try again
        scanningRef.current = false
        lastScannedRef.current = null
      } finally {
        setIsProcessing(false)
      }
    }
  }

  const handleError = (err: unknown) => {
    console.error('QR Scanner error:', err)
    if (err instanceof Error) {
      setError(err.message)
    } else {
      setError(t('receipts.qrScanner.cameraError'))
    }
    setIsLoading(false)
  }

  const handleClose = () => {
    if (isProcessing) return
    onOpenChange(false)
  }

  const handleTryAgain = () => {
    setError(null)
    setCameraTimedOut(false)
    scanningRef.current = false
    lastScannedRef.current = null
    setIsLoading(true)
    // Re-trigger scanner component load
    setScannerComponent(null)
    setTimeout(() => {
      import('@yudiel/react-qr-scanner').then(mod => {
        setScannerComponent(() => mod.Scanner as ComponentType<ScannerProps>)
      }).catch(() => {
        setError(t('receipts.qrScanner.cameraError'))
        setIsLoading(false)
      })
    }, 100)
  }

  const handleGalleryFallback = () => {
    onOpenChange(false)
    onGalleryFallback?.()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
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

        <div ref={containerRef} className="relative min-h-[350px] bg-muted rounded-lg overflow-hidden">
          {isProcessing ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted rounded-lg p-4 z-10">
              <Loader2 className="h-12 w-12 text-primary mb-4 animate-spin" />
              <p className="text-base font-medium text-center mb-2">{t('receipts.qrScanner.processing')}</p>
              <p className="text-sm text-center text-muted-foreground">{t('receipts.qrScanner.processingDescription')}</p>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted rounded-lg p-4 z-10">
              <X className="h-12 w-12 text-destructive mb-2" />
              <p className="text-sm text-center text-destructive mb-4">{error}</p>
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
          {open && ScannerComponent && !error && (
            <>
              <ScannerComponent
                onScan={handleScan}
                onError={handleError}
                scanDelay={100}
                constraints={{
                  facingMode: 'environment',
                  width: { min: 640, ideal: 1920, max: 3840 },
                  height: { min: 480, ideal: 1080, max: 2160 },
                  advanced: [
                    { zoom: 1.0 } as MediaTrackConstraintSet,
                    { focusMode: 'continuous' } as MediaTrackConstraintSet,
                  ],
                }}
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

              {/* Torch button */}
              {torchSupported && !isProcessing && !isLoading && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm hover:bg-background/90 z-10"
                  onClick={() => toggleTorch(!torchEnabled)}
                  title={t(torchEnabled ? 'receipts.qrScanner.torchOff' : 'receipts.qrScanner.torchOn')}
                >
                  {torchEnabled ? (
                    <FlashlightOff className="h-5 w-5" />
                  ) : (
                    <Flashlight className="h-5 w-5" />
                  )}
                </Button>
              )}
            </>
          )}
        </div>

        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <p>{t('receipts.qrScanner.privacyNotice')}</p>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            {t('common.cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
