import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Plus, Copy, Upload, Download, ArrowDownUp, QrCode, Image, ChevronRight, type LucideIcon,
} from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { GlassDialog } from '@/components/glass/glass-dialog'
import { GlassMenuItem as MenuItem } from '@/components/glass/import-export-menu'
import { HeaderIconButton } from '@/components/layout/header-actions'
import { cn } from '@/lib/utils'

/* ---------- desktop "+" popover menu ---------- */

interface AddMenuProps {
  onAddBlank: () => void
  onAddFromTemplate: () => void
  onImport: () => void
  onExport: () => void
}

/** Desktop `+` menu: Blank receipt / From template / — / Import CSV / Export CSV. */
export function AddMenu({ onAddBlank, onAddFromTemplate, onImport, onExport }: AddMenuProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const run = (fn: () => void) => () => { setOpen(false); fn() }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <HeaderIconButton icon={Plus} label={t('receipts.addManually')} />
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[210px] rounded-xl border-border bg-popover p-1.5 shadow-lg">
        <MenuItem icon={Plus} label={t('receipts.addBlank')} onClick={run(onAddBlank)} />
        <MenuItem icon={Copy} label={t('receipts.addFromTemplate')} onClick={run(onAddFromTemplate)} />
        <div className="mx-2 my-1.5 h-px bg-hairline-soft" />
        <MenuItem icon={Upload} label={t('receipts.importCsv')} onClick={run(onImport)} />
        <MenuItem icon={Download} label={t('receipts.exportCsv')} onClick={run(onExport)} />
      </PopoverContent>
    </Popover>
  )
}

/* ---------- mobile action rows (Add sheet + Import/Export chooser) ---------- */

function ActionRow({
  icon: Icon, title, subtitle, onClick, primary,
}: { icon: LucideIcon; title: string; subtitle: string; onClick: () => void; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3.5 rounded-2xl border px-3.5 py-3 text-left transition-colors',
        primary ? 'border-transparent bg-primary-soft' : 'border-hairline-soft bg-card hover:bg-bg-subtle',
      )}
    >
      <span
        className={cn(
          'grid size-[42px] shrink-0 place-items-center rounded-xl',
          primary ? 'bg-primary/15 text-primary' : 'bg-bg-subtle text-fg-2',
        )}
      >
        <Icon className="size-5" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[15px] font-semibold text-foreground">{title}</span>
        <span className="mt-0.5 text-[12.5px] text-muted-foreground">{subtitle}</span>
      </span>
      <ChevronRight className="size-[18px] shrink-0 text-fg-faint" />
    </button>
  )
}

/* ---------- mobile Add action sheet (opened by the FAB) ---------- */

interface AddSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScanQr: () => void
  onScanGallery: () => void
  onAddManually: () => void
  onAddFromTemplate: () => void
  onImportExport: () => void
}

/** Mobile Add action sheet: Scan QR / From gallery / Add manually / From template / — / Import-Export. */
export function AddSheet({ open, onOpenChange, onScanQr, onScanGallery, onAddManually, onAddFromTemplate, onImportExport }: AddSheetProps) {
  const { t } = useTranslation()
  const pick = (fn: () => void) => () => { onOpenChange(false); fn() }

  return (
    <GlassDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('receipts.addSheetTitle')}
      description={t('receipts.addSheetSubtitle')}
    >
      <div className="flex flex-col gap-2">
        <ActionRow primary icon={QrCode} title={t('receipts.scanCamera')} subtitle={t('receipts.scanQrHint')} onClick={pick(onScanQr)} />
        <ActionRow icon={Image} title={t('receipts.scanGallery')} subtitle={t('receipts.scanGalleryHint')} onClick={pick(onScanGallery)} />
        <ActionRow icon={Plus} title={t('receipts.addManually')} subtitle={t('receipts.addManuallyHint')} onClick={pick(onAddManually)} />
        <ActionRow icon={Copy} title={t('receipts.addFromTemplate')} subtitle={t('receipts.addFromTemplateHint')} onClick={pick(onAddFromTemplate)} />
        <div className="my-1 h-px bg-hairline-soft" />
        <ActionRow icon={ArrowDownUp} title={t('receipts.importExport')} subtitle={t('receipts.importExportHint')} onClick={pick(onImportExport)} />
      </div>
    </GlassDialog>
  )
}

/* ---------- mobile Import/Export chooser (behind the single mobile entry) ---------- */

interface ImportExportSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: () => void
  onExport: () => void
}

/** Mobile chooser behind the single "Import / Export" entry. */
export function ImportExportSheet({ open, onOpenChange, onImport, onExport }: ImportExportSheetProps) {
  const { t } = useTranslation()
  const pick = (fn: () => void) => () => { onOpenChange(false); fn() }

  return (
    <GlassDialog open={open} onOpenChange={onOpenChange} title={t('receipts.importExport')}>
      <div className="flex flex-col gap-2">
        <ActionRow icon={Upload} title={t('receipts.importCsv')} subtitle={t('receipts.import.guide.description')} onClick={pick(onImport)} />
        <ActionRow icon={Download} title={t('receipts.exportCsv')} subtitle={t('receipts.export.button')} onClick={pick(onExport)} />
      </div>
    </GlassDialog>
  )
}
