import { useTranslation } from 'react-i18next'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassDialog } from '@/components/glass/glass-dialog'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
  isLoading?: boolean
}

/**
 * Shared confirm dialog — centered glass modal on desktop, slide-up bottom sheet on
 * mobile (via {@link GlassDialog}). Props are unchanged from the original shadcn version.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  variant = 'default',
  isLoading = false,
}: ConfirmDialogProps) {
  const { t } = useTranslation()
  const confirmLabel = confirmText ?? t('common.confirm')
  const cancelLabel = cancelText ?? t('common.cancel')
  const danger = variant === 'destructive'

  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <GlassDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      desktopWidth={420}
      showClose={false}
      header={
        <div className="flex flex-col items-center pb-1 text-center md:items-start md:text-left">
          {danger && (
            <div className="mb-3.5 grid size-12 place-items-center rounded-2xl bg-destructive-soft text-[color:var(--destructive-foreground-on-soft)]">
              <AlertTriangle className="size-6" />
            </div>
          )}
          <h2 className="t-h3">{title}</h2>
          <p className="t-sm mt-1.5 max-w-[340px] leading-relaxed text-muted-foreground">{description}</p>
        </div>
      }
      footer={
        <div className="flex gap-2 md:justify-end">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-xl md:flex-none"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant}
            className="flex-1 rounded-xl md:flex-none"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="size-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </div>
      }
    />
  )
}
