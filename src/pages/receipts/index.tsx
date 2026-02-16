import { useState, lazy, Suspense, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AppLayout } from '@/components/layout/app-layout'
const ReceiptModal = lazy(() => import('@/components/receipts/receipt-modal').then(m => ({ default: m.ReceiptModal })))
const TemplateSelectorModal = lazy(() => import('@/components/receipts/template-selector-modal').then(m => ({ default: m.TemplateSelectorModal })))
const ReceiptViewerModal = lazy(() => import('@/components/receipts/receipt-viewer-modal').then(m => ({ default: m.ReceiptViewerModal })))
import { ReceiptsFiltersBar } from '@/components/receipts/receipts-filters'
import {
  useReceipts,
  useReceipt,
  useDeleteReceipt,
  useBulkDeleteReceipts,
  useExportReceipts,
  useImportReceipts,
  type Receipt,
  type ReceiptsFilters,
} from '@/hooks/receipts/use-receipts'
import { useReceiptScanner } from '@/hooks/receipts/use-receipt-scanner'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { formatDateTime } from '@/lib/date-utils'
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/animated'
import { Checkbox } from '@/components/ui/checkbox'
import { Camera, Plus, Pencil, Loader2, Filter, Trash2, ChevronDown, Eye, ArrowUpDown, ArrowUp, ArrowDown, Archive, Users, Info, Download, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { useCurrencyConverter } from '@/hooks/currencies/use-currency-converter'

const CSV_TEMPLATE = `storeName,totalAmount,currency,receiptDate,receiptNumber,categoryName
"Maxi Supermarket",2450.00,RSD,2024-06-15,12345,Groceries
"Shell Gas Station",5200.50,RSD,2024-06-14,,Transport
"Restaurant Dva Jelena",3800.00,RSD,2024-06-13,67890,
`

// Helper to parse filters from URL search params
function getFiltersFromParams(params: URLSearchParams): ReceiptsFilters {
  return {
    startDate: params.get('startDate') || undefined,
    endDate: params.get('endDate') || undefined,
    categoryId: params.get('categoryId') || undefined,
    minAmount: params.get('minAmount') ? Number(params.get('minAmount')) : undefined,
    maxAmount: params.get('maxAmount') ? Number(params.get('maxAmount')) : undefined,
  }
}

function hasActiveFilters(filters: ReceiptsFilters): boolean {
  return !!(filters.startDate || filters.endDate || filters.categoryId || filters.minAmount !== undefined || filters.maxAmount !== undefined)
}

export default function Receipts() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()

  // Initialize filters directly from URL params to avoid double load
  const initialFilters = getFiltersFromParams(searchParams)
  const isFirstMount = useRef(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [showFilters, setShowFilters] = useState(() => hasActiveFilters(initialFilters))
  const [filters, setFilters] = useState<ReceiptsFilters>(initialFilters)
  const [page, setPage] = useState(1)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [receiptToDelete, setReceiptToDelete] = useState<Receipt | null>(null)
  const [showAddDropdown, setShowAddDropdown] = useState(false)
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false)
  const [prefillData, setPrefillData] = useState<Partial<Receipt> | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerReceiptId, setViewerReceiptId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'receiptDate' | 'createdAt'>('receiptDate')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const debouncedFilters = useDebouncedValue(filters, 400)
  const { data: response, isLoading } = useReceipts({ ...debouncedFilters, page, limit: 10, sortBy, sortOrder })
  const receipts = response?.data ?? []
  const meta = response?.meta
  const totalAmounts = response?.totalAmounts ?? []
  const filtersActive = hasActiveFilters(debouncedFilters)
  const { convert, preferredCurrency } = useCurrencyConverter()
  const { openQrScanner, openPfrEntry, scannerModals, isCreating } = useReceiptScanner()
  const deleteReceipt = useDeleteReceipt()
  const exportReceipts = useExportReceipts()
  const importReceipts = useImportReceipts()
  const bulkDelete = useBulkDeleteReceipts()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const importInputRef = useRef<HTMLInputElement>(null)
  const { data: viewerReceiptFull } = useReceipt(viewerReceiptId ?? '')

  // Sync filters with URL params when URL changes (skip first mount - already initialized)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }

    const newFilters = getFiltersFromParams(searchParams)
    setFilters(newFilters)
    if (hasActiveFilters(newFilters)) {
      setShowFilters(true)
    }
    setPage(1)
  }, [searchParams])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAddDropdown(false)
      }
    }

    if (showAddDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAddDropdown])

  const handleFiltersChange = (newFilters: ReceiptsFilters) => {
    setFilters(newFilters)
    setPage(1) // Reset to first page when filters change

    // Update URL params to keep in sync
    const params = new URLSearchParams()
    if (newFilters.startDate) params.set('startDate', newFilters.startDate)
    if (newFilters.endDate) params.set('endDate', newFilters.endDate)
    if (newFilters.categoryId) params.set('categoryId', newFilters.categoryId)
    if (newFilters.minAmount !== undefined) params.set('minAmount', String(newFilters.minAmount))
    if (newFilters.maxAmount !== undefined) params.set('maxAmount', String(newFilters.maxAmount))
    setSearchParams(params, { replace: true })
  }

  const handleAddManually = () => {
    setSelectedReceipt(null)
    setModalMode('create')
    setPrefillData(null)
    setIsModalOpen(true)
    setShowAddDropdown(false)
  }

  const handleAddFromTemplate = () => {
    setTemplateSelectorOpen(true)
    setShowAddDropdown(false)
  }

  const handleTemplateSelect = (template: any) => {
    setPrefillData({
      storeName: template.storeName,
      currency: template.currency,
      categoryId: template.categoryId,
    })
    setSelectedReceipt(null)
    setModalMode('create')
    setTemplateSelectorOpen(false)
    setIsModalOpen(true)
  }

  const handleEditReceipt = (receipt: Receipt) => {
    setSelectedReceipt(receipt)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handlePfrEntry = () => {
    openPfrEntry()
    setShowAddDropdown(false)
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
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred'
      toast.error(t('receipts.modal.deleteError'), {
        description: errorMessage,
      })
    }
  }

  const handleViewReceipt = (receipt: Receipt) => {
    setViewerReceiptId(receipt.id)
    setViewerOpen(true)
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


  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === receipts.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(receipts.map((r) => r.id)))
    }
  }

  const confirmBulkDelete = async () => {
    try {
      const result = await bulkDelete.mutateAsync(Array.from(selectedIds))
      if (result.skipped > 0) {
        toast.warning(t('receipts.bulkDeletePartial', { deleted: result.deleted, skipped: result.skipped }))
      } else {
        toast.success(t('receipts.bulkDeleteSuccess', { deleted: result.deleted }))
      }
      setSelectedIds(new Set())
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      toast.error(errorMessage)
    }
  }

  const handleExport = async () => {
    try {
      await exportReceipts.mutateAsync()
      toast.success(t('receipts.export.success'))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      toast.error(t('receipts.export.error'), { description: errorMessage })
    }
  }

  const handleDownloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'receipts-template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handleSelectImportFile = () => {
    importInputRef.current?.click()
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const result = await importReceipts.mutateAsync(file)

      if (result.errors.length === 0) {
        toast.success(t('receipts.import.success', { count: result.imported }))
      } else if (result.imported > 0) {
        toast.warning(t('receipts.import.partialSuccess', {
          imported: result.imported,
          total: result.total,
        }), {
          description: `${result.errors.length} ${t('receipts.import.errorsOccurred')}`,
        })
      } else {
        toast.error(t('receipts.import.error'), {
          description: result.errors[0]?.message || 'Unknown error',
        })
      }

      setImportDialogOpen(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      toast.error(t('receipts.import.error'), { description: errorMessage })
    }

    if (importInputRef.current) {
      importInputRef.current.value = ''
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
      case 'completed': // Legacy status value
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

  return (
    <AppLayout>
      <PageTransition>
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between sm:mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1 sm:text-3xl sm:mb-2" data-testid="receipts-title">{t('receipts.title')}</h2>
          <p className="text-sm text-muted-foreground sm:text-base" data-testid="receipts-subtitle">
            {t('receipts.subtitle')}{' '}
            <Link to="/templates" className="text-primary hover:underline" data-testid="receipts-manage-templates-link">
              {t('receipts.manageTemplates')}
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-4 lg:gap-2">
          <Button
            variant={showFilters ? 'secondary' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
            className="order-2 lg:order-1 flex-1 sm:flex-none"
            data-testid="receipts-filter-button"
          >
            <Filter className="h-4 w-4" />
            {t('receipts.filtersButton')}
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exportReceipts.isPending}
            className="order-3 lg:order-2 flex-1 sm:flex-none"
          >
            {exportReceipts.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {t('receipts.export.button')}
          </Button>
          <Button
            variant="outline"
            onClick={() => setImportDialogOpen(true)}
            className="order-4 lg:order-3 flex-1 sm:flex-none"
          >
            <Upload className="h-4 w-4" />
            {t('receipts.import.button')}
          </Button>
          <div className="order-1 lg:order-4 flex gap-4 lg:gap-2 w-full lg:w-auto">
            <div className="relative flex-1 sm:flex-none" ref={dropdownRef}>
              <Button
                variant="outline"
                onClick={() => setShowAddDropdown(!showAddDropdown)}
                className="w-full sm:w-auto"
                data-testid="receipts-add-dropdown-button"
              >
                <Plus className="h-4 w-4" />
                <span>{t('receipts.addManually')}</span>
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
              {showAddDropdown && (
                <div className="absolute left-0 mt-2 w-full sm:w-48 bg-popover/95 backdrop-blur-lg border border-border/50 rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in-0 zoom-in-95" data-testid="receipts-add-dropdown">
                  <button
                    onClick={handleAddManually}
                    className="w-full px-3 py-2.5 text-left text-sm hover:bg-primary/10 rounded-lg transition-colors"
                    data-testid="receipts-add-blank-button"
                  >
                    {t('receipts.addBlank')}
                  </button>
                  <button
                    onClick={handleAddFromTemplate}
                    className="w-full px-3 py-2.5 text-left text-sm hover:bg-primary/10 rounded-lg transition-colors"
                    data-testid="receipts-add-from-template-button"
                  >
                    {t('receipts.addFromTemplate')}
                  </button>
                  <button
                    onClick={handlePfrEntry}
                    className="w-full px-3 py-2.5 text-left text-sm hover:bg-primary/10 rounded-lg transition-colors"
                    data-testid="receipts-add-pfr-button"
                  >
                    {t('receipts.addViaPfr')}
                  </button>
                </div>
              )}
            </div>
            <Button variant="glossy" onClick={openQrScanner} disabled={isCreating} className="flex-1 sm:flex-none" data-testid="receipts-scan-qr-button">
              {isCreating ? (
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

      {totalAmounts.length > 0 && !isLoading && receipts.length > 0 && (() => {
        const convertedTotal = totalAmounts.reduce(
          (sum, { currency, total }) => sum + convert(total, currency),
          0,
        )
        const allSameCurrency = totalAmounts.length === 1 && totalAmounts[0].currency === preferredCurrency

        return (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-4 px-1 text-sm">
            <span className="font-medium text-muted-foreground">
              {filtersActive ? t('receipts.filteredTotal') : t('receipts.total')}:
            </span>
            <span className="font-semibold text-foreground">
              {preferredCurrency} {convertedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {!allSameCurrency && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" title={t('receipts.convertedDisclaimer')}>
                <Info className="h-3 w-3" />
                {t('receipts.convertedNote')}
              </span>
            )}
          </div>
        )
      })()}

      {isLoading ? (
        <div className="flex items-center justify-center py-12" data-testid="receipts-loading">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : receipts.length === 0 ? (
        <div className="empty-state" data-testid="receipts-empty">
          <div className="relative mb-2">
            <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: '2s' }} />
            <Camera className="empty-state-icon !mb-0 relative" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{t('receipts.noReceipts')}</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            {t('receipts.noReceiptsText')}
          </p>
          <Button variant="glossy" onClick={openQrScanner}>
            <Camera className="h-4 w-4" />
            {t('receipts.scanQr')}
          </Button>
        </div>
      ) : (
        <>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 mb-4 px-3 py-2 bg-muted/50 border rounded-lg">
              <span className="text-sm font-medium">
                {t('receipts.selected', { count: selectedIds.size })}
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkDeleteConfirmOpen(true)}
                disabled={bulkDelete.isPending}
              >
                {bulkDelete.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {t('receipts.removeSelected')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
              >
                <X className="h-4 w-4" />
                {t('receipts.clearSelection')}
              </Button>
            </div>
          )}

          {/* Mobile Card View */}
          <StaggerContainer key={receipts.map(r => r.id).join()} className="md:hidden space-y-3">
            {receipts.map((receipt) => (
              <StaggerItem key={receipt.id}>
              <Card className="overflow-hidden card-interactive">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <Checkbox
                        checked={selectedIds.has(receipt.id)}
                        onCheckedChange={() => toggleSelect(receipt.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">
                          {receipt.storeName || t('receipts.unknownStore')}
                        </h3>
                      <p className="text-2xl font-bold text-primary">
                        {formatAmount(receipt)}
                      </p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {receipt.hasJournal && (
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
                        disabled={!!receipt.group?.isArchived}
                        title={receipt.group?.isArchived ? t('receipts.archivedGroupLocked') : undefined}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteReceipt(receipt)}
                        disabled={deleteReceipt.isPending || !!receipt.group?.isArchived}
                        title={receipt.group?.isArchived ? t('receipts.archivedGroupLocked') : undefined}
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
                      <span className="text-muted-foreground">{t('receipts.table.createdAt')}</span>
                      <span className="font-medium">{receipt.createdAt ? formatDateTime(receipt.createdAt) : '-'}</span>
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

                    {receipt.group && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">{t('receipts.table.group')}</span>
                        <span className={`inline-flex items-center gap-1 font-medium ${receipt.group.isArchived ? 'text-muted-foreground' : ''}`}>
                          <Users className="h-3 w-3" />
                          {receipt.group.name}
                          {receipt.group.isArchived && (
                            <Archive className="h-3 w-3 ml-0.5" />
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              </StaggerItem>
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
          </StaggerContainer>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table className="table-fixed w-full" data-testid="receipts-table">
              <TableHeader>
                <TableRow>
                  <TableHead style={{ width: '40px' }}>
                    <Checkbox
                      checked={receipts.length > 0 && selectedIds.size === receipts.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
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
                  <TableHead>
                    <button
                      onClick={() => handleSort('createdAt')}
                      className="flex items-center hover:text-foreground transition-colors"
                    >
                      {t('receipts.table.createdAt')}
                      {getSortIcon('createdAt')}
                    </button>
                  </TableHead>
                  <TableHead>{t('receipts.table.category')}</TableHead>
                  <TableHead>{t('receipts.table.group')}</TableHead>
                  <TableHead style={{ width: '120px' }}>{t('receipts.table.status')}</TableHead>
                  <TableHead style={{ width: '120px' }}></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipts.map((receipt) => (
                  <TableRow key={receipt.id} data-testid={`receipt-row-${receipt.id}`}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(receipt.id)}
                        onCheckedChange={() => toggleSelect(receipt.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium" data-testid={`receipt-store-${receipt.id}`}>
                      {receipt.storeName || t('receipts.unknownStore')}
                    </TableCell>
                    <TableCell>{formatAmount(receipt)}</TableCell>
                    <TableCell>{receipt.receiptDate ? formatDateTime(receipt.receiptDate) : '-'}</TableCell>
                    <TableCell>{receipt.createdAt ? formatDateTime(receipt.createdAt) : '-'}</TableCell>
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
                    <TableCell>
                      {receipt.group ? (
                        <span className={`inline-flex items-center gap-1 text-sm ${receipt.group.isArchived ? 'text-muted-foreground' : ''}`}>
                          <Users className="h-3 w-3" />
                          {receipt.group.name}
                          {receipt.group.isArchived && (
                            <Archive className="h-3 w-3 ml-0.5" />
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(receipt.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {receipt.hasJournal && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewReceipt(receipt)}
                            title={t('receipts.viewer.viewReceipt')}
                            data-testid={`receipt-view-${receipt.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditReceipt(receipt)}
                          disabled={!!receipt.group?.isArchived}
                          title={receipt.group?.isArchived ? t('receipts.archivedGroupLocked') : undefined}
                          data-testid={`receipt-edit-${receipt.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteReceipt(receipt)}
                          disabled={deleteReceipt.isPending || !!receipt.group?.isArchived}
                          title={receipt.group?.isArchived ? t('receipts.archivedGroupLocked') : undefined}
                          data-testid={`receipt-delete-${receipt.id}`}
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
              <div className="px-4 hidden md:block">
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
        </>
      )}

      <Suspense fallback={null}>
        {isModalOpen && (
          <ReceiptModal
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            receipt={selectedReceipt}
            mode={modalMode}
            prefillData={prefillData}
          />
        )}
      </Suspense>

      {scannerModals}

      <Suspense fallback={null}>
        {templateSelectorOpen && (
          <TemplateSelectorModal
            open={templateSelectorOpen}
            onOpenChange={setTemplateSelectorOpen}
            onSelect={handleTemplateSelect}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {viewerOpen && (
          <ReceiptViewerModal
            open={viewerOpen}
            onOpenChange={setViewerOpen}
            journalText={viewerReceiptFull?.scrapedData?.journal ?? null}
            receiptNumber={viewerReceiptFull?.receiptNumber}
          />
        )}
      </Suspense>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('receipts.import.guide.title')}</DialogTitle>
            <DialogDescription>
              {t('receipts.import.guide.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">{t('receipts.import.guide.columns')}</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="font-mono text-xs bg-muted px-2 py-1 rounded">
                  {t('receipts.import.guide.columnStoreName')}
                </li>
                <li className="font-mono text-xs bg-muted px-2 py-1 rounded">
                  {t('receipts.import.guide.columnTotalAmount')}
                </li>
                <li className="font-mono text-xs bg-muted px-2 py-1 rounded">
                  {t('receipts.import.guide.columnCurrency')}
                </li>
                <li className="font-mono text-xs bg-muted px-2 py-1 rounded">
                  {t('receipts.import.guide.columnReceiptDate')}
                </li>
                <li className="font-mono text-xs bg-muted px-2 py-1 rounded">
                  {t('receipts.import.guide.columnReceiptNumber')}
                </li>
                <li className="font-mono text-xs bg-muted px-2 py-1 rounded">
                  {t('receipts.import.guide.columnCategoryName')}
                </li>
              </ul>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('receipts.import.guide.dateFormats')}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4" />
                {t('receipts.import.guide.downloadTemplate')}
              </Button>
              <Button onClick={handleSelectImportFile} disabled={importReceipts.isPending}>
                {importReceipts.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {t('receipts.import.guide.selectFile')}
              </Button>
            </div>
          </div>
          <input
            ref={importInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleImportFile}
            className="hidden"
          />
        </DialogContent>
      </Dialog>

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

      <ConfirmDialog
        open={bulkDeleteConfirmOpen}
        onOpenChange={setBulkDeleteConfirmOpen}
        onConfirm={confirmBulkDelete}
        title={t('receipts.removeSelected')}
        description={t('receipts.bulkDeleteConfirm', { count: selectedIds.size })}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="destructive"
        isLoading={bulkDelete.isPending}
      />
      </PageTransition>
    </AppLayout>
  )
}
