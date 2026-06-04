import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer, Share2, X } from 'lucide-react'
import { toast } from 'sonner'

interface ReceiptViewerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  journalText: string | null
  receiptNumber?: string
}

export function ReceiptViewerModal({
  open,
  onOpenChange,
  journalText,
  receiptNumber,
}: ReceiptViewerModalProps) {
  const { t } = useTranslation()
  const receiptRef = useRef<HTMLPreElement>(null)

  const handlePrint = () => {
    if (!journalText) return

    // Create print window with styled content
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error(t('receipts.viewer.printError'))
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${t('receipts.viewer.printTitle')} ${receiptNumber || ''}</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
            }
            pre {
              white-space: pre-wrap;
              word-wrap: break-word;
              margin: 0;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <pre>${journalText}</pre>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleShare = async () => {
    if (!journalText) return

    try {
      // Try Web Share API first (mobile devices)
      if (navigator.share) {
        await navigator.share({
          title: `${t('receipts.viewer.shareTitle')} ${receiptNumber || ''}`,
          text: journalText,
        })
        toast.success(t('receipts.viewer.shareSuccess'))
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(journalText)
        toast.success(t('receipts.viewer.copiedToClipboard'))
      }
    } catch {
      toast.error(t('receipts.viewer.shareError'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card flex max-h-[90vh] flex-col sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t('receipts.viewer.title')}
            {receiptNumber && (
              <span className="text-sm font-normal text-muted-foreground">
                #{receiptNumber}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            {t('receipts.viewer.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="my-2 min-h-0 flex-1">
          {journalText ? (
            <pre
              ref={receiptRef}
              className="max-h-[300px] overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-bg-subtle p-4 font-mono text-[11.5px] leading-[1.55] text-fg-2 custom-scrollbar"
            >
              {journalText}
            </pre>
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border bg-bg-subtle py-12 text-muted-foreground">
              <div className="text-center">
                <X className="mx-auto mb-2 h-12 w-12 opacity-50" />
                <p>{t('receipts.viewer.noData')}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleShare}
            disabled={!journalText}
            className="flex-1 sm:flex-none"
          >
            <Share2 className="h-4 w-4" />
            {t('receipts.viewer.share')}
          </Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            disabled={!journalText}
            className="flex-1 sm:flex-none"
          >
            <Printer className="h-4 w-4" />
            {t('receipts.viewer.print')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            className="flex-1 sm:flex-none"
          >
            {t('common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
