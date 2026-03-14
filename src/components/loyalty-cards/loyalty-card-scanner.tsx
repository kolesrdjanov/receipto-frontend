import { useEffect, useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Camera, Loader2, CameraOff, X } from 'lucide-react'

interface LoyaltyCardScannerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScan: (value: string, format: string) => void
}

const READER_ID = 'loyalty-card-reader'
const CAMERA_TIMEOUT_MS = 10_000

export function LoyaltyCardScanner({ open, onOpenChange, onScan }: LoyaltyCardScannerProps) {
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [cameraTimedOut, setCameraTimedOut] = useState(false)

  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null)
  const scanningRef = useRef(false)
  const timeoutRef = useRef<number | null>(null)

  const cleanup = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
      } catch { /* scanner may already be stopped */ }
      try {
        scannerRef.current.clear()
      } catch { /* ignore */ }
      scannerRef.current = null
    }
  }, [])

  const startScanner = useCallback(async () => {
    setError(null)
    setIsLoading(true)
    setCameraTimedOut(false)
    scanningRef.current = false

    timeoutRef.current = window.setTimeout(() => {
      setCameraTimedOut(true)
    }, CAMERA_TIMEOUT_MS)

    try {
      const { Html5Qrcode } = await import('html5-qrcode')

      const scanner = new Html5Qrcode(READER_ID, { verbose: false })
      scannerRef.current = scanner as unknown as { stop: () => Promise<void>; clear: () => void }

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 280, height: 280 },
          disableFlip: false,
        },
        (decodedText, decodedResult) => {
          if (scanningRef.current) return
          scanningRef.current = true

          const format = decodedResult?.result?.format?.formatName || 'CODE_128'
          // Normalize format to snake_case (html5-qrcode uses UPPER_CASE)
          const normalizedFormat = format.toLowerCase().replace(/-/g, '_')

          onScan(decodedText, normalizedFormat)
          onOpenChange(false)
        },
        () => {
          // Scan miss — ignore, this fires on every frame without a detection
        },
      )

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      setIsLoading(false)
      setCameraTimedOut(false)
    } catch (err) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      setIsLoading(false)
      setError(err instanceof Error ? err.message : t('loyaltyCards.cameraError'))
    }
  }, [onScan, onOpenChange, t])

  useEffect(() => {
    if (open) {
      // Small delay to let the DOM render the reader element
      const id = setTimeout(() => startScanner(), 100)
      return () => {
        clearTimeout(id)
        cleanup()
      }
    } else {
      cleanup()
      setError(null)
      setIsLoading(true)
      setCameraTimedOut(false)
      scanningRef.current = false
    }
  }, [open, startScanner, cleanup])

  const handleTryAgain = async () => {
    await cleanup()
    startScanner()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {t('loyaltyCards.scanCard')}
          </DialogTitle>
          <DialogDescription>
            {t('loyaltyCards.scanDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="relative min-h-[250px] sm:min-h-[350px] bg-muted rounded-lg overflow-hidden">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-10 bg-muted">
              <X className="h-12 w-12 text-destructive mb-2" />
              <p className="text-sm text-center text-destructive mb-4">{error}</p>
              <Button variant="outline" size="sm" onClick={handleTryAgain}>
                {t('loyaltyCards.tryAgain')}
              </Button>
            </div>
          ) : isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-10 bg-muted">
              {cameraTimedOut ? (
                <>
                  <CameraOff className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-center mb-1">{t('loyaltyCards.cameraSlowTitle')}</p>
                  <p className="text-xs text-center text-muted-foreground mb-4">{t('loyaltyCards.cameraSlowDescription')}</p>
                  <Button variant="outline" size="sm" onClick={handleTryAgain}>
                    {t('loyaltyCards.tryAgain')}
                  </Button>
                </>
              ) : (
                <>
                  <Loader2 className="h-8 w-8 text-muted-foreground mb-2 animate-spin" />
                  <p className="text-sm text-center text-muted-foreground">{t('common.loading')}</p>
                </>
              )}
            </div>
          ) : null}

          <div id={READER_ID} className="w-full" />
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
