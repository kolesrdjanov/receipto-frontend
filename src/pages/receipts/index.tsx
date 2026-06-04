import { useState, lazy, Suspense, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AppLayout } from '@/components/layout/app-layout'
const ReceiptModal = lazy(() => import('@/components/receipts/receipt-modal').then(m => ({ default: m.ReceiptModal })))
const TemplateSelectorModal = lazy(() => import('@/components/receipts/template-selector-modal').then(m => ({ default: m.TemplateSelectorModal })))
const ReceiptViewerModal = lazy(() => import('@/components/receipts/receipt-viewer-modal').then(m => ({ default: m.ReceiptViewerModal })))
import { FilterRail } from '@/components/receipts/filter-rail'
import { FilterSheet } from '@/components/receipts/filter-sheet'
import { QuickChips } from '@/components/receipts/quick-chips'
import { PageToolbar } from '@/components/layout/page-toolbar'
import { AddMenu, AddSheet, ImportExportSheet } from '@/components/receipts/add-menu'
import { ImportGuideDialog } from '@/components/receipts/import-guide-dialog'
import { useFabStore } from '@/store/fab'
import {
  useReceipts,
  useReceipt,
  useDeleteReceipt,
  useBulkDeleteReceipts,
  useBulkUpdateCategory,
  useExportReceipts,
  useImportReceipts,
  type Receipt,
  type ReceiptsFilters,
} from '@/hooks/receipts/use-receipts'
import { useInfiniteReceipts } from '@/hooks/receipts/use-infinite-receipts'
import { useReceiptScanner } from '@/hooks/receipts/use-receipt-scanner'
import { useCategories } from '@/hooks/categories/use-categories'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useIsMobile } from '@/hooks/use-mobile'
import { PageTransition } from '@/components/ui/animated'
import { ExpenseFeed } from '@/components/receipts/expense-feed'
import { ExpensesSummary } from '@/components/receipts/expenses-summary'
import { Camera, Loader2, SlidersHorizontal, Trash2, X, Tag, QrCode } from 'lucide-react'
import { toast } from 'sonner'

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
  const [filters, setFilters] = useState<ReceiptsFilters>(initialFilters)
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [receiptToDelete, setReceiptToDelete] = useState<Receipt | null>(null)
  const [addSheetOpen, setAddSheetOpen] = useState(false)
  const [importExportSheetOpen, setImportExportSheetOpen] = useState(false)
  const setFab = useFabStore((s) => s.setFab)
  const clearFab = useFabStore((s) => s.clearFab)
  const openAddSheet = useCallback(() => setAddSheetOpen(true), [])
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false)
  const [prefillData, setPrefillData] = useState<Partial<Receipt> | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerReceiptId, setViewerReceiptId] = useState<string | null>(null)
  // Sort is fixed to the backend default here; the sort toggle returns in Chunk 4's "…" menu.
  const sortBy: 'receiptDate' | 'createdAt' = 'receiptDate'
  const sortOrder: 'ASC' | 'DESC' = 'DESC'

  const debouncedFilters = useDebouncedValue(filters, 400)
  const isMobile = useIsMobile(768)
  // One data source per viewport: desktop = numbered pages, mobile = infinite Load-more.
  const { data: response, isLoading } = useReceipts({ ...debouncedFilters, page, limit: 50, sortBy, sortOrder }, !isMobile)
  const inf = useInfiniteReceipts({ ...debouncedFilters, limit: 50, sortBy, sortOrder }, isMobile)
  const receipts = isMobile ? (inf.data?.pages.flatMap((p) => p.data) ?? []) : (response?.data ?? [])
  const meta = isMobile ? inf.data?.pages[0]?.meta : response?.meta
  const totalAmounts = (isMobile ? inf.data?.pages[0]?.totalAmounts : response?.totalAmounts) ?? []
  const loading = isMobile ? inf.isLoading : isLoading
  const filtersActive = hasActiveFilters(debouncedFilters)
  const { openQrScanner, openGalleryScanner, scannerModals, isCreating, isGalleryProcessing } = useReceiptScanner()
  const deleteReceipt = useDeleteReceipt()
  const exportReceipts = useExportReceipts()
  const importReceipts = useImportReceipts()
  const bulkDelete = useBulkDeleteReceipts()
  const bulkUpdateCategory = useBulkUpdateCategory()
  const { data: categories = [] } = useCategories()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectMode, setSelectMode] = useState(false)
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false)
  const [bulkCategoryOpen, setBulkCategoryOpen] = useState(false)
  const [bulkCategoryId, setBulkCategoryId] = useState<string>('')
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
    setPage(1)
  }, [searchParams])

  // Take over the global mobile FAB so it opens the Add action sheet on this route.
  useEffect(() => {
    setFab(openAddSheet)
    return () => clearFab()
  }, [setFab, clearFab, openAddSheet])

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
  }

  const handleAddFromTemplate = () => {
    setTemplateSelectorOpen(true)
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

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
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

  const confirmBulkCategoryUpdate = async () => {
    try {
      const result = await bulkUpdateCategory.mutateAsync({
        ids: Array.from(selectedIds),
        categoryId: bulkCategoryId || null,
      })
      if (result.skipped > 0) {
        toast.warning(t('receipts.bulkCategoryPartial', { updated: result.updated, skipped: result.skipped }))
      } else {
        toast.success(t('receipts.bulkCategorySuccess', { updated: result.updated }))
      }
      setSelectedIds(new Set())
      setBulkCategoryOpen(false)
      setBulkCategoryId('')
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


  return (
    <AppLayout>
      <PageTransition>
      {/* Desktop sticky toolbar (breaks out of page padding to sit flush) */}
      <PageToolbar
        className="md:-mx-8 md:-mt-8 md:mb-6"
        title={t('receipts.title')}
        subtitle={
          <>
            {t('receipts.subtitle')}{' '}
            <Link to="/templates" className="text-primary hover:underline" data-testid="receipts-manage-templates-link">
              {t('receipts.manageTemplates')}
            </Link>
          </>
        }
        actions={
          <>
            <AddMenu
              onAddBlank={handleAddManually}
              onAddFromTemplate={handleAddFromTemplate}
              onImport={() => setImportDialogOpen(true)}
              onExport={handleExport}
            />
            <button
              type="button"
              onClick={openQrScanner}
              disabled={isCreating || isGalleryProcessing}
              className="btn-brand inline-flex h-10 items-center gap-2 rounded-full px-4 text-[15px] font-semibold text-white disabled:opacity-60"
              data-testid="receipts-scan-button"
            >
              {(isCreating || isGalleryProcessing) ? <Loader2 className="size-4 animate-spin" /> : <QrCode className="size-4" />}
              {t('receipts.scanQr')}
            </button>
          </>
        }
      />

      {/* Mobile interim title (replaced by the frosted header in Chunk 4b) */}
      <div className="mb-4 md:hidden" data-testid="receipts-title">
        <h1 className="t-h1 text-[28px]">{t('receipts.title')}</h1>
        <p className="t-sm mt-1 text-muted-foreground" data-testid="receipts-subtitle">
          {t('receipts.subtitle')}{' '}
          <Link to="/templates" className="text-primary hover:underline">{t('receipts.manageTemplates')}</Link>
        </p>
      </div>

      {/* Mobile quick-filter row (full frosted header lands in Chunk 4) */}
      <div className="mb-3 flex items-center gap-2 md:hidden">
        <div className="min-w-0 flex-1">
          <QuickChips filters={filters} categories={categories} onFiltersChange={handleFiltersChange} />
        </div>
        <button
          type="button"
          onClick={() => setFilterSheetOpen(true)}
          aria-label={t('receipts.filtersButton')}
          className="grid size-[42px] shrink-0 place-items-center rounded-[14px] border border-border bg-card text-fg-2 shadow-glass-1 transition-colors hover:bg-bg-subtle hover:text-foreground"
        >
          <SlidersHorizontal className="size-[18px]" />
        </button>
      </div>

      <div className="md:flex md:items-start md:gap-6">
        <FilterRail
          className="hidden md:flex"
          filters={filters}
          categories={categories}
          onFiltersChange={handleFiltersChange}
        />

        <div className="min-w-0 flex-1">
          {totalAmounts.length > 0 && !loading && receipts.length > 0 && (
            <ExpensesSummary
              totalAmounts={totalAmounts}
              total={meta?.total ?? 0}
              filtersActive={filtersActive}
              selectMode={selectMode}
              onToggleSelectMode={() => { setSelectMode((v) => !v); setSelectedIds(new Set()) }}
              rangeFrom={meta && !isMobile ? (meta.page - 1) * meta.limit + 1 : undefined}
              rangeTo={meta && !isMobile ? Math.min(meta.page * meta.limit, meta.total) : undefined}
            />
          )}

          {loading ? (
            <div className="flex flex-col gap-3" data-testid="receipts-loading">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[68px] animate-pulse rounded-2xl border border-border bg-bg-subtle" />
              ))}
            </div>
          ) : receipts.length === 0 ? (
            <div className="empty-state" data-testid="receipts-empty">
              <Camera className="empty-state-icon" />
              <h3 className="text-lg font-semibold mb-2">{t('receipts.noReceipts')}</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                {t('receipts.noReceiptsText')}
              </p>
              <Button variant="default" onClick={openQrScanner}>
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
                    variant="outline"
                    size="sm"
                    onClick={() => { setBulkCategoryId(''); setBulkCategoryOpen(true) }}
                  >
                    <Tag className="h-4 w-4" />
                    {t('receipts.assignCategory')}
                  </Button>
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

              <ExpenseFeed
                receipts={receipts}
                wide={!isMobile}
                selectMode={selectMode}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onView={handleViewReceipt}
                onEdit={handleEditReceipt}
                onDelete={handleDeleteReceipt}
              />

              {isMobile ? (
                inf.hasNextPage && (
                  <div className="flex justify-center py-4">
                    <Button
                      variant="outline"
                      className="rounded-full"
                      disabled={inf.isFetchingNextPage}
                      onClick={() => inf.fetchNextPage()}
                    >
                      {inf.isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin" />}
                      {t('receipts.loadMore')}
                    </Button>
                  </div>
                )
              ) : (
                meta && meta.totalPages > 1 && (
                  <div className="pt-3">
                    <Pagination
                      page={meta.page}
                      totalPages={meta.totalPages}
                      total={meta.total}
                      limit={meta.limit}
                      onPageChange={setPage}
                    />
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>

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

      <ImportGuideDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onDownloadTemplate={handleDownloadTemplate}
        onSelectFile={handleSelectImportFile}
        importing={importReceipts.isPending}
      />
      <input
        ref={importInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleImportFile}
        className="hidden"
      />

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

      <Dialog open={bulkCategoryOpen} onOpenChange={setBulkCategoryOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('receipts.assignCategory')}</DialogTitle>
            <DialogDescription>
              {t('receipts.bulkCategoryDescription', { count: selectedIds.size })}
            </DialogDescription>
          </DialogHeader>
          <Select value={bulkCategoryId} onValueChange={setBulkCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder={t('receipts.modal.selectCategory')} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.icon && <span className="mr-2">{category.icon}</span>}
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkCategoryOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={confirmBulkCategoryUpdate}
              disabled={!bulkCategoryId || bulkUpdateCategory.isPending}
            >
              {bulkUpdateCategory.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FilterSheet
        open={filterSheetOpen}
        onOpenChange={setFilterSheetOpen}
        filters={filters}
        categories={categories}
        onFiltersChange={handleFiltersChange}
        resultCount={meta?.total ?? 0}
      />

      <AddSheet
        open={addSheetOpen}
        onOpenChange={setAddSheetOpen}
        onScanQr={openQrScanner}
        onScanGallery={openGalleryScanner}
        onAddManually={handleAddManually}
        onAddFromTemplate={handleAddFromTemplate}
        onImportExport={() => setImportExportSheetOpen(true)}
      />
      <ImportExportSheet
        open={importExportSheetOpen}
        onOpenChange={setImportExportSheetOpen}
        onImport={() => setImportDialogOpen(true)}
        onExport={handleExport}
      />
      </PageTransition>
    </AppLayout>
  )
}
