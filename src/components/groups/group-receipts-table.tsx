import { useState, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import {
  useReceipts,
  useDeleteReceipt,
  type Receipt,
} from '@/hooks/receipts/use-receipts'
import { formatDateTime } from '@/lib/date-utils'
import { Pencil, Trash2, Eye, ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const ReceiptModal = lazy(() => import('@/components/receipts/receipt-modal').then(m => ({ default: m.ReceiptModal })))
const ReceiptViewerModal = lazy(() => import('@/components/receipts/receipt-viewer-modal').then(m => ({ default: m.ReceiptViewerModal })))

interface GroupReceiptsTableProps {
  groupId: string
  isArchived: boolean
}

export function GroupReceiptsTable({ groupId, isArchived }: GroupReceiptsTableProps) {
  const { t } = useTranslation()

  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<'receiptDate' | 'createdAt'>('receiptDate')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [receiptToDelete, setReceiptToDelete] = useState<Receipt | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerReceipt, setViewerReceipt] = useState<Receipt | null>(null)

  const { data: response, isLoading } = useReceipts({ groupId, page, limit: 5, sortBy, sortOrder })
  const receipts = response?.data ?? []
  const meta = response?.meta
  const deleteReceipt = useDeleteReceipt()

  const formatAmount = (receipt: Receipt) => {
    const currency: string = receipt.currency || 'RSD'
    const amount = receipt.totalAmount
    if (amount === undefined || amount === null) return '-'
    return `${currency} ${amount}`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scraped':
      case 'completed':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            {t('receipts.status.completed')}
          </span>
        )
      case 'manual':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            {t('receipts.status.manual')}
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

  const handleSort = (column: 'receiptDate' | 'createdAt') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'DESC' ? 'ASC' : 'DESC')
    } else {
      setSortBy(column)
      setSortOrder('DESC')
    }
    setPage(1)
  }

  const getSortIcon = (column: 'receiptDate' | 'createdAt') => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />
    }
    return sortOrder === 'DESC'
      ? <ArrowDown className="h-4 w-4 ml-1" />
      : <ArrowUp className="h-4 w-4 ml-1" />
  }

  const handleEditReceipt = (receipt: Receipt) => {
    setSelectedReceipt(receipt)
    setIsModalOpen(true)
  }

  const handleViewReceipt = (receipt: Receipt) => {
    setViewerReceipt(receipt)
    setViewerOpen(true)
  }

  const handleDeleteReceipt = (receipt: Receipt) => {
    setReceiptToDelete(receipt)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!receiptToDelete) return
    try {
      await deleteReceipt.mutateAsync(receiptToDelete.id)
      toast.success(t('receipts.modal.deleteSuccess'))
      setReceiptToDelete(null)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      toast.error(t('receipts.modal.deleteError'), { description: errorMessage })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (receipts.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        {t('groups.detail.noReceipts')}
      </p>
    )
  }

  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {receipts.map((receipt) => (
          <Card key={receipt.id} className="overflow-hidden card-interactive">
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
                  {receipt.scrapedData?.journal && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewReceipt(receipt)}
                      title={t('receipts.viewer.viewReceipt')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditReceipt(receipt)}
                    disabled={isArchived}
                    title={isArchived ? t('receipts.archivedGroupLocked') : undefined}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteReceipt(receipt)}
                    disabled={deleteReceipt.isPending || isArchived}
                    title={isArchived ? t('receipts.archivedGroupLocked') : undefined}
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
                      {receipt.category.icon && <span>{receipt.category.icon}</span>}
                      <span style={{ color: receipt.category.color || 'inherit' }}>
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
      <div className="hidden md:block">
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow>
              <TableHead>{t('receipts.table.store')}</TableHead>
              <TableHead>{t('receipts.table.amount')}</TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('receiptDate')}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  {t('receipts.table.date')}
                  {getSortIcon('receiptDate')}
                </button>
              </TableHead>
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
                      {receipt.category.icon && <span>{receipt.category.icon}</span>}
                      <span style={{ color: receipt.category.color || 'inherit' }}>
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
                    {receipt.scrapedData?.journal && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewReceipt(receipt)}
                        title={t('receipts.viewer.viewReceipt')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditReceipt(receipt)}
                      disabled={isArchived}
                      title={isArchived ? t('receipts.archivedGroupLocked') : undefined}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteReceipt(receipt)}
                      disabled={deleteReceipt.isPending || isArchived}
                      title={isArchived ? t('receipts.archivedGroupLocked') : undefined}
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
      </div>

      <Suspense fallback={null}>
        {isModalOpen && (
          <ReceiptModal
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            receipt={selectedReceipt}
            mode="edit"
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {viewerOpen && (
          <ReceiptViewerModal
            open={viewerOpen}
            onOpenChange={setViewerOpen}
            journalText={viewerReceipt?.scrapedData?.journal ?? null}
            receiptNumber={viewerReceipt?.receiptNumber}
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
    </>
  )
}
