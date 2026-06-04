import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MoreVertical, Eye, Pencil, Trash2, Lock, type LucideIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { Receipt } from '@/hooks/receipts/use-receipts'

function KebabItem({
  icon: Icon, label, onClick, disabled, danger, title,
}: { icon: LucideIcon; label: string; onClick: () => void; disabled?: boolean; danger?: boolean; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[14px] font-semibold transition-colors',
        'disabled:pointer-events-none disabled:opacity-45',
        danger ? 'text-destructive hover:bg-destructive/10' : 'text-foreground hover:bg-bg-subtle',
      )}
    >
      <Icon className={cn('size-[17px] shrink-0', danger ? 'text-destructive' : 'text-muted-foreground')} />
      <span>{label}</span>
    </button>
  )
}

interface RowKebabProps {
  receipt: Receipt
  onView?: (r: Receipt) => void
  onEdit?: (r: Receipt) => void
  onDelete?: (r: Receipt) => void
}

/** Desktop per-row actions menu: View (if hasJournal) / Edit / — / Delete; locked rows show the reason + disable Edit/Delete. */
export function RowKebab({ receipt: r, onView, onEdit, onDelete }: RowKebabProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const locked = !!r.group?.isArchived || r.status === 'recurring'
  const lockReason = r.group?.isArchived
    ? t('receipts.archivedGroupLocked')
    : r.status === 'recurring'
      ? t('receipts.recurringLocked')
      : undefined
  const run = (fn?: (r: Receipt) => void) => () => { setOpen(false); fn?.(r) }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t('common.actions')}
          data-testid={`receipt-kebab-${r.id}`}
          onClick={(e) => e.stopPropagation()}
          className="grid size-[34px] shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-bg-subtle hover:text-foreground"
        >
          <MoreVertical className="size-[18px]" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={6}
        onClick={(e) => e.stopPropagation()}
        className="w-[208px] rounded-xl border-border bg-popover p-1.5 shadow-lg"
      >
        {r.hasJournal && (
          <KebabItem icon={Eye} label={t('receipts.viewer.viewReceipt')} onClick={run(onView)} />
        )}
        {locked && (
          <div className="flex items-start gap-2 px-3 py-2 text-[12px] leading-snug text-muted-foreground">
            <Lock className="mt-0.5 size-3.5 shrink-0" />
            <span>{lockReason}</span>
          </div>
        )}
        <KebabItem icon={Pencil} label={t('common.edit')} onClick={run(onEdit)} disabled={locked} title={lockReason} />
        <div className="mx-2 my-1 h-px bg-hairline-soft" />
        <KebabItem icon={Trash2} label={t('common.delete')} onClick={run(onDelete)} disabled={locked} danger title={lockReason} />
      </PopoverContent>
    </Popover>
  )
}
