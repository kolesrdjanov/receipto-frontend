import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { QrCode, Pencil, ChevronRight, type LucideIcon } from 'lucide-react'
import { GlassDialog } from '@/components/glass/glass-dialog'
import { cn } from '@/lib/utils'

interface FabActionSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function ActionRow({
  icon: Icon,
  iconClass,
  title,
  sub,
  onClick,
}: {
  icon: LucideIcon
  iconClass: string
  title: string
  sub: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3.5 rounded-xl p-3 text-left transition-colors hover:bg-bg-subtle"
    >
      <span className={cn('grid size-[46px] shrink-0 place-items-center rounded-xl', iconClass)}>
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15.5px] font-bold text-foreground">{title}</span>
        <span className="mt-0.5 block text-[12.5px] font-medium text-muted-foreground">{sub}</span>
      </span>
      <ChevronRight className="size-[18px] shrink-0 text-fg-faint" />
    </button>
  )
}

/**
 * Global "Add expense" action sheet opened by the mobile FAB when no page has registered
 * its own create action. Routes into the Expenses scan / manual-entry flows via a query
 * param the Receipts page consumes.
 */
export function FabActionSheet({ open, onOpenChange }: FabActionSheetProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const go = (action: 'scan' | 'add') => {
    onOpenChange(false)
    navigate(`/receipts?action=${action}`)
  }

  return (
    <GlassDialog open={open} onOpenChange={onOpenChange} title={t('fab.title')} desktopWidth={420}>
      <div className="flex flex-col gap-1">
        <ActionRow
          icon={QrCode}
          iconClass="bg-primary text-primary-foreground"
          title={t('nav.scanReceipt')}
          sub={t('fab.scanHint')}
          onClick={() => go('scan')}
        />
        <ActionRow
          icon={Pencil}
          iconClass="bg-subtle text-foreground"
          title={t('receipts.addManually')}
          sub={t('fab.manualHint')}
          onClick={() => go('add')}
        />
      </div>
    </GlassDialog>
  )
}
