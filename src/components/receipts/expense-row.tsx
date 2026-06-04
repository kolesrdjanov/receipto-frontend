import { useTranslation } from 'react-i18next'
import { Users, Archive, Eye, Pencil, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Amount, CatTile, CatName, SelectCheck, StatusBadge } from '@/components/receipts/primitives'
import type { Receipt } from '@/hooks/receipts/use-receipts'

const NOTABLE = new Set(['pending', 'recurring', 'failed'])

interface ExpenseRowProps {
  receipt: Receipt
  wide?: boolean
  selectMode?: boolean
  selected?: boolean
  onToggleSelect?: (id: string) => void
  onView?: (r: Receipt) => void
  onEdit?: (r: Receipt) => void
  onDelete?: (r: Receipt) => void
}

export function ExpenseRow({
  receipt: r,
  wide,
  selectMode,
  selected,
  onToggleSelect,
  onView,
  onEdit,
  onDelete,
}: ExpenseRowProps) {
  const { t } = useTranslation()
  const locked = !!r.group?.isArchived || r.status === 'recurring'
  const lockTitle = r.group?.isArchived
    ? t('receipts.archivedGroupLocked')
    : r.status === 'recurring'
      ? t('receipts.recurringLocked')
      : undefined
  const time = r.receiptDate ? format(new Date(r.receiptDate), 'HH:mm') : ''
  const showBadge = wide || NOTABLE.has(r.status)
  // On a narrow compact row, group pill + badge + name don't all fit — drop the name
  // (the emoji tile already conveys category). Wide rows always show it.
  const showCatName = wide || !(r.group && showBadge)

  return (
    <div
      data-testid={`receipt-row-${r.id}`}
      className={cn(
        'flex items-center gap-3.5 px-4 py-3 transition-colors',
        wide && 'px-[18px] py-[15px]',
        selectMode && 'cursor-pointer',
        selected ? 'bg-primary-soft' : 'hover:bg-bg-subtle',
      )}
      onClick={selectMode ? () => onToggleSelect?.(r.id) : undefined}
    >
      {selectMode && <SelectCheck on={selected} />}
      <CatTile category={r.category} size={wide ? 44 : 42} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2.5">
          <span className="truncate text-[15px] font-semibold" data-testid={`receipt-store-${r.id}`}>
            {r.storeName || t('receipts.unknownStore')}
          </span>
          <Amount value={r.totalAmount ?? 0} currency={r.currency || 'RSD'} size={wide ? 16 : 15.5} />
        </div>
        <div className="mt-[5px] flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {showCatName && <CatName name={r.category?.name} />}
            {r.group && (
              <span
                className={cn(
                  'inline-flex shrink-0 items-center gap-1 rounded-full bg-bg-subtle px-2 py-0.5 text-[11px] font-medium text-muted-foreground',
                  r.group.isArchived && 'opacity-70',
                )}
              >
                {r.group.isArchived && <Archive className="size-2.5" />}
                <Users className="size-2.5" />
                <span className="max-w-[120px] truncate">{r.group.name}</span>
              </span>
            )}
            {showBadge && <StatusBadge status={r.status} />}
          </div>
          {/* Time only on wide (desktop) rows — compact rows keep the date in the day header and
              regain room; it returns on mobile with the kebab in Chunk 5. */}
          {time && wide && <span className="shrink-0 text-[11px] text-fg-faint">{time}</span>}
        </div>
      </div>
      {!selectMode && (
        <div className="flex shrink-0 items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          {r.hasJournal && (
            <button
              className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-bg-subtle hover:text-foreground"
              title={t('receipts.viewer.viewReceipt')}
              data-testid={`receipt-view-${r.id}`}
              onClick={() => onView?.(r)}
            >
              <Eye className="size-4" />
            </button>
          )}
          <button
            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-bg-subtle hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            disabled={locked}
            title={lockTitle}
            data-testid={`receipt-edit-${r.id}`}
            onClick={() => onEdit?.(r)}
          >
            <Pencil className="size-4" />
          </button>
          <button
            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-40"
            disabled={locked}
            title={lockTitle}
            data-testid={`receipt-delete-${r.id}`}
            onClick={() => onDelete?.(r)}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      )}
    </div>
  )
}
