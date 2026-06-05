import { useState, useEffect, useCallback, lazy, Suspense, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Download,
  Upload,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { AppLayout } from '@/components/layout/app-layout'
import { PageToolbar } from '@/components/layout/page-toolbar'
import { PageTransition } from '@/components/ui/animated'
import { Button } from '@/components/ui/button'
import { GlassDialog } from '@/components/glass/glass-dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { WarrantyGrid, StatusTabs, CardActionList } from '@/components/warranties/primitives'
import { sortWarranties } from '@/components/warranties/warranty-view'
import {
  useWarranties,
  useWarrantyStats,
  useExportWarranties,
  useImportWarranties,
  useDeleteWarranty,
  type Warranty,
} from '@/hooks/warranties/use-warranties'
import { WarrantyImportDialog } from '@/components/warranties/warranty-import-dialog'
import { EmptyState, AddButton } from '@/components/glass/empty-state'
import { useFabStore } from '@/store/fab'
import { cn } from '@/lib/utils'

const WarrantyModal = lazy(() =>
  import('@/components/warranties/warranty-modal').then((m) => ({ default: m.WarrantyModal })),
)
const WarrantyGalleryModal = lazy(() =>
  import('@/components/warranties/warranty-gallery-modal').then((m) => ({ default: m.WarrantyGalleryModal })),
)

type TabKey = 'all' | 'active' | 'expiring' | 'expired'

const CSV_TEMPLATE = `productName,storeName,purchaseDate,warrantyExpires,warrantyDuration,notes,fileUrls
"Samsung TV 55""","Gigatron",2024-01-15,2026-01-15,24,"Living room TV",""
"iPhone 15 Pro","iStyle",2024-03-20,,24,"Personal phone","https://example.com/warranty1.jpg"
"Bosch Washing Machine","Tehnomanija",2024-02-10,2027-02-10,36,"","https://example.com/doc1.pdf;https://example.com/doc2.jpg"
`

const STAT_TONE: Record<string, { tile: string; num: string }> = {
  total: { tile: 'bg-bg-subtle text-foreground', num: 'text-foreground' },
  active: { tile: 'bg-success-soft text-success-foreground', num: 'text-success-foreground' },
  expiring: { tile: 'bg-warning-soft text-warning-foreground', num: 'text-warning-foreground' },
  expired: { tile: 'bg-destructive-soft text-[color:var(--destructive-foreground-on-soft)]', num: 'text-destructive' },
}

function StatCard({ label, value, icon: Icon, tone }: { label: string; value: number; icon: LucideIcon; tone: keyof typeof STAT_TONE }) {
  const s = STAT_TONE[tone]
  return (
    <div className="rounded-2xl border border-border bg-card p-[18px] shadow-glass-1">
      <div className="flex items-start justify-between">
        <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
        <span className={cn('grid size-8 place-items-center rounded-lg', s.tile)}>
          <Icon className="size-[17px]" />
        </span>
      </div>
      <div className={cn('mt-2 text-[30px] font-extrabold leading-none', s.num)}>{value}</div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-[18px] border border-border bg-card p-[18px] shadow-glass-1">
      <div className="flex items-start gap-3">
        <div className="size-[46px] shrink-0 animate-pulse rounded-[13px] bg-bg-subtle" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3.5 w-3/5 animate-pulse rounded bg-bg-subtle" />
          <div className="h-3 w-2/5 animate-pulse rounded bg-bg-subtle" />
        </div>
        <div className="h-5 w-16 animate-pulse rounded-full bg-bg-subtle" />
      </div>
      <div className="mt-5 h-[7px] w-full animate-pulse rounded-full bg-bg-subtle" />
      <div className="mt-4 h-[54px] w-32 animate-pulse rounded-xl bg-bg-subtle" />
    </div>
  )
}

export default function WarrantiesPage() {
  const { t } = useTranslation()

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedWarranty, setSelectedWarranty] = useState<Warranty | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [galleryTitle, setGalleryTitle] = useState('')
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [warrantyToDelete, setWarrantyToDelete] = useState<Warranty | null>(null)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [actionsWarranty, setActionsWarranty] = useState<Warranty | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  const { data: allWarranties = [], isLoading } = useWarranties()
  const { data: activeWarranties = [] } = useWarranties('active')
  const { data: expiredWarranties = [] } = useWarranties('expired')
  const { data: expiringWarranties = [] } = useWarranties('expiring')
  const { data: stats } = useWarrantyStats()

  const exportWarranties = useExportWarranties()
  const importWarranties = useImportWarranties()
  const deleteWarranty = useDeleteWarranty()

  const handleAdd = useCallback(() => {
    setSelectedWarranty(null)
    setModalMode('create')
    setModalOpen(true)
  }, [])

  // Take over the global mobile FAB so it opens the Add sheet directly.
  const setFab = useFabStore((s) => s.setFab)
  const clearFab = useFabStore((s) => s.clearFab)
  useEffect(() => {
    setFab(handleAdd)
    return () => clearFab()
  }, [setFab, clearFab, handleAdd])

  const handleEdit = (warranty: Warranty) => {
    setSelectedWarranty(warranty)
    setModalMode('edit')
    setModalOpen(true)
  }

  const openGallery = (warranty: Warranty, index: number) => {
    const imgs = (warranty.files || []).map((f) => f.url)
    if (imgs.length === 0) return
    setGalleryImages(imgs)
    setGalleryTitle(warranty.productName)
    setGalleryIndex(Math.min(Math.max(index, 0), imgs.length - 1))
    setGalleryOpen(true)
  }

  const handleDelete = (warranty: Warranty) => {
    setWarrantyToDelete(warranty)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!warrantyToDelete) return
    try {
      await deleteWarranty.mutateAsync(warrantyToDelete.id)
      toast.success(t('warranties.modal.deleteSuccess'))
      setWarrantyToDelete(null)
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'An error occurred'
      toast.error(t('warranties.modal.deleteError'), { description: msg })
    }
  }

  const openActions = (warranty: Warranty) => {
    setActionsWarranty(warranty)
    setActionsOpen(true)
  }

  const handleExport = async () => {
    try {
      await exportWarranties.mutateAsync()
      toast.success(t('warranties.export.success'))
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'An error occurred'
      toast.error(t('warranties.export.error'), { description: msg })
    }
  }

  const handleDownloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'warranties-template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const result = await importWarranties.mutateAsync(file)
      if (result.errors.length === 0) {
        toast.success(t('warranties.import.success', { count: result.imported }))
      } else if (result.imported > 0) {
        toast.warning(t('warranties.import.partialSuccess', { imported: result.imported, total: result.total }), {
          description: `${result.errors.length} ${t('warranties.import.errorsOccurred')}`,
        })
      } else {
        toast.error(t('warranties.import.error'), { description: result.errors[0]?.message || 'Unknown error' })
      }
      setImportDialogOpen(false)
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'An error occurred'
      toast.error(t('warranties.import.error'), { description: msg })
    }
    if (importInputRef.current) importInputRef.current.value = ''
  }

  const getWarrantiesForTab = (): Warranty[] => {
    switch (activeTab) {
      case 'active':
        return activeWarranties
      case 'expiring':
        return expiringWarranties
      case 'expired':
        return expiredWarranties
      default:
        return allWarranties
    }
  }

  const counts: Record<TabKey, number> = {
    all: allWarranties.length,
    active: activeWarranties.length,
    expiring: expiringWarranties.length,
    expired: expiredWarranties.length,
  }
  const list = sortWarranties(getWarrantiesForTab())

  const gridHandlers = {
    onEdit: handleEdit,
    onOpenFile: openGallery,
    onViewFiles: (w: Warranty) => openGallery(w, 0),
    onDelete: handleDelete,
    onOpenActions: openActions,
  }

  const desktopActions = (
    <>
      <Button variant="outline" size="sm" className="h-10" onClick={handleExport} disabled={exportWarranties.isPending}>
        <Download className="size-4" />
        {t('warranties.export.button')}
      </Button>
      <Button variant="outline" size="sm" className="h-10" onClick={() => setImportDialogOpen(true)} disabled={importWarranties.isPending}>
        <Upload className="size-4" />
        {t('warranties.import.button')}
      </Button>
      <AddButton onClick={handleAdd} label={t('warranties.addWarranty')} />
    </>
  )

  return (
    <AppLayout>
      <PageTransition>
        {/* Desktop sticky toolbar (full-bleed) */}
        <PageToolbar
          className="md:-mx-8 md:-mt-8 md:mb-6"
          title={t('warranties.title')}
          subtitle={t('warranties.desktopSubtitle')}
          actions={desktopActions}
        />

        {/* Mobile header */}
        <div className="mb-5 flex items-start justify-between gap-3 md:hidden">
          <div className="min-w-0">
            <h1 className="t-h1 text-[28px]">{t('warranties.title')}</h1>
            <p className="t-sm mt-1 text-muted-foreground">{t('warranties.mobileSubtitle')}</p>
          </div>
          <AddButton onClick={handleAdd} label={t('common.add', { defaultValue: 'Add' })} className="h-[38px] px-3.5" />
        </div>

        {isLoading ? (
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : allWarranties.length === 0 ? (
          <EmptyState
            icon={Shield}
            title={t('warranties.noWarranties')}
            description={t('warranties.noWarrantiesText')}
            action={<AddButton onClick={handleAdd} label={t('warranties.addWarranty')} />}
          />
        ) : (
          <>
            {/* Desktop stat cards */}
            {stats && (
              <div className="mb-6 hidden gap-4 md:grid md:grid-cols-4">
                <StatCard label={t('warranties.stats.total')} value={stats.total} icon={Shield} tone="total" />
                <StatCard label={t('warranties.stats.active')} value={stats.active} icon={ShieldCheck} tone="active" />
                <StatCard label={t('warranties.stats.expiringSoon')} value={stats.expiringSoon} icon={ShieldAlert} tone="expiring" />
                <StatCard label={t('warranties.stats.expired')} value={stats.expired} icon={ShieldX} tone="expired" />
              </div>
            )}

            {/* Mobile summary strip */}
            {stats && (
              <div className="mb-5 rounded-2xl border border-border bg-card p-4 shadow-glass-1 md:hidden">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="t-xs text-fg-faint">{t('warranties.tracked')}</span>
                    <span className="flex items-baseline gap-1.5">
                      <span className="text-[30px] font-extrabold leading-none">{stats.total}</span>
                      {/*<span className="text-[12px] text-muted-foreground">{t('warranties.warrantiesLabel')}</span>*/}
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <span className="inline-flex h-7 items-center gap-1 rounded-full bg-success-soft px-2.5 text-[11.5px] font-medium text-success-foreground">
                      <b>{stats.active}</b> {t('warranties.countActive')}
                    </span>
                    <span className="inline-flex h-7 items-center gap-1 rounded-full bg-warning-soft px-2.5 text-[11.5px] font-medium text-warning-foreground">
                      <b>{stats.expiringSoon}</b> {t('warranties.countExpiring')}
                    </span>
                    <span className="inline-flex h-7 items-center gap-1 rounded-full bg-destructive-soft px-2.5 text-[11.5px] font-medium text-[color:var(--destructive-foreground-on-soft)]">
                      <b>{stats.expired}</b> {t('warranties.countExpired')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Filter row */}
            <div className="mb-4 flex items-center justify-between gap-3">
              <StatusTabs value={activeTab} counts={counts} onChange={setActiveTab} />
              <span className="hidden shrink-0 text-[12.5px] text-muted-foreground md:inline">
                {t('warranties.warrantyCount', { count: list.length })} · {t('warranties.sortedByExpiry')}
              </span>
            </div>

            {/* Grid */}
            {list.length === 0 ? (
              <EmptyState compact icon={Shield} title={t('warranties.noWarranties')} />
            ) : (
              <WarrantyGrid items={list} wide {...gridHandlers} />
            )}

            <p className="py-4 text-center text-[12px] text-fg-faint md:hidden">{t('warranties.tapHint')}</p>
          </>
        )}
      </PageTransition>

      {/* Hidden CSV input (triggered from the import dialog) */}
      <input
        ref={importInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleImportFile}
        className="hidden"
      />

      {/* Import guide */}
      <WarrantyImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onDownloadTemplate={handleDownloadTemplate}
        onSelectFile={() => importInputRef.current?.click()}
        importing={importWarranties.isPending}
      />

      {/* Add / Edit */}
      <Suspense fallback={null}>
        {modalOpen && (
          <WarrantyModal
            open={modalOpen}
            onOpenChange={setModalOpen}
            warranty={selectedWarranty}
            mode={modalMode}
            onRequestDelete={handleDelete}
          />
        )}
      </Suspense>

      {/* Gallery */}
      <Suspense fallback={null}>
        {galleryOpen && (
          <WarrantyGalleryModal
            open={galleryOpen}
            onOpenChange={setGalleryOpen}
            title={galleryTitle}
            images={galleryImages}
            initialIndex={galleryIndex}
          />
        )}
      </Suspense>

      {/* Delete confirm (shared, responsive) */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={confirmDelete}
        title={t('warranties.modal.deleteConfirmTitle')}
        description={t('warranties.modal.deleteConfirmDescription', { name: warrantyToDelete?.productName || '' })}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="destructive"
        isLoading={deleteWarranty.isPending}
      />

      {/* Mobile card action sheet */}
      {actionsWarranty && (
        <GlassDialog
          open={actionsOpen}
          onOpenChange={setActionsOpen}
          title={actionsWarranty.productName}
          description={actionsWarranty.storeName || undefined}
          bodyClassName="py-3"
        >
          <CardActionList
            hasFiles={(actionsWarranty.files?.length ?? 0) > 0}
            onViewFiles={() => {
              setActionsOpen(false)
              openGallery(actionsWarranty, 0)
            }}
            onEdit={() => {
              setActionsOpen(false)
              handleEdit(actionsWarranty)
            }}
            onDelete={() => {
              setActionsOpen(false)
              handleDelete(actionsWarranty)
            }}
          />
        </GlassDialog>
      )}
    </AppLayout>
  )
}
