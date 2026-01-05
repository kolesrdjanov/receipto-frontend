import { useState, lazy, Suspense } from 'react'
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
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { AppLayout } from '@/components/layout/app-layout'
const ReceiptModal = lazy(() => import('@/components/receipts/receipt-modal').then(m => ({ default: m.ReceiptModal })))
const QrScanner = lazy(() => import('@/components/receipts/qr-scanner').then(m => ({ default: m.QrScanner })))
import { ReceiptsFiltersBar } from '@/components/receipts/receipts-filters'
import {
  useReceipts,
  useCreateReceipt,
  useDeleteReceipt,
  type Receipt,
  type ReceiptsFilters,
} from '@/hooks/receipts/use-receipts'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { formatDateTime } from '@/lib/date-utils'
import { Camera, Plus, Pencil, Loader2, Filter, Trash2 } from 'lucide-react'
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [receiptToDelete, setReceiptToDelete] = useState<Receipt | null>(null)

  const debouncedFilters = useDebouncedValue(filters, 400)
  const { data: response, isLoading } = useReceipts({ ...debouncedFilters, page, limit: 10 })
  const receipts = response?.data ?? []
  const meta = response?.meta
  const createReceipt = useCreateReceipt()
  const deleteReceipt = useDeleteReceipt()

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

  const handleDeleteReceipt = (receipt: Receipt) => {
    setReceiptToDelete(receipt)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!receiptToDelete) return

    try {
      await deleteReceipt.mutateAsync(receiptToDelete.id)
      toast.success(t('receipts.deleteSuccess'))
      setReceiptToDelete(null)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred'
      toast.error(t('receipts.deleteError'), {
        description: errorMessage,
      })
    }
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
        <div className="flex flex-wrap gap-4 lg:gap-2">
          <Button
            variant={showFilters ? 'secondary' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
            className="order-2 lg:order-1 flex-1 sm:flex-none"
          >
            <Filter className="h-4 w-4" />
            {t('receipts.filtersButton')}
          </Button>
          <div className="order-1 lg:order-2 flex gap-4 lg:gap-2 w-full lg:w-auto">
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
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {receipts.map((receipt) => (
              <Card key={receipt.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        {receipt.storeName || t('receipts.unknownStore')}
                      </h3>
                      <p className="text-2xl font-bold text-primary">
                        {formatAmount(receipt)}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditReceipt(receipt)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteReceipt(receipt)}
                        disabled={deleteReceipt.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t('receipts.table.date')}</span>
                      <span className="font-medium">{receipt.receiptDate ? formatDateTime(receipt.receiptDate) : '-'}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t('receipts.table.category')}</span>
                      {receipt.category ? (
                        <span className="inline-flex items-center gap-1 font-medium">
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {meta && meta.totalPages > 1 && (
              <div className="pt-2">
                <Pagination
                  page={meta.page}
                  totalPages={meta.totalPages}
                  total={meta.total}
                  limit={meta.limit}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <Card className="hidden md:block">
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>{t('receipts.table.store')}</TableHead>
                  <TableHead>{t('receipts.table.amount')}</TableHead>
                  <TableHead>{t('receipts.table.date')}</TableHead>
                  <TableHead>{t('receipts.table.category')}</TableHead>
                  <TableHead style={{ width: '120px' }}>{t('receipts.table.status')}</TableHead>
                  <TableHead style={{ width: '120px' }}></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipts.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell className="font-medium">
                      {receipt.storeName || t('receipts.unknownStore')}
                    </TableCell>
                    <TableCell>{formatAmount(receipt)}</TableCell>
                    <TableCell>{receipt.receiptDate ? formatDateTime(receipt.receiptDate) : '-'}</TableCell>
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
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditReceipt(receipt)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteReceipt(receipt)}
                          disabled={deleteReceipt.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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
        </>
      )}

      <Suspense fallback={null}>
        {isModalOpen && (
          <ReceiptModal
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            receipt={selectedReceipt}
            mode={modalMode}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {isScannerOpen && (
          <QrScanner
            open={isScannerOpen}
            onOpenChange={setIsScannerOpen}
            onScan={handleQrScan}
          />
        )}
      </Suspense>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={confirmDelete}
        title={t('receipts.modal.deleteTitle')}
        description={t('receipts.modal.deleteConfirm', {
          store: receiptToDelete?.storeName || t('receipts.unknownStore'),
        })}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="destructive"
        isLoading={deleteReceipt.isPending}
      />
    </AppLayout>
  )
}
