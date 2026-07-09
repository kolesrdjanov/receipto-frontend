import { useTranslation } from 'react-i18next'
import { Download, Upload, Loader2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassDialog } from '@/components/glass/glass-dialog'

const COLUMN_KEYS = [
  'columnStoreName',
  'columnTotalAmount',
  'columnCurrency',
  'columnReceiptDate',
  'columnReceiptNumber',
  'columnCategoryName',
] as const

interface ImportGuideDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDownloadTemplate: () => void
  onSelectFile: () => void
  importing?: boolean
}

/** Glass CSV import guide — column list + date-format tip + Download template / Select file. */
export function ImportGuideDialog({ open, onOpenChange, onDownloadTemplate, onSelectFile, importing }: ImportGuideDialogProps) {
  const { t } = useTranslation()

  return (
    <GlassDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('receipts.import.guide.title')}
      description={t('receipts.import.guide.description')}
      desktopWidth={520}
      actions={{
        primary: (
          <Button onClick={onSelectFile} disabled={importing}>
            {importing ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {t('receipts.import.guide.selectFile')}
          </Button>
        ),
        secondary: (
          <Button variant="outline" onClick={onDownloadTemplate}>
            <Download className="size-4" />
            {t('receipts.import.guide.downloadTemplate')}
          </Button>
        ),
      }}
    >
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-faint">
        {t('receipts.import.guide.columns')}
      </div>
      <ul className="flex flex-col gap-1">
        {COLUMN_KEYS.map((k) => (
          <li
            key={k}
            className="rounded-md bg-bg-subtle px-2.5 py-1.5 font-mono text-[12px] leading-snug text-foreground"
          >
            {t(`receipts.import.guide.${k}`)}
          </li>
        ))}
      </ul>
      <div className="mt-3.5 flex items-start gap-2 rounded-xl bg-bg-subtle px-3.5 py-3">
        <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <span className="text-[12.5px] leading-[1.45] text-muted-foreground">
          {t('receipts.import.guide.dateFormats')}
        </span>
      </div>
    </GlassDialog>
  )
}
