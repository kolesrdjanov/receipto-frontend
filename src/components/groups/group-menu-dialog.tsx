import { useTranslation } from 'react-i18next'
import { GlassDialog } from '@/components/glass/glass-dialog'
import { RowActionItem } from '@/components/glass/primitives'
import type { Group } from '@/hooks/groups/use-groups'
import { Pencil, UserPlus, Users, Camera, Archive, ArchiveRestore, LogOut } from 'lucide-react'

interface GroupMenuDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: Group
  isOwner: boolean
  isAdmin: boolean
  onEdit: () => void
  onInvite: () => void
  onManageMembers: () => void
  onScan: () => void
  onArchiveToggle: () => void
  onLeave: () => void
}

/** Kebab action sheet for a group: edit / invite / members / scan / archive / leave. */
export function GroupMenuDialog({
  open,
  onOpenChange,
  group,
  isOwner,
  isAdmin,
  onEdit,
  onInvite,
  onManageMembers,
  onScan,
  onArchiveToggle,
  onLeave,
}: GroupMenuDialogProps) {
  const { t } = useTranslation()
  const archived = !!group.isArchived
  const run = (fn: () => void) => () => {
    onOpenChange(false)
    fn()
  }

  return (
    <GlassDialog
      open={open}
      onOpenChange={onOpenChange}
      title={group.name}
      header={
        <div className="flex items-center gap-3">
          <span className="grid size-[38px] shrink-0 place-items-center rounded-xl bg-bg-subtle text-[20px]">
            {group.icon || '👥'}
          </span>
          <div className="t-h3 truncate">{group.name}</div>
        </div>
      }
      desktopWidth={400}
    >
      <div className="flex flex-col gap-0.5">
        {isAdmin && !archived && (
          <RowActionItem icon={Pencil} label={t('groups.menu.edit')} onClick={run(onEdit)} />
        )}
        {isAdmin && !archived && (
          <RowActionItem icon={UserPlus} label={t('groups.menu.invite')} onClick={run(onInvite)} />
        )}
        <RowActionItem icon={Users} label={t('groups.menu.manageMembers')} onClick={run(onManageMembers)} />
        {!archived && <RowActionItem icon={Camera} label={t('groups.menu.scan')} onClick={run(onScan)} />}
        {isOwner && (
          <RowActionItem
            icon={archived ? ArchiveRestore : Archive}
            label={archived ? t('groups.archive.unarchiveButton') : t('groups.archive.button')}
            onClick={run(onArchiveToggle)}
          />
        )}
        {!isOwner && (
          <RowActionItem icon={LogOut} label={t('groups.detail.leaveGroup')} onClick={run(onLeave)} danger />
        )}
      </div>
    </GlassDialog>
  )
}
