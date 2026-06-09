import { useTranslation } from 'react-i18next'
import { GlassDialog } from '@/components/glass/glass-dialog'
import { RowActionItem } from '@/components/glass/primitives'
import { Switch } from '@/components/ui/switch'
import { Plus, Archive } from 'lucide-react'

interface HubMenuDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  showArchived: boolean
  onToggleArchived: (next: boolean) => void
  onNewGroup: () => void
}

/** The Hub "⋯" menu — New group + the "Show archived groups" toggle (archived lives HERE,
 *  not as a toolbar control). */
export function HubMenuDialog({
  open,
  onOpenChange,
  showArchived,
  onToggleArchived,
  onNewGroup,
}: HubMenuDialogProps) {
  const { t } = useTranslation()
  return (
    <GlassDialog open={open} onOpenChange={onOpenChange} title={t('groups.title')} desktopWidth={400}>
      <div className="flex flex-col gap-0.5">
        <RowActionItem
          icon={Plus}
          label={t('groups.newGroup')}
          onClick={() => {
            onOpenChange(false)
            onNewGroup()
          }}
        />
        {/* A clickable row, not a <button>, so it can hold the Switch (itself a button) without
            nesting interactive elements. role=switch keeps it accessible. */}
        <div
          role="switch"
          aria-checked={showArchived}
          tabIndex={0}
          onClick={() => onToggleArchived(!showArchived)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onToggleArchived(!showArchived)
            }
          }}
          className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[14px] font-medium transition-colors hover:bg-bg-subtle"
        >
          <Archive className="size-[18px] shrink-0" />
          <span className="flex-1">{t('groups.hub.showArchivedGroups')}</span>
          <Switch checked={showArchived} tabIndex={-1} className="pointer-events-none" />
        </div>
      </div>
    </GlassDialog>
  )
}
