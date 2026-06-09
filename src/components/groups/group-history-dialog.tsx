import { useTranslation } from 'react-i18next'
import { GlassDialog } from '@/components/glass/glass-dialog'
import { GroupHistoryList } from '@/components/groups/group-history-list'

interface GroupHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  displayCurrency: string
}

/** Settlement-history sheet (mobile bottom-sheet / desktop centered card) — opened from the
 *  group hero's "History" footer link. Wraps the shared flush history list. */
export function GroupHistoryDialog({ open, onOpenChange, groupId, displayCurrency }: GroupHistoryDialogProps) {
  const { t } = useTranslation()
  return (
    <GlassDialog open={open} onOpenChange={onOpenChange} title={t('groups.settlements.history')} desktopWidth={452}>
      <GroupHistoryList groupId={groupId} displayCurrency={displayCurrency} flush />
    </GlassDialog>
  )
}
