import { useTranslation } from 'react-i18next'
import { Download, Upload, Info } from 'lucide-react'
import { GlassDialog } from '@/components/glass/glass-dialog'
import { Button } from '@/components/ui/button'

interface WarrantyImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDownloadTemplate: () => void
  onSelectFile: () => void
  importing?: boolean
}

const COLUMN_KEYS = [
  'columnProductName',
  'columnStoreName',
  'columnPurchaseDate',
  'columnWarrantyExpires',
  'columnWarrantyDuration',
  'columnNotes',
  'columnFileUrls',
] as const

export function WarrantyImportDialog({
  open,
  onOpenChange,
  onDownloadTemplate,
  onSelectFile,
  importing,
}: WarrantyImportDialogProps) {
  const { t } = useTranslation()

  const footer = (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button type="button" variant="outline" onClick={onDownloadTemplate} className="flex-1">
        <Download className="size-4" />
        {t('warranties.import.guide.downloadTemplate')}
      </Button>
      <Button type="button" onClick={onSelectFile} disabled={importing} className="flex-1">
        <Upload className="size-4" />
        {t('warranties.import.guide.selectFile')}
      </Button>
    </div>
  )

  return (
    <GlassDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('warranties.import.guide.title')}
      description={t('warranties.import.guide.description')}
      desktopWidth={500}
      footer={footer}
    >
      <div className="flex flex-col gap-4">
        <div>
          <h4 className="mb-2.5 text-[13px] font-semibold">{t('warranties.import.guide.columns')}</h4>
          <div className="flex flex-col gap-2">
            {COLUMN_KEYS.map((key) => (
              <code key={key} className="block rounded-lg bg-bg-subtle px-2.5 py-1.5 font-mono text-[12px] text-foreground">
                {t(`warranties.import.guide.${key}`)}
              </code>
            ))}
          </div>
        </div>
        <div className="flex items-start gap-2.5 rounded-xl bg-info-soft/60 px-3.5 py-3 text-[13px] leading-relaxed text-info-foreground">
          <Info className="mt-px size-4 shrink-0" />
          <div className="flex flex-col gap-1">
            <span>{t('warranties.import.guide.dateFormats')}</span>
            <span>{t('warranties.import.guide.defaultDuration')}</span>
          </div>
        </div>
      </div>
    </GlassDialog>
  )
}
