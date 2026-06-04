import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Wallet, Tag, CircleDollarSign, type LucideIcon } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { PageToolbar } from '@/components/layout/page-toolbar'
import { PageTransition } from '@/components/ui/animated'
import { GlassDialog } from '@/components/glass/glass-dialog'
import { EmptyState, AddButton } from '@/components/glass/empty-state'
import { CategoryModal } from '@/components/categories/category-modal'
import { CategoryDeleteModal } from '@/components/categories/category-delete-modal'
import { CategoryList, RowActionList } from '@/components/categories/primitives'
import { useCategories, type Category } from '@/hooks/categories/use-categories'
import { useSettingsStore } from '@/store/settings'
import { useExchangeRates } from '@/hooks/currencies/use-currency-converter'
import { useIsMobile } from '@/hooks/use-mobile'
import { useFabStore } from '@/store/fab'
import { cn, formatMoney } from '@/lib/utils'

function OverviewStat({ icon: Icon, iconClass, label, value }: { icon: LucideIcon; iconClass?: string; label: string; value: React.ReactNode }) {
  return (
    <div className="flex min-w-[180px] flex-1 items-center gap-3">
      <span className={cn('grid size-[42px] shrink-0 place-items-center rounded-xl', iconClass || 'bg-bg-subtle text-fg-2')}>
        <Icon className="size-[19px]" />
      </span>
      <div className="min-w-0">
        <div className="text-[12px] font-semibold text-muted-foreground">{label}</div>
        <div className="text-[21px] font-extrabold tracking-[-0.01em] tabular-nums">{value}</div>
      </div>
    </div>
  )
}

function SummaryPill({ count, label }: { count: number; label: string }) {
  return (
    <span className="inline-flex h-[26px] items-center gap-1 rounded-full bg-bg-subtle px-[11px] text-[12px] font-semibold text-muted-foreground">
      <b className="font-extrabold tabular-nums text-foreground">{count}</b> {label}
    </span>
  )
}

