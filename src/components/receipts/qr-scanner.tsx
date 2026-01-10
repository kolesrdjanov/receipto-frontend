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
  const workerRef = useRef<Tesseract.Worker | null>(null)
  const isOcrInitializedRef = useRef(false)

  // Parse PFR data from OCR text
  const parsePfrData = (text: string): PfrData | null => {
    const lines = text.split('\n').map(line => line.trim())
    const data: PfrData = {}

    // Join all lines for easier pattern matching
    const fullText = lines.join(' ')

    // Look for PFR broj (Invoice number): XXXXXXXX-XXXXXXXX-XXXXXX
    // Example: ZWCAM9NM-ZWCAM9NM-22966
    const pfrMatch = fullText.match(/([A-Z0-9]{8}-[A-Z0-9]{8}-\d{6})/i)
    if (pfrMatch) {
      data.invoiceNumberSe = pfrMatch[1]
      data.receiptNumber = pfrMatch[1]
    }

    // Look for Brojač računa: XXXXXX/XXXXXXПП (with Cyrillic ПП at the end)
    // Example: 22895/22966ПП or with Latin PP
    const counterMatch = fullText.match(/(\d{4,6}\/\d{4,6})(?:ПП|PP)/i)
    if (counterMatch) {
      data.invoiceCounter = counterMatch[1] + 'ПП'
      if (!data.receiptNumber) {
        data.receiptNumber = counterMatch[1]
      }
    }

    // Look for Vreme/Time: DD.MM.YYYY. HH:MM:SS
    // Example: 10.1.2026. 17:52:18 or 10.01.2026. 17:52
    const dateMatch = fullText.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})\.?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/)
    if (dateMatch) {
      const day = dateMatch[1].padStart(2, '0')
      const month = dateMatch[2].padStart(2, '0')
      const year = dateMatch[3]
      data.receiptDate = `${year}-${month}-${day}`
    }

    // Look for Ukupan iznos/Total amount: X,XXX.XX or X.XXX,XX
    // Serbian format uses comma for decimals: 1.260,00
    const amountMatch = fullText.match(/(?:укупан|ukupan|iznos|total).*?([\d.]+,\d{2})/i)
    if (amountMatch) {
      // Convert Serbian format (1.260,00) to standard (1260.00)
      const amount = amountMatch[1].replace(/\./g, '').replace(',', '.')
      data.totalAmount = amount
    }

    // Check if we have at least the invoice number or counter
    if (data.invoiceNumberSe || data.invoiceCounter) {
      return data
    }

    return null
  }

  // User manually toggles between QR and PFR modes
  // No automatic timeout anymore

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

  // OCR processing with worker reuse
  useEffect(() => {
    if (!open || scanMode !== 'ocr' || !onOcrScan) {
      // Cleanup when not in OCR mode
      if (ocrIntervalRef.current) {
        clearInterval(ocrIntervalRef.current)
        ocrIntervalRef.current = null
      }
      return
    }

    let isActive = true

    // Initialize worker once
    const initWorker = async () => {
      if (!workerRef.current && !isOcrInitializedRef.current) {
        isOcrInitializedRef.current = true
        try {
          const worker = await Tesseract.createWorker('srp', 1, {
            logger: (m) => {
              if (m.status === 'recognizing text') {
                console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`)
              }
            },
          })
          if (isActive) {
            workerRef.current = worker
          } else {
            await worker.terminate()
          }
        } catch (err) {
          console.error('Failed to initialize OCR worker:', err)
          isOcrInitializedRef.current = false
        }
      }
    }

    initWorker()

    const processOcr = async () => {
      if (!isActive || isProcessing || !workerRef.current) return

      const videoElement = document.querySelector('video')
      if (!videoElement || videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) return

      setIsProcessing(true)

      try {
        // Create canvas to capture video frame
        const canvas = document.createElement('canvas')
        canvas.width = videoElement.videoWidth
        canvas.height = videoElement.videoHeight
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          setIsProcessing(false)
          return
        }

        ctx.drawImage(videoElement, 0, 0)

        // Run OCR on the captured frame using the shared worker
        const { data: { text } } = await workerRef.current.recognize(canvas)

        console.log('OCR Text:', text)

        // Parse PFR data from the extracted text
        const pfrData = parsePfrData(text)

        if (pfrData && isActive) {
          console.log('Parsed PFR Data:', pfrData)
          onOcrScan(pfrData)
          onOpenChange(false)
        }
      } catch (err) {
        console.error('OCR Error:', err)
      } finally {
        if (isActive) {
          setIsProcessing(false)
        }
      }
    }

    // Process OCR every 3 seconds (increased from 2s to reduce load)
    ocrIntervalRef.current = window.setInterval(processOcr, 3000)

    return () => {
      isActive = false
      if (ocrIntervalRef.current) {
        clearInterval(ocrIntervalRef.current)
        ocrIntervalRef.current = null
      }
    }
  }, [open, scanMode, onOcrScan, onOpenChange, isProcessing])

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

  // Cleanup Tesseract worker when component unmounts
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate().catch(console.error)
        workerRef.current = null
        isOcrInitializedRef.current = false
      }
    }
  }, [])

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

        {/* Mode Selector */}
        {onOcrScan && (
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setScanMode('qr')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                scanMode === 'qr'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('receipts.qrScanner.qrMode')}
            </button>
            <button
              onClick={() => setScanMode('ocr')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                scanMode === 'ocr'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('receipts.qrScanner.pfrMode')}
            </button>
          </div>
        )}

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
