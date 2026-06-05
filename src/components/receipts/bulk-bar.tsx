import { useTranslation } from 'react-i18next'
import { Tag, Trash2, X, Loader2 } from 'lucide-react'
import { SelectCheck, Amount } from '@/components/receipts/primitives'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

interface BulkBarProps {
  count: number
  total: number
  currency: string
  allSelected: boolean
  onToggleSelectAll: () => void
  onAssign: () => void
  onRemove: () => void
  onClear: () => void
  removing?: boolean
}

/**
 * Floating bulk-action bar for selection mode. Desktop = centered glass pill; mobile = bottom
 * glass bar that clears the tab-bar. Returns null when nothing is selected. Never gradient.
 */
export function BulkBar({
  count, total, currency, allSelected, onToggleSelectAll, onAssign, onRemove, onClear, removing,
}: BulkBarProps) {
  const { t } = useTranslation()
  const isMobile = useIsMobile(768)
  if (count === 0) return null

  if (isMobile) {
    return (
      <div
        className="fixed inset-x-3 z-30 flex items-center gap-2.5 rounded-2xl border border-border bg-card/92 px-3.5 py-2.5 shadow-glass-3 [backdrop-filter:blur(20px)] [-webkit-backdrop-filter:blur(20px)]"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 84px)' }}
        data-testid="bulk-bar-mobile"
      >
        <div className="flex shrink-0 flex-col">
          <span className="whitespace-nowrap text-[14px] font-semibold text-foreground">{t('receipts.selected', { count })}</span>
          <Amount value={total} currency={currency} size={12} weight={600} muted />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="glass"
            onClick={onAssign}
            className="h-[38px] gap-1.5 rounded-full px-3.5 text-[13px] font-semibold [&_svg]:size-[17px]"
          >
            <Tag />
            {t('receipts.filters.category')}
          </Button>
          <Button
            type="button"
            variant="destructive-soft"
            onClick={onRemove}
            disabled={removing}
            className="h-[38px] gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition-opacity [&_svg]:size-[17px] disabled:opacity-60"
          >
            {removing ? <Loader2 className="animate-spin" /> : <Trash2 />}
            {t('common.remove')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'fixed bottom-7 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full',
        'border border-border bg-card/92 px-[18px] py-3 shadow-glass-3',
        '[backdrop-filter:blur(20px)_saturate(1.4)] [-webkit-backdrop-filter:blur(20px)_saturate(1.4)]',
        'min-w-[540px] max-w-[calc(100vw-2rem)]',
      )}
      data-testid="bulk-bar-desktop"
    >
      <button
        type="button"
        onClick={onToggleSelectAll}
        aria-label={allSelected ? t('receipts.deselectAll') : t('receipts.selectAll')}
        title={allSelected ? t('receipts.deselectAll') : t('receipts.selectAll')}
        className="shrink-0"
      >
        <SelectCheck on={allSelected} />
      </button>
      <span className="text-[15px] font-semibold text-foreground">{t('receipts.selected', { count })}</span>
      <span className="text-[13px] text-muted-foreground">·</span>
      <Amount value={total} currency={currency} size={13} weight={600} muted />
      <div className="flex-1" />
      <Button
        type="button"
        variant="glass"
        size="pill"
        onClick={onAssign}
        className="gap-1.5 text-[13px] font-semibold [&_svg]:size-[15px]"
      >
        <Tag />
        {t('receipts.assignCategory')}
      </Button>
      <Button
        type="button"
        variant="destructive"
        size="pill"
        onClick={onRemove}
        disabled={removing}
        className="gap-1.5 text-[13px] font-semibold transition-opacity [&_svg]:size-[15px] disabled:opacity-60"
      >
        {removing ? <Loader2 className="animate-spin" /> : <Trash2 />}
        {t('receipts.removeSelected')}
      </Button>
      <button
        type="button"
        onClick={onClear}
        aria-label={t('receipts.clearSelection')}
        title={t('receipts.clearSelection')}
        className="grid size-[34px] shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-bg-subtle hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
