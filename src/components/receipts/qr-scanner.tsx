import { useState } from 'react'
import { Scanner } from '@yudiel/react-qr-scanner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Camera, X } from 'lucide-react'

interface QrScannerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScan: (url: string) => void
}

export function QrScanner({ open, onOpenChange, onScan }: QrScannerProps) {
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
      setError('Failed to access camera')
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
            Scan QR Code
          </DialogTitle>
          <DialogDescription>
            Point your camera at the receipt QR code to scan it.
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
                Try Again
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

        <div className="flex justify-end">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
