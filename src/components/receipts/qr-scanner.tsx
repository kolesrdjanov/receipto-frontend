import { useEffect, useState, useRef, type ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Camera, X, Info, ScanText } from 'lucide-react'
import Tesseract from 'tesseract.js'

interface QrScannerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScan: (url: string) => void
  onOcrScan?: (data: PfrData) => void
}

export interface PfrData {
  storeName?: string
  totalAmount?: string
  receiptDate?: string
  receiptNumber?: string
  invoiceNumberSe?: string
  invoiceCounter?: string
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

export function QrScanner({ open, onOpenChange, onScan, onOcrScan }: QrScannerProps) {
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)
  const [ScannerComponent, setScannerComponent] = useState<null | ComponentType<ScannerProps>>(null)
  const [scanMode, setScanMode] = useState<'qr' | 'ocr'>('qr')
  const [isProcessing, setIsProcessing] = useState(false)
  const ocrIntervalRef = useRef<number | null>(null)
  const qrTimeoutRef = useRef<number | null>(null)
  const lastScannedRef = useRef<string | null>(null)
  const scanningRef = useRef(false)

  // Parse PFR data from OCR text
  const parsePfrData = (text: string): PfrData | null => {
    const lines = text.split('\n').map(line => line.trim())
    const data: PfrData = {}

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Look for InvoiceNumberSe (format: XXXXX-XXXXX-XXXXX)
      if (line.includes('InvoiceNumberSe') || /[A-Z0-9]+-[A-Z0-9]+-\d+/.test(line)) {
        const match = line.match(/([A-Z0-9]+-[A-Z0-9]+-\d+)/)
        if (match) data.invoiceNumberSe = match[1]
      }

      // Look for InvoiceCounter (format: XXXXX/XXXXX)
      if (line.includes('InvoiceCounter') && !line.includes('Extension')) {
        const nextLine = lines[i + 1]
        const match = nextLine?.match(/(\d+\/\d+)/)
        if (match) data.invoiceCounter = match[1]
      }

      // Look for TotalAmount (format: X,XXX.XX or X.XXX,XX)
      if (line.includes('TotalAmount')) {
        const nextLine = lines[i + 1]
        const match = nextLine?.match(/([\d.,]+)/)
        if (match) {
          // Normalize the amount (replace comma with dot for Serbian format)
          data.totalAmount = match[1].replace(',', '.')
        }
      }

      // Look for SdcDateTime (format: DD.MM.YYYY. HH:MM)
      if (line.includes('SdcDateTime')) {
        const nextLine = lines[i + 1]
        const match = nextLine?.match(/(\d{1,2}\.\d{1,2}\.\d{4}\.?\s+\d{1,2}:\d{2})/)
        if (match) {
          // Parse date format: DD.MM.YYYY. HH:MM -> YYYY-MM-DD
          const dateParts = match[1].match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/)
          if (dateParts) {
            const day = dateParts[1].padStart(2, '0')
            const month = dateParts[2].padStart(2, '0')
            const year = dateParts[3]
            data.receiptDate = `${year}-${month}-${day}`
          }
        }
      }
    }

    // Use InvoiceCounter as receiptNumber if available
    if (data.invoiceCounter) {
      data.receiptNumber = data.invoiceCounter
    } else if (data.invoiceNumberSe) {
      data.receiptNumber = data.invoiceNumberSe
    }

    // Check if we have at least some required data
    if (data.totalAmount || data.receiptNumber) {
      return data
    }

    return null
  }

  // Start QR timeout to switch to OCR mode after 5 seconds
  useEffect(() => {
    if (open && scanMode === 'qr' && onOcrScan) {
      qrTimeoutRef.current = setTimeout(() => {
        setScanMode('ocr')
      }, 5000)
    }

    return () => {
      if (qrTimeoutRef.current) {
        clearTimeout(qrTimeoutRef.current)
        qrTimeoutRef.current = null
      }
    }
  }, [open, scanMode, onOcrScan])

  // Load QR scanner component
  useEffect(() => {
    let cancelled = false

    if (!open) {
      setScannerComponent(null)
      setScanMode('qr')
      lastScannedRef.current = null
      scanningRef.current = false
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

  // OCR processing
  useEffect(() => {
    if (!open || scanMode !== 'ocr' || !onOcrScan) return

    let processingRef = false // Use local ref instead of state to avoid re-renders

    const processOcr = async () => {
      if (processingRef) return

      const videoElement = document.querySelector('video')
      if (!videoElement) return

      processingRef = true
      setIsProcessing(true)

      try {
        // Create canvas to capture video frame
        const canvas = document.createElement('canvas')
        canvas.width = videoElement.videoWidth
        canvas.height = videoElement.videoHeight
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          processingRef = false
          setIsProcessing(false)
          return
        }

        ctx.drawImage(videoElement, 0, 0)

        // Run OCR on the captured frame
        const { data: { text } } = await Tesseract.recognize(canvas, 'eng', {
          logger: (m) => console.log(m),
        })

        console.log('OCR Text:', text)

        // Parse PFR data from the extracted text
        const pfrData = parsePfrData(text)

        if (pfrData) {
          console.log('Parsed PFR Data:', pfrData)
          onOcrScan(pfrData)
          onOpenChange(false)
        }
      } catch (err) {
        console.error('OCR Error:', err)
      } finally {
        processingRef = false
        setIsProcessing(false)
      }
    }

    // Process OCR every 2 seconds
    ocrIntervalRef.current = setInterval(processOcr, 2000)

    return () => {
      if (ocrIntervalRef.current) {
        clearInterval(ocrIntervalRef.current)
        ocrIntervalRef.current = null
      }
    }
  }, [open, scanMode, onOcrScan, onOpenChange])

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
      if (ocrIntervalRef.current) {
        clearInterval(ocrIntervalRef.current)
        ocrIntervalRef.current = null
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
    setScanMode('qr')
    setIsProcessing(false)

    // Clear all refs
    if (qrTimeoutRef.current) {
      clearTimeout(qrTimeoutRef.current)
      qrTimeoutRef.current = null
    }
    if (ocrIntervalRef.current) {
      clearInterval(ocrIntervalRef.current)
      ocrIntervalRef.current = null
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
            {scanMode === 'qr' ? (
              <Camera className="h-5 w-5" />
            ) : (
              <ScanText className="h-5 w-5" />
            )}
            {scanMode === 'qr' ? t('receipts.qrScanner.title') : t('receipts.qrScanner.ocrTitle')}
          </DialogTitle>
          <DialogDescription>
            {scanMode === 'qr'
              ? t('receipts.qrScanner.description')
              : t('receipts.qrScanner.ocrDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="relative min-h-[350px] bg-muted rounded-lg overflow-hidden">
          {/* Mode indicator overlay */}
          {scanMode === 'ocr' && !error && (
            <div className="absolute top-0 left-0 right-0 z-10 bg-blue-500/90 text-white px-4 py-2 text-center text-sm">
              <div className="flex items-center justify-center gap-2">
                <ScanText className="h-4 w-4" />
                <span>{t('receipts.qrScanner.scanningPfr')}</span>
              </div>
            </div>
          )}

          {/* Processing indicator */}
          {isProcessing && (
            <div className="absolute bottom-4 right-4 z-10 bg-white/90 rounded-full px-3 py-1 text-xs text-gray-700 flex items-center gap-2">
              <div className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full" />
              {t('receipts.qrScanner.processing')}
            </div>
          )}
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
