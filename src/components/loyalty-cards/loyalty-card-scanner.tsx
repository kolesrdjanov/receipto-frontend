import { useEffect, useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Camera, Loader2, CameraOff, X } from 'lucide-react'
import { getErrorMessage } from '@/lib/api'

interface LoyaltyCardScannerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScan: (value: string, format: string) => void
}

const READER_ID = 'loyalty-card-reader'
const CAMERA_TIMEOUT_MS = 10_000
/** Emerald scan laser (matches the handoff; a focal brand moment, kept literal). */
const LASER = 'oklch(0.78 0.15 165)'

export function LoyaltyCardScanner({ open, onOpenChange, onScan }: LoyaltyCardScannerProps) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
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
        { fps: 10, qrbox: { width: 280, height: 280 }, disableFlip: false },
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
      setError(getErrorMessage(err, t('loyaltyCards.cameraError')))
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
    }
    cleanup()
    setError(null)
    setIsLoading(true)
    setCameraTimedOut(false)
    scanningRef.current = false
  }, [open, startScanner, cleanup])

  const handleTryAgain = async () => {
    await cleanup()
    startScanner()
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Content
              asChild
              forceMount
              aria-describedby={undefined}
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <motion.div
                className="fixed inset-0 z-[60] flex flex-col bg-[oklch(0.04_0_0/0.98)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduce ? 0 : 0.2 }}
              >
                <DialogPrimitive.Title className="sr-only">{t('loyaltyCards.scanCard')}</DialogPrimitive.Title>

                {/* Top bar */}
                <div className="flex items-center justify-between px-[18px] py-4 pt-[max(16px,env(safe-area-inset-top))]">
                  <span className="text-[16px] font-bold text-white">{t('loyaltyCards.scanCard')}</span>
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    aria-label={t('common.cancel')}
                    className="hit-area grid size-9 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                  >
                    <X className="size-[18px]" />
                  </button>
                </div>

                {/* Stage */}
                <div className="flex flex-1 flex-col items-center justify-center gap-[26px] px-7 pb-10">
                  <div className="relative aspect-square w-[min(78%,300px)] rounded-[24px] bg-white/[0.03]">
                    {/* Camera feed */}
                    <div
                      id={READER_ID}
                      className="absolute inset-0 overflow-hidden rounded-[24px] [&_video]:size-full [&_video]:object-cover"
                    />

                    {/* Corner brackets */}
                    <span className="absolute left-0 top-0 size-[34px] rounded-tl-[14px] border-l-[3px] border-t-[3px] border-white" />
                    <span className="absolute right-0 top-0 size-[34px] rounded-tr-[14px] border-r-[3px] border-t-[3px] border-white" />
                    <span className="absolute bottom-0 left-0 size-[34px] rounded-bl-[14px] border-b-[3px] border-l-[3px] border-white" />
                    <span className="absolute bottom-0 right-0 size-[34px] rounded-br-[14px] border-b-[3px] border-r-[3px] border-white" />

                    {/* Scan laser */}
                    {!error && !isLoading && (
                      <motion.span
                        className="absolute left-[10%] right-[10%] h-0.5 rounded-full"
                        style={{ background: `linear-gradient(90deg, transparent, ${LASER}, transparent)`, boxShadow: `0 0 12px ${LASER}` }}
                        initial={{ top: '10%' }}
                        animate={reduce ? { top: '50%' } : { top: ['10%', '90%', '10%'] }}
                        transition={reduce ? undefined : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    )}

                    {/* Loading / timeout / error overlays */}
                    {(isLoading || error) && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-[24px] bg-[oklch(0.04_0_0/0.9)] p-6 text-center">
                        {error ? (
                          <>
                            <X className="size-10 text-destructive" />
                            <p className="text-sm text-destructive">{error}</p>
                            <button
                              type="button"
                              onClick={handleTryAgain}
                              className="mt-2 rounded-full border border-white/25 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-white/10"
                            >
                              {t('loyaltyCards.tryAgain')}
                            </button>
                          </>
                        ) : cameraTimedOut ? (
                          <>
                            <CameraOff className="size-9 text-white/70" />
                            <p className="text-sm font-medium text-white">{t('loyaltyCards.cameraSlowTitle')}</p>
                            <p className="text-xs text-white/60">{t('loyaltyCards.cameraSlowDescription')}</p>
                            <button
                              type="button"
                              onClick={handleTryAgain}
                              className="mt-2 rounded-full border border-white/25 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-white/10"
                            >
                              {t('loyaltyCards.tryAgain')}
                            </button>
                          </>
                        ) : (
                          <Loader2 className="size-8 animate-spin text-white/70" />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex max-w-[300px] flex-col items-center gap-2 text-center text-[13px] font-medium leading-relaxed text-white/75">
                    <Camera className="size-[15px] text-white/70" />
                    {t('loyaltyCards.scanDescription')}
                  </div>
                </div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  )
}
