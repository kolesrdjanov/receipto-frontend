import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { SoftCard, SectionLabel, GMemberAvatar, RolePill } from '@/components/groups/primitives'
import { InviteLinkCard } from '@/components/groups/invite-link-card'
import { memberName } from '@/lib/groups'
import type { Group, GroupMember } from '@/hooks/groups/use-groups'
import { UserPlus, Crown, UserMinus } from 'lucide-react'

interface GroupMembersPanelProps {
  group: Group
  isAdmin: boolean
  isArchived: boolean
  currentUserId?: string
  onInvite: () => void
  onRemoveMember: (member: GroupMember) => void
}

const ROLE_ORDER: Record<string, number> = { owner: 0, admin: 1, member: 2 }

/** Members management view: invite CTA, member list with roles, pending invites, invite link. */
export function GroupMembersPanel({
  group,
  isAdmin,
  isArchived,
  currentUserId,
  onInvite,
  onRemoveMember,
}: GroupMembersPanelProps) {
  const { t } = useTranslation()

  const accepted = [...(group.members || [])]
    .filter((m) => m.status === 'accepted')
    .sort((a, b) => {
      const r = (ROLE_ORDER[a.role] ?? 2) - (ROLE_ORDER[b.role] ?? 2)
      if (r !== 0) return r
      return memberName(a.user).toLowerCase().localeCompare(memberName(b.user).toLowerCase())
    })
  const pending = (group.members || []).filter((m) => m.status === 'pending')

  return (
    <div className="flex flex-col gap-3.5">
      {isAdmin && !isArchived && (
        <Button type="button" variant="brand" className="w-full" onClick={onInvite}>
          <UserPlus className="size-[18px]" />
          {t('groups.members.invitePeople')}
        </Button>
      )}

      <SoftCard>
        <SectionLabel>{t('groups.membersCount', { count: accepted.length })}</SectionLabel>
        <div className="flex flex-col gap-1">
          {accepted.map((m) => {
            const isSelf = m.userId === currentUserId
            return (
              <div key={m.id} className="flex items-center gap-3 py-1.5">
                <GMemberAvatar user={m.user} self={isSelf} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[14px] font-bold">
                    <span className="truncate">{isSelf ? t('groups.you') : memberName(m.user)}</span>
                    {m.role === 'owner' && <Crown className="size-3.5 shrink-0 text-warning" />}
                  </div>
                  <div className="mt-0.5 truncate text-[11.5px] text-muted-foreground">{m.user?.email}</div>
                </div>
                <RolePill role={m.role} />
                {isAdmin && !isArchived && m.role !== 'owner' && !isSelf && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0"
                    onClick={() => onRemoveMember(m)}
                    aria-label={t('common.delete')}
                  >
                    <UserMinus className="size-[17px] text-destructive" />
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </SoftCard>

      {pending.length > 0 && (
        <SoftCard>
          <SectionLabel>{t('groups.detail.pendingInvites', { count: pending.length })}</SectionLabel>
          <div className="flex flex-col gap-1">
            {pending.map((m) => {
              const expired = m.expiresAt && new Date(m.expiresAt) < new Date()
              return (
                <div key={m.id} className="flex items-center gap-2 py-1.5">
                  <span className="min-w-0 flex-1 truncate text-[13px] text-muted-foreground">
                    {m.invitedEmail || m.user?.email}
                  </span>
                  {expired && (
                    <span className="shrink-0 rounded-full bg-destructive-soft px-1.5 py-0.5 text-[10px] font-semibold text-[color:var(--destructive-foreground-on-soft)]">
                      {t('groups.detail.inviteExpired')}
                    </span>
                  )}
                  {isAdmin && !isArchived && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0"
                      onClick={() => onRemoveMember(m)}
                      aria-label={t('common.delete')}
                    >
                      <UserMinus className="size-[17px] text-destructive" />
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </SoftCard>
      )}

      {isAdmin && !isArchived && (
        <SoftCard>
          <InviteLinkCard groupId={group.id} />
        </SoftCard>
      )}
    </div>
  )
}
