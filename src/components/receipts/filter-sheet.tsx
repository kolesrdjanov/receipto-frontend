import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { FilterChip } from '@/components/receipts/filter-chip'
import { activeDatePreset, thisMonthRange, last30DaysRange } from '@/lib/filter-presets'
import type { Category } from '@/hooks/categories/use-categories'
import type { ReceiptsFilters } from '@/hooks/receipts/use-receipts'

const SHEET_EASE: [number, number, number, number] = [0.2, 0.8, 0.2, 1]

interface FilterSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: ReceiptsFilters
  categories: Category[]
  onFiltersChange: (filters: ReceiptsFilters) => void
  /** Whole-filtered-set count for the "Show N results" button. */
  resultCount: number
}

function Section({ label, last, children }: { label: string; last?: boolean; children: ReactNode }) {
  return (
    <div className={last ? '' : 'mb-4 border-b border-hairline-soft pb-4'}>
      <div className="mb-[11px] text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-faint">{label}</div>
      {children}
    </div>
  )
}

function SheetAmountInput({ placeholder, value, onChange }: { placeholder: string; value?: number; onChange: (v: string) => void }) {
  return (
    <div className="flex h-[50px] flex-1 items-center rounded-[14px] border border-border bg-bg-subtle/65 px-3.5 transition-[border-color,box-shadow] focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15 dark:bg-input/55">
      <input
        type="number"
        min={0}
        inputMode="numeric"
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 bg-transparent text-[15px] font-medium text-foreground outline-none placeholder:text-fg-faint"
      />
    </div>
  )
}

export function FilterSheet({ open, onOpenChange, filters, categories, onFiltersChange, resultCount }: FilterSheetProps) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const preset = activeDatePreset(filters)

  const toggleCategory = (id: string) =>
    onFiltersChange({ ...filters, categoryId: filters.categoryId === id ? undefined : id })
  const setAmount = (key: 'minAmount' | 'maxAmount', v: string) =>
    onFiltersChange({ ...filters, [key]: v ? Number(v) : undefined })
  const setDate = (key: 'startDate' | 'endDate', v: string) =>
    onFiltersChange({ ...filters, [key]: v || undefined })

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-[oklch(0_0_0/0.45)] dark:bg-[oklch(0_0_0/0.55)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.2 }}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild forceMount aria-describedby={undefined} onOpenAutoFocus={(e) => e.preventDefault()}>
              <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center">
                <motion.div
                  className="pointer-events-auto flex max-h-[88vh] w-full flex-col rounded-t-[28px] border-t border-border bg-card px-0 pt-3 pb-[calc(20px+env(safe-area-inset-bottom))] shadow-[0_-10px_44px_oklch(0_0_0/0.18)] dark:shadow-[0_-10px_44px_oklch(0_0_0/0.6)]"
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ duration: reduceMotion ? 0 : 0.3, ease: SHEET_EASE }}
                >
                  <div className="mx-auto mb-3.5 h-[5px] w-9 shrink-0 rounded-full bg-border" />
                  <DialogPrimitive.Title className="shrink-0 px-[22px] text-[19px] font-semibold">{t('receipts.filters.title')}</DialogPrimitive.Title>

                  <div className="min-h-0 flex-1 overflow-y-auto px-[22px] pt-4">
                    <Section label={t('receipts.filters.category')}>
                      <div className="flex flex-wrap gap-2">
                        {categories.map((c) => (
                          <FilterChip
                            key={c.id}
                            tone="soft"
                            label={c.name}
                            icon={c.icon ? <span className="text-sm leading-none">{c.icon}</span> : undefined}
                            active={filters.categoryId === c.id}
                            onClick={() => toggleCategory(c.id)}
                          />
                        ))}
                      </div>
                    </Section>

                    <Section label={t('receipts.filters.amount')}>
                      <div className="flex items-center gap-2">
                        <SheetAmountInput placeholder={t('receipts.filters.min')} value={filters.minAmount} onChange={(v) => setAmount('minAmount', v)} />
                        <span className="text-fg-faint">–</span>
                        <SheetAmountInput placeholder={t('receipts.filters.maxAmountPlaceholder')} value={filters.maxAmount} onChange={(v) => setAmount('maxAmount', v)} />
                      </div>
                    </Section>

                    <Section label={t('receipts.filters.dateRange')} last>
                      <div className="mb-3 flex flex-wrap gap-2">
                        <FilterChip tone="soft" label={t('receipts.filters.thisMonth')} active={preset === 'thisMonth'} onClick={() => onFiltersChange({ ...filters, ...thisMonthRange() })} />
                        <FilterChip tone="soft" label={t('receipts.filters.last30Days')} active={preset === 'last30Days'} onClick={() => onFiltersChange({ ...filters, ...last30DaysRange() })} />
                        <FilterChip tone="soft" label={t('receipts.filters.custom')} active={preset === 'custom'} onClick={() => { if (preset !== 'custom') onFiltersChange({ ...filters, startDate: undefined, endDate: undefined }) }} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <DatePicker value={filters.startDate ?? ''} onChange={(v) => setDate('startDate', v)} placeholder={t('receipts.filters.fromDate')} />
                        <DatePicker value={filters.endDate ?? ''} onChange={(v) => setDate('endDate', v)} placeholder={t('receipts.filters.toDate')} />
                      </div>
                    </Section>
                  </div>

                  <div className="flex shrink-0 gap-2 px-[22px] pt-4">
                    <Button variant="ghost" className="flex-1 rounded-full" onClick={() => onFiltersChange({})}>
                      {t('receipts.filters.clearAll')}
                    </Button>
                    <Button className="flex-1 rounded-full" onClick={() => onOpenChange(false)}>
                      {t('receipts.filters.showResults', { count: resultCount })}
                    </Button>
                  </div>
                </motion.div>
              </div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  )
}