export default function Categories() {
  const { t } = useTranslation()
  const isMobile = useIsMobile(768)
  const { currency: preferredCurrency } = useSettingsStore()
  const displayCurrency = preferredCurrency || 'RSD'
  const { data: exchangeRates } = useExchangeRates(displayCurrency)

  const { data: categories, isLoading, error } = useCategories()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [actionsCategory, setActionsCategory] = useState<Category | null>(null)

  const handleAdd = useCallback(() => {
    setSelectedCategory(null)
    setModalMode('create')
    setIsModalOpen(true)
  }, [])

  // Take over the global mobile FAB so it opens the Add form directly.
  const setFab = useFabStore((s) => s.setFab)
  const clearFab = useFabStore((s) => s.clearFab)
  useEffect(() => {
    setFab(handleAdd)
    return () => clearFab()
  }, [setFab, clearFab, handleAdd])

  const handleEdit = (category: Category) => {
    setSelectedCategory(category)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleDelete = (category: Category) => {
    setCategoryToDelete(category)
    setDeleteModalOpen(true)
  }

  const openActions = (category: Category) => {
    setActionsCategory(category)
    setActionsOpen(true)
  }

  const convertAmount = useCallback(
    (amount: number, fromCurrency: string): number => {
      if (fromCurrency === displayCurrency || !exchangeRates) return amount
      const rate = exchangeRates[fromCurrency]
      if (!rate || rate === 0) return amount
      return amount / rate
    },
    [displayCurrency, exchangeRates],
  )

  const fmtTotal = (amount: number) => formatMoney(amount, displayCurrency)

  const list = categories ?? []
  const budgeted = list.filter((c) => c.monthlyBudget && c.monthlyBudget > 0)
  const unbudgeted = list.length - budgeted.length
  const monthlyTotal = budgeted.reduce((sum, c) => sum + convertAmount(c.monthlyBudget!, c.budgetCurrency || 'RSD'), 0)
  const mixedCurrencies = new Set(budgeted.map((c) => c.budgetCurrency || 'RSD')).size > 1

  const header = (
    <>
      <PageToolbar
        className="md:-mx-8 md:-mt-8 md:mb-6"
        title={t('categories.title')}
        subtitle={t('categories.desktopSubtitle')}
        actions={<AddButton onClick={handleAdd} label={t('categories.addCategory')} data-testid="categories-add-button" />}
      />
      <div className="mb-1 flex items-end justify-between md:hidden">
        <div>
          <h1 className="t-h1 text-[28px]">{t('categories.title')}</h1>
          <p className="mt-1 text-[12.5px] text-muted-foreground">{t('categories.mobileSubtitle')}</p>
        </div>
        <AddButton onClick={handleAdd} label={t('categories.add')} className="h-[38px] px-3.5" />
      </div>
    </>
  )

  return (
    <AppLayout>
      <PageTransition>
        {header}

        {isLoading ? (
          <div className="mt-4 flex flex-col gap-4 md:mt-0">
            <div className="h-[84px] animate-pulse rounded-2xl border border-border bg-bg-subtle" />
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex min-h-[80px] items-center gap-3.5 border-b border-hairline-soft px-4 last:border-0">
                  <div className="size-12 shrink-0 animate-pulse rounded-full bg-bg-subtle" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-2/5 animate-pulse rounded bg-bg-subtle" />
                    <div className="h-3 w-3/5 animate-pulse rounded bg-bg-subtle" />
                    <div className="h-3 w-24 animate-pulse rounded bg-bg-subtle" />
                  </div>
                  <div className="size-[18px] shrink-0 animate-pulse rounded bg-bg-subtle" />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="mt-4 grid place-items-center rounded-2xl border border-border bg-card px-6 py-12 text-center shadow-glass-1 md:mt-0">
            <p className="text-sm text-destructive">
              {t('categories.loadError', { message: error instanceof Error ? error.message : 'Unknown error' })}
            </p>
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            className="mt-4 md:mt-0"
            data-testid="categories-empty"
            icon={Tag}
            title={t('categories.empty.title')}
            description={t('categories.empty.description')}
            action={<AddButton onClick={handleAdd} label={t('categories.empty.cta')} />}
          />
        ) : (
          <>
            {/* Budget overview — desktop */}
            <div className="mb-5 hidden items-center gap-2 rounded-2xl border border-border bg-card/[0.74] p-[18px] shadow-glass-1 [backdrop-filter:blur(20px)_saturate(1.4)] [-webkit-backdrop-filter:blur(20px)_saturate(1.4)] md:flex">
              <OverviewStat
                icon={Wallet}
                iconClass="bg-primary-soft text-primary"
                label={t('categories.summary.monthlyBudget')}
                value={fmtTotal(monthlyTotal)}
              />
              <div className="mx-2 my-1 w-px self-stretch bg-hairline-soft" />
              <OverviewStat icon={Tag} label={t('categories.summary.categoriesLabel')} value={list.length} />
              <div className="mx-2 my-1 w-px self-stretch bg-hairline-soft" />
              <OverviewStat
                icon={CircleDollarSign}
                label={t('categories.summary.budgetedNoBudget')}
                value={<>{budgeted.length} <span className="text-fg-faint">· {unbudgeted}</span></>}
              />
            </div>

            {/* Summary strip — mobile */}
            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3.5 rounded-2xl border border-border bg-card px-[18px] py-4 shadow-glass-1 md:hidden">
              <div className="flex flex-col gap-[3px]">
                <span className="text-[12px] font-semibold text-muted-foreground">{t('categories.summary.monthlyBudget')}</span>
                <span className="text-[24px] font-extrabold leading-[1.05] tracking-[-0.015em] tabular-nums">{fmtTotal(monthlyTotal)}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <SummaryPill count={list.length} label={t('categories.summary.categoriesPill')} />
                <SummaryPill count={budgeted.length} label={t('categories.summary.budgetedPill')} />
              </div>
            </div>

            {mixedCurrencies && (
              <p className="mt-2 px-1 text-[11px] text-fg-faint">{t('receipts.convertedDisclaimer')}</p>
            )}

            {/* Section label */}
            <div className="mb-3.5 mt-4 flex items-baseline justify-between px-1">
              <span className="t-xs md:hidden">{t('categories.allCategories')}</span>
              <div className="hidden items-baseline gap-2 md:flex">
                <span className="text-[14px] font-semibold">{t('categories.allCategories')}</span>
                <span className="text-[13px] text-muted-foreground">· {list.length}</span>
              </div>
              <span className="text-[12px] text-muted-foreground md:hidden">{t('categories.totalCount', { count: list.length })}</span>
            </div>

            <CategoryList
              categories={list}
              wide={!isMobile}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onOpenActions={openActions}
            />

            <p className="py-4 text-center text-[12px] text-fg-faint md:hidden">{t('categories.footerHint')}</p>
          </>
        )}
      </PageTransition>

      {/* Create / Edit form */}
      <CategoryModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        category={selectedCategory}
        mode={modalMode}
        onRequestDelete={handleDelete}
      />

      {/* Delete flow (reassign / simple confirm) */}
      <CategoryDeleteModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        category={categoryToDelete}
        onDeleted={() => {
          setCategoryToDelete(null)
          setDeleteModalOpen(false)
        }}
      />

      {/* Mobile row action sheet */}
      {actionsCategory && (
        <GlassDialog
          open={actionsOpen}
          onOpenChange={setActionsOpen}
          title={actionsCategory.name}
          description={actionsCategory.description || t('categories.noDescription')}
          bodyClassName="py-3"
        >
          <RowActionList
            category={actionsCategory}
            onEdit={(c) => {
              setActionsOpen(false)
              handleEdit(c)
            }}
            onDelete={(c) => {
              setActionsOpen(false)
              handleDelete(c)
            }}
          />
        </GlassDialog>
      )}
    </AppLayout>
  )
}
