import { useState } from 'react'
import { ArrowDownUp, Upload, Download, type LucideIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

/**
 * Shared row for glass popover menus (the receipts `+` menu pattern), so
 * every page stops re-declaring its own menu item.
 */
export function GlassMenuItem({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: LucideIcon
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[14px] font-semibold text-foreground transition-colors hover:bg-bg-subtle disabled:pointer-events-none disabled:opacity-50"
    >
      <Icon className="size-[17px] shrink-0 text-muted-foreground" />
      <span>{label}</span>
    </button>
  )
}

interface ImportExportMenuProps {
  onImport: () => void
  onExport: () => void
  importLabel: string
  exportLabel: string
  /** Accessible name for the trigger, e.g. t('warranties.importExport'). */
  ariaLabel: string
  importDisabled?: boolean
  exportDisabled?: boolean
  /** Extra classes for the round trigger (e.g. `size-9` in compact headers). */
  triggerClassName?: string
}

/** Round icon button opening an Import / Export popover — the receipts toolbar pattern. */
export function ImportExportMenu({
  onImport,
  onExport,
  importLabel,
  exportLabel,
  ariaLabel,
  importDisabled,
  exportDisabled,
  triggerClassName,
}: ImportExportMenuProps) {
  const [open, setOpen] = useState(false)
  const run = (fn: () => void) => () => { setOpen(false); fn() }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className={cn(
            'grid size-10 shrink-0 place-items-center rounded-full border border-border bg-card text-foreground shadow-glass-1 transition-colors hover:bg-bg-subtle',
            triggerClassName,
          )}
        >
          <ArrowDownUp className="size-[18px]" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[210px] rounded-xl border-border bg-popover p-1.5 shadow-lg">
        <GlassMenuItem icon={Upload} label={importLabel} onClick={run(onImport)} disabled={importDisabled} />
        <GlassMenuItem icon={Download} label={exportLabel} onClick={run(onExport)} disabled={exportDisabled} />
      </PopoverContent>
    </Popover>
  )
}
