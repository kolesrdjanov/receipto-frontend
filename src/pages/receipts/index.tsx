import { useState, lazy, Suspense, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { AppLayout } from '@/components/layout/app-layout'
const ReceiptModal = lazy(() => import('@/components/receipts/receipt-modal').then(m => ({ default: m.ReceiptModal })))
const TemplateSelectorModal = lazy(() => import('@/components/receipts/template-selector-modal').then(m => ({ default: m.TemplateSelectorModal })))
const ReceiptViewerModal = lazy(() => import('@/components/receipts/receipt-viewer-modal').then(m => ({ default: m.ReceiptViewerModal })))
import { FilterRail } from '@/components/receipts/filter-rail'
import { FilterSheet } from '@/components/receipts/filter-sheet'
import { PageToolbar } from '@/components/layout/page-toolbar'
import { AddMenu, AddSheet, ImportExportSheet } from '@/components/receipts/add-menu'
import { ImportGuideDialog } from '@/components/receipts/import-guide-dialog'
import { BulkBar } from '@/components/receipts/bulk-bar'
import { AssignCategoryDialog } from '@/components/receipts/assign-category-dialog'
import { useCurrencyConverter } from '@/hooks/currencies/use-currency-converter'
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
import { ExpensesMobileHeader } from '@/components/receipts/expenses-mobile-header'
import { ExpensesSummary } from '@/components/receipts/expenses-summary'
import { EmptyState } from '@/components/glass/empty-state'
import { Loader2, QrCode, Receipt as ReceiptIcon } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/api'

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
  // Sort: order toggles between Newest (receiptDate DESC) and Oldest (ASC) via the mobile "…" menu.
  const sortBy: 'receiptDate' | 'createdAt' = 'receiptDate'
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC')
  const toggleSort = () => { setSortOrder((o) => (o === 'DESC' ? 'ASC' : 'DESC')); setPage(1) }

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

  // Honor ?action=scan|add routed here by the global mobile FAB Add/Scan sheet, then
  // strip the param so it doesn't re-fire.
  useEffect(() => {
    const action = searchParams.get('action')
    if (action !== 'scan' && action !== 'add') return
    if (action === 'scan') openQrScanner()
    else handleAddManually()
    const next = new URLSearchParams(searchParams)
    next.delete('action')
    setSearchParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

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
      const errorMessage = getErrorMessage(error)
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

  const { convert, preferredCurrency } = useCurrencyConverter()

  // Select-all toggles every currently-loaded row (desktop = page, mobile = all loaded).
  const currentPageIds = receipts.map((r) => r.id)
  const allSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.has(id))
  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (currentPageIds.every((id) => prev.has(id))) currentPageIds.forEach((id) => next.delete(id))
      else currentPageIds.forEach((id) => next.add(id))
      return next
    })
  }

  // Converted sum of selected (loaded) rows — see plan D5 for the desktop cross-page caveat.
  const selectedTotal = receipts.reduce(
    (s, r) => (selectedIds.has(r.id) ? s + convert(Number(r.totalAmount) || 0, r.currency || 'RSD') : s),
    0,
  )

  // Smart-open (D1): hasJournal → viewer, else editable → edit, else locked toast.
  const handleOpenReceipt = (r: Receipt) => {
    if (r.hasJournal) { handleViewReceipt(r); return }
    if (r.group?.isArchived) { toast.info(t('receipts.archivedGroupLocked')); return }
    if (r.status === 'recurring') { toast.info(t('receipts.recurringLocked')); return }
    handleEditReceipt(r)
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
      const errorMessage = getErrorMessage(error)
      toast.error(errorMessage)
    }
  }

  const confirmBulkCategoryUpdate = async (categoryId: string) => {
    try {
      const result = await bulkUpdateCategory.mutateAsync({
        ids: Array.from(selectedIds),
        categoryId,
      })
      if (result.skipped > 0) {
        toast.warning(t('receipts.bulkCategoryPartial', { updated: result.updated, skipped: result.skipped }))
      } else {
        toast.success(t('receipts.bulkCategorySuccess', { updated: result.updated }))
      }
      setSelectedIds(new Set())
      setBulkCategoryOpen(false)
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      toast.error(errorMessage)
    }
  }

  const handleExport = async () => {
    try {
      await exportReceipts.mutateAsync()
      toast.success(t('receipts.export.success'))
    } catch (error) {
      const errorMessage = getErrorMessage(error)
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
      const errorMessage = getErrorMessage(error)
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
            <Button
              type="button"
              variant="brand"
              onClick={openQrScanner}
              loading={isCreating || isGalleryProcessing}
              className="h-10 rounded-full px-4 text-[15px] font-semibold disabled:opacity-60"
              data-testid="receipts-scan-button"
            >
              <QrCode className="size-4" />
              {t('receipts.scanQr')}
            </Button>
          </>
        }
      />

      {/* Mobile frosted page header (replaces the global mobile header on this route) */}
      <ExpensesMobileHeader
        totalAmounts={totalAmounts}
        count={meta?.total ?? 0}
        hasReceipts={!loading && receipts.length > 0}
        filters={filters}
        categories={categories}
        onFiltersChange={handleFiltersChange}
        onOpenFilters={() => setFilterSheetOpen(true)}
        selectMode={selectMode}
        onToggleSelectMode={() => { setSelectMode((v) => !v); setSelectedIds(new Set()) }}
        sortOrder={sortOrder}
        onToggleSort={toggleSort}
        onImportExport={() => setImportExportSheetOpen(true)}
        selectedCount={selectedIds.size}
        allSelected={allSelected}
        onToggleSelectAll={toggleSelectAll}
      />

      <div className="md:flex md:items-start md:gap-6">
        <FilterRail
          className="hidden md:flex"
          filters={filters}
          categories={categories}
          onFiltersChange={handleFiltersChange}
        />

        <div className="min-w-0 flex-1">
          {!isMobile && totalAmounts.length > 0 && !loading && receipts.length > 0 && (
            <ExpensesSummary
              totalAmounts={totalAmounts}
              total={meta?.total ?? 0}
              filtersActive={filtersActive}
              selectMode={selectMode}
              onToggleSelectMode={() => { setSelectMode((v) => !v); setSelectedIds(new Set()) }}
              rangeFrom={meta && !isMobile ? (meta.page - 1) * meta.limit + 1 : undefined}
              rangeTo={meta && !isMobile ? Math.min(meta.page * meta.limit, meta.total) : undefined}
              selectedCount={selectedIds.size}
              selectedTotal={selectedTotal}
            />
          )}

          {loading ? (
            <div className="flex flex-col gap-3" data-testid="receipts-loading">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[68px] animate-pulse rounded-2xl border border-border bg-bg-subtle" />
              ))}
            </div>
          ) : receipts.length === 0 ? (
            <EmptyState
              data-testid="receipts-empty"
              icon={ReceiptIcon}
              title={t('receipts.noReceipts')}
              description={t('receipts.noReceiptsText')}
              action={
                <Button
                  type="button"
                  variant="brand"
                  onClick={openQrScanner}
                  className="h-[52px] rounded-full px-6 text-base font-semibold [&_svg]:size-[18px]"
                >
                  <QrCode />
                  {t('receipts.scanReceipt')}
                </Button>
              }
            />
          ) : (
            <>
              <ExpenseFeed
                receipts={receipts}
                wide={!isMobile}
                selectMode={selectMode}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onOpen={handleOpenReceipt}
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
            onRequestDelete={handleDeleteReceipt}
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
            lockReason={
              viewerReceiptFull?.group?.isArchived
                ? t('receipts.archivedGroupLocked')
                : viewerReceiptFull?.status === 'recurring'
                  ? t('receipts.recurringLocked')
                  : undefined
            }
            onEdit={
              viewerReceiptFull
                ? () => {
                    setViewerOpen(false)
                    handleEditReceipt(viewerReceiptFull)
                  }
                : undefined
            }
            onDelete={
              viewerReceiptFull
                ? () => {
                    setViewerOpen(false)
                    setReceiptToDelete(viewerReceiptFull)
                  }
                : undefined
            }
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

      <AssignCategoryDialog
        open={bulkCategoryOpen}
        onOpenChange={setBulkCategoryOpen}
        categories={categories}
        count={selectedIds.size}
        onAssign={confirmBulkCategoryUpdate}
        isLoading={bulkUpdateCategory.isPending}
      />

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

      <BulkBar
        count={selectedIds.size}
        total={selectedTotal}
        currency={preferredCurrency}
        allSelected={allSelected}
        onToggleSelectAll={toggleSelectAll}
        onAssign={() => setBulkCategoryOpen(true)}
        onRemove={() => setBulkDeleteConfirmOpen(true)}
        onClear={() => setSelectedIds(new Set())}
        removing={bulkDelete.isPending}
      />
      </PageTransition>
    </AppLayout>
  )
}
