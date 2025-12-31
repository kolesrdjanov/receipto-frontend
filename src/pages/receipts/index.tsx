import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { AppLayout } from '@/components/layout/app-layout'
import { ReceiptModal } from '@/components/receipts/receipt-modal'
import { QrScanner } from '@/components/receipts/qr-scanner'
import { ReceiptsFiltersBar } from '@/components/receipts/receipts-filters'
import {
  useReceipts,
  useCreateReceipt,
  type Receipt,
  type ReceiptsFilters,
} from '@/hooks/receipts/use-receipts'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { Camera, Plus, Pencil, Loader2, Filter } from 'lucide-react'
import { toast } from 'sonner'

export default function Receipts() {
  const { t } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<ReceiptsFilters>({})
  const [page, setPage] = useState(1)

  const debouncedFilters = useDebouncedValue(filters, 400)
  const { data: response, isLoading } = useReceipts({ ...debouncedFilters, page })
  const receipts = response?.data ?? []
  const meta = response?.meta
  const createReceipt = useCreateReceipt()

  const handleFiltersChange = (newFilters: ReceiptsFilters) => {
    setFilters(newFilters)
    setPage(1) // Reset to first page when filters change
  }

  const handleAddManually = () => {
    setSelectedReceipt(null)
    setModalMode('create')
    setIsModalOpen(true)
  }

  const handleEditReceipt = (receipt: Receipt) => {
    setSelectedReceipt(receipt)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleScanQr = () => {
    setIsScannerOpen(true)
  }

  const handleQrScan = async (url: string) => {
    try {
      await createReceipt.mutateAsync({ qrCodeUrl: url })
      toast.success(t('receipts.qrScanner.scanSuccess'), {
        description: t('receipts.qrScanner.scanSuccessDescription'),
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred'
      toast.error(t('receipts.qrScanner.scanError'), {
        description: errorMessage,
      })
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString()
  }

  const formatAmount = (receipt: Receipt) => {
    const currency: string = receipt.currency || 'RSD'
    const amount = receipt.totalAmount
    if (amount === undefined || amount === null) return '-'

    return `${currency} ${amount}`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scraped':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            {t('receipts.status.completed')}
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            {t('receipts.status.pending')}
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            {t('receipts.status.failed')}
          </span>
        )
      default:
        return null
    }
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between sm:mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1 sm:text-3xl sm:mb-2">{t('receipts.title')}</h2>
          <p className="text-sm text-muted-foreground sm:text-base">{t('receipts.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showFilters ? 'secondary' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
            className="flex-1 sm:flex-none"
          >
            <Filter className="h-4 w-4" />
            {t('receipts.filtersButton')}
          </Button>
          <Button variant="outline" onClick={handleAddManually} className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4" />
            <span className="">{t('receipts.addManually')}</span>
          </Button>
          <Button onClick={handleScanQr} disabled={createReceipt.isPending} className="flex-1 sm:flex-none">
            {createReceipt.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            {t('receipts.scanQr')}
          </Button>
        </div>
      </div>

      {showFilters && (
        <ReceiptsFiltersBar filters={filters} onFiltersChange={handleFiltersChange} />
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : receipts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-muted-foreground">{t('receipts.noReceipts')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-center text-muted-foreground">
              {t('receipts.noReceiptsText')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('receipts.table.store')}</TableHead>
                <TableHead>{t('receipts.table.amount')}</TableHead>
                <TableHead>{t('receipts.table.date')}</TableHead>
                <TableHead>{t('receipts.table.category')}</TableHead>
                <TableHead>{t('receipts.table.status')}</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipts.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell className="font-medium">
                    {receipt.storeName || t('receipts.unknownStore')}
                  </TableCell>
                  <TableCell>{formatAmount(receipt)}</TableCell>
                  <TableCell>{formatDate(receipt.receiptDate)}</TableCell>
                  <TableCell>
                    {receipt.category ? (
                      <span className="inline-flex items-center gap-1">
                        {receipt.category.icon && (
                          <span>{receipt.category.icon}</span>
                        )}
                        <span
                          style={{
                            color: receipt.category.color || 'inherit',
                          }}
                        >
                          {receipt.category.name}
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(receipt.status)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditReceipt(receipt)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {meta && meta.totalPages > 1 && (
            <div className="px-4">
              <Pagination
                page={meta.page}
                totalPages={meta.totalPages}
                total={meta.total}
                limit={meta.limit}
                onPageChange={setPage}
              />
            </div>
          )}
        </Card>
      )}

      <ReceiptModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        receipt={selectedReceipt}
        mode={modalMode}
      />

      <QrScanner
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onScan={handleQrScan}
      />
    </AppLayout>
  )
}
