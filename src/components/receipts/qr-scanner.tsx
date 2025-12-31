import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Scanner } from '@yudiel/react-qr-scanner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Camera, X, Info } from 'lucide-react'

interface QrScannerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScan: (url: string) => void
}

export function QrScanner({ open, onOpenChange, onScan }: QrScannerProps) {
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)

  const handleScan = (result: { rawValue: string }[]) => {
    if (result && result.length > 0) {
      const scannedText = result[0].rawValue
      if (scannedText) {
        onScan(scannedText)
        onOpenChange(false)
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
  }

  const handleClose = () => {
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {t('receipts.qrScanner.title')}
          </DialogTitle>
          <DialogDescription>
            {t('receipts.qrScanner.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="relative min-h-[350px] bg-muted rounded-lg overflow-hidden">
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
            <Scanner
              onScan={handleScan}
              onError={handleError}
              scanDelay={100}
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
