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
import { Camera, X, Info, Flashlight, FlashlightOff } from 'lucide-react'

interface QrScannerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScan: (url: string) => void
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

export function QrScanner({ open, onOpenChange, onScan }: QrScannerProps) {
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)
  const [torchEnabled, setTorchEnabled] = useState(false)
  const [torchSupported, setTorchSupported] = useState(false)
  const [ScannerComponent, setScannerComponent] = useState<null | ComponentType<ScannerProps>>(null)

  const qrTimeoutRef = useRef<number | null>(null)
  const lastScannedRef = useRef<string | null>(null)
  const scanningRef = useRef(false)
  const videoTrackRef = useRef<MediaStreamTrack | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Toggle torch using the MediaStream API
  const toggleTorch = useCallback(async (enable: boolean) => {
    const track = videoTrackRef.current
    if (!track) return

    try {
      await track.applyConstraints({
        advanced: [{ torch: enable } as TorchConstraints],
      })
      setTorchEnabled(enable)
    } catch (err) {
      console.error('Failed to toggle torch:', err)
    }
  }, [])

  // Check for torch support and get video track reference
  useEffect(() => {
    if (!open || !ScannerComponent) return

    // Wait a bit for the video element to be created
    const checkTorchSupport = setTimeout(() => {
      const container = containerRef.current
      if (!container) return

      const video = container.querySelector('video')
      if (!video || !video.srcObject) return

      const stream = video.srcObject as MediaStream
      const track = stream.getVideoTracks()[0]
      if (!track) return

      videoTrackRef.current = track

      // Check if torch is supported
      try {
        const capabilities = track.getCapabilities() as TorchCapabilities
        if (capabilities.torch) {
          setTorchSupported(true)
        }
      } catch {
        // getCapabilities not supported
        setTorchSupported(false)
      }
    }, 500)

    return () => {
      clearTimeout(checkTorchSupport)
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
      setTorchEnabled(false)
      setTorchSupported(false)
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
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open, t])


  const handleScan = (result: ScannerResult[]) => {
    if (result && result.length > 0) {
      const scannedText = result[0].rawValue

      // Prevent duplicate scans
      if (!scannedText || scanningRef.current || lastScannedRef.current === scannedText) {
        return
      }

      // Mark as scanning to prevent concurrent scans
      scanningRef.current = true
      lastScannedRef.current = scannedText

      // Clear all timers immediately
      if (qrTimeoutRef.current) {
        clearTimeout(qrTimeoutRef.current)
        qrTimeoutRef.current = null
      }

      onScan(scannedText)
      onOpenChange(false)
    }
  }

  const handleError = (err: unknown) => {
    console.error('QR Scanner error:', err)
    if (err instanceof Error) {
      setError(err.message)
    } else {
      setError(t('receipts.qrScanner.cameraError'))
    }
  }

  const handleClose = () => {
    setError(null)

    // Clear all refs
    if (qrTimeoutRef.current) {
      clearTimeout(qrTimeoutRef.current)
      qrTimeoutRef.current = null
    }
    lastScannedRef.current = null
    scanningRef.current = false

    onOpenChange(false)
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
            {error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted rounded-lg p-4">
                <X className="h-12 w-12 text-destructive mb-2" />
                <p className="text-sm text-center text-destructive">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setError(null)}
                  className="mt-4"
                >
                  {t('receipts.qrScanner.tryAgain')}
                </Button>
              </div>
            ) : open ? (
              ScannerComponent ? (
                <>
                  <ScannerComponent
                    onScan={handleScan}
                    onError={handleError}
                    scanDelay={1000}
                    constraints={{
                      facingMode: 'environment',
                      width: { min: 1280, ideal: 1920, max: 2560 },
                      height: { min: 720, ideal: 1080, max: 1440 },
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
                  {torchSupported && (
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm hover:bg-background/90"
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
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted rounded-lg p-4">
                  <p className="text-sm text-center text-muted-foreground">{t('common.loading')}</p>
                </div>
              )
            ) : null}
          </div>

        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <p>{t('receipts.qrScanner.privacyNotice')}</p>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
