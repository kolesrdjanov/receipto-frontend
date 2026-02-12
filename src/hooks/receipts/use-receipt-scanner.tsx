import { lazy, Suspense, useState, useCallback, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useCreateReceipt } from './use-receipts'
import type { PfrData } from '@/components/receipts/pfr-entry-modal'

const QrScanner = lazy(() => import('@/components/receipts/qr-scanner').then(m => ({ default: m.QrScanner })))
const PfrEntryModal = lazy(() => import('@/components/receipts/pfr-entry-modal').then(m => ({ default: m.PfrEntryModal })))

interface UseReceiptScannerOptions {
  /** Navigate to receipts page after successful scan. Default: false */
  navigateOnSuccess?: boolean
}

export function useReceiptScanner(options: UseReceiptScannerOptions = {}) {
  const { navigateOnSuccess = false } = options
  const { t } = useTranslation()
  const navigate = useNavigate()
  const createReceipt = useCreateReceipt()
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isPfrEntryOpen, setIsPfrEntryOpen] = useState(false)

  const handleQrScan = useCallback(async (url: string) => {
    await createReceipt.mutateAsync({ qrCodeUrl: url })
    toast.success(t('receipts.qrScanner.scanSuccess'), {
      description: t('receipts.qrScanner.scanSuccessDescription'),
    })
    if (navigateOnSuccess) navigate('/receipts')
  }, [createReceipt, t, navigateOnSuccess, navigate])

  const handleOcrScan = useCallback(async (pfrData: PfrData) => {
    try {
      await createReceipt.mutateAsync({
        pfrData: {
          InvoiceNumberSe: pfrData.InvoiceNumberSe,
          InvoiceCounter: pfrData.InvoiceCounter,
          InvoiceCounterExtension: pfrData.InvoiceCounterExtension,
          TotalAmount: pfrData.TotalAmount,
          SdcDateTime: pfrData.SdcDateTime,
        },
      })
      toast.success(t('receipts.qrScanner.scanSuccess'), {
        description: t('receipts.qrScanner.scanSuccessDescription'),
      })
      setIsPfrEntryOpen(false)
      if (navigateOnSuccess) navigate('/receipts')
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred'
      toast.error(t('receipts.qrScanner.scanError'), {
        description: errorMessage,
      })
    }
  }, [createReceipt, t, navigateOnSuccess, navigate])

  const openQrScanner = useCallback(() => setIsScannerOpen(true), [])
  const openPfrEntry = useCallback(() => setIsPfrEntryOpen(true), [])

  // Return as ReactNode, not as a component function, to avoid remounting
  // on every parent re-render (which would lose QrScanner's internal error state)
  const scannerModals: ReactNode = (
    <>
      <Suspense fallback={null}>
        {isScannerOpen && (
          <QrScanner
            open={isScannerOpen}
            onOpenChange={setIsScannerOpen}
            onScan={handleQrScan}
          />
        )}
      </Suspense>
      <Suspense fallback={null}>
        {isPfrEntryOpen && (
          <PfrEntryModal
            open={isPfrEntryOpen}
            onOpenChange={setIsPfrEntryOpen}
            onSubmit={handleOcrScan}
          />
        )}
      </Suspense>
    </>
  )

  return {
    openQrScanner,
    openPfrEntry,
    scannerModals,
    isCreating: createReceipt.isPending,
  }
}
