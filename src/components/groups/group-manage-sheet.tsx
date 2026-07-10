import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GlassDialog } from '@/components/glass/glass-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { EmojiPicker, EmojiPickerSearch, EmojiPickerContent, EmojiPickerFooter } from '@/components/ui/emoji-picker'
import { RowActionItem } from '@/components/glass/primitives'
import { GMemberAvatar, RolePill } from '@/components/groups/primitives'
import {
  useInviteMember,
  useInviteLink,
  useGenerateInviteLink,
  useUpdateInviteLink,
  useUpdateGroup,
  type Group,
  type GroupMember,
} from '@/hooks/groups/use-groups'
import { getErrorMessage } from '@/lib/api'
import { memberName } from '@/lib/groups'
import { toast } from 'sonner'
import {
  UserPlus,
  UserMinus,
  Link as LinkIcon,
  Copy,
  Check,
  Share2,
  RefreshCw,
  MessageCircle,
  Send,
  Mail,
  Archive,
  ArchiveRestore,
  LogOut,
  Trash2,
} from 'lucide-react'

interface GroupManageSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: Group
  isOwner: boolean
  isArchived: boolean
  currentUserId?: string
  onRemoveMember: (member: GroupMember) => void
  onArchiveToggle: () => void
  onLeave: () => void
  onDelete: () => void
}

const ROLE_ORDER: Record<string, number> = { owner: 0, member: 1 }
const sectionLabel = 'mb-2 block text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-faint'

/**
 * The single **Manage** sheet for a group — folds the old kebab menu, members sub-screen, invite
 * dialog and invite-link card into one surface. Owner-gated bits (identity edit / email-invite /
 * remove / archive / delete) hide for members; the shareable invite link is available to everyone
 * (matches the backend's member-level invite-link access). Name + icon edit inline in the header.
 */
export function GroupManageSheet({
  open,
  onOpenChange,
  group,
  isOwner,
  isArchived,
  currentUserId,
  onRemoveMember,
  onArchiveToggle,
  onLeave,
  onDelete,
}: GroupManageSheetProps) {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [copied, setCopied] = useState(false)
  const [nameDraft, setNameDraft] = useState(group.name)
  const [iconDraft, setIconDraft] = useState(group.icon || '👥')
  const [emojiOpen, setEmojiOpen] = useState(false)

  const inviteMember = useInviteMember()
  const { data: linkData } = useInviteLink(group.id)
  const generateLink = useGenerateInviteLink()
  const updateLink = useUpdateInviteLink()
  const updateGroup = useUpdateGroup()

  // Re-sync drafts each time the sheet opens (or the group changes underneath it).
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- draft reset on open (mirrors settings profile draft)
      setNameDraft(group.name)
      setIconDraft(group.icon || '👥')
    }
  }, [open, group.name, group.icon])

  const identityDirty = nameDraft.trim() !== group.name || iconDraft !== (group.icon || '👥')
  const canEditIdentity = isOwner && !isArchived

  const saveIdentity = async () => {
    if (!identityDirty || !nameDraft.trim()) return
    try {
      await updateGroup.mutateAsync({ id: group.id, data: { name: nameDraft.trim(), icon: iconDraft } })
      toast.success(t('groups.modal.updateSuccess'))
    } catch (error) {
      toast.error(getErrorMessage(error, t('common.error')))
    }
  }

  const inviteUrl = linkData?.inviteCodeEnabled ? linkData?.inviteUrl ?? null : null
  const shareTitle = t('groups.inviteLink.shareTitle')

  const accepted = [...(group.members || [])]
    .filter((m) => m.status === 'accepted')
    .sort((a, b) => {
      const r = (ROLE_ORDER[a.role] ?? 2) - (ROLE_ORDER[b.role] ?? 2)
      if (r !== 0) return r
      return memberName(a.user).toLowerCase().localeCompare(memberName(b.user).toLowerCase())
    })
  const pending = (group.members || []).filter((m) => m.status === 'pending')

  const handleSend = async () => {
    if (!email.includes('@')) return
    try {
      await inviteMember.mutateAsync({ groupId: group.id, email })
      toast.success(t('groups.detail.inviteSent'))
      setEmail('')
    } catch (error) {
      toast.error(getErrorMessage(error, t('groups.detail.inviteError')))
    }
  }

  const handleCopy = async () => {
    if (!inviteUrl) return
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      toast.success(t('groups.inviteLink.copied'))
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(t('common.error'))
    }
  }

  const handleToggleLink = async (enabled: boolean) => {
    try {
      if (enabled && !linkData?.inviteCode) await generateLink.mutateAsync(group.id)
      else await updateLink.mutateAsync({ groupId: group.id, enabled })
    } catch (error) {
      toast.error(getErrorMessage(error, t('common.error')))
    }
  }

  const handleRegenerate = async () => {
    try {
      await generateLink.mutateAsync(group.id)
      toast.success(t('groups.inviteLink.regenerated'))
    } catch (error) {
      toast.error(getErrorMessage(error, t('common.error')))
    }
  }

  const share = (kind: 'sms' | 'telegram' | 'email' | 'native') => () => {
    if (!inviteUrl) return
    const text = `${shareTitle} ${inviteUrl}`
    if (kind === 'sms') window.open(`sms:?&body=${encodeURIComponent(text)}`, '_blank')
    else if (kind === 'telegram')
      window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(shareTitle)}`, '_blank')
    else if (kind === 'email')
      window.open(`mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(inviteUrl)}`, '_blank')
    else if (navigator.share) navigator.share({ title: shareTitle, url: inviteUrl }).catch(() => {})
    else handleCopy()
  }

  const shareTargets = [
    { kind: 'sms' as const, icon: MessageCircle, label: t('groups.share.messages') },
    { kind: 'telegram' as const, icon: Send, label: t('groups.share.telegram') },
    { kind: 'email' as const, icon: Mail, label: t('groups.share.email') },
    { kind: 'native' as const, icon: Share2, label: t('groups.share.more') },
  ]

  const canManage = isOwner && !isArchived

  return (
    <GlassDialog
      open={open}
      onOpenChange={onOpenChange}
      title={group.name}
      header={
        canEditIdentity ? (
          /* Inline identity editor — name + icon live here; no separate edit dialog. */
          <div className="flex items-center gap-2.5">
            <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="size-[42px] shrink-0 p-0 text-[21px]"
                  aria-label={t('groups.modal.icon')}
                >
                  {iconDraft}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-fit p-0" align="start" collisionPadding={16}>
                <EmojiPicker
                  className="h-[340px]"
                  onEmojiSelect={(emoji) => {
                    setIconDraft(emoji.emoji)
                    setEmojiOpen(false)
                  }}
                >
                  <EmojiPickerSearch placeholder={t('groups.modal.iconSearchPlaceholder')} />
                  <EmojiPickerContent />
                  <EmojiPickerFooter />
                </EmojiPicker>
              </PopoverContent>
            </Popover>
            <Input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveIdentity()}
              aria-label={t('groups.modal.name')}
              className="h-[42px] flex-1 text-[15px] font-semibold"
            />
            {identityDirty && (
              <Button
                type="button"
                size="sm"
                onClick={saveIdentity}
                disabled={!nameDraft.trim()}
                loading={updateGroup.isPending}
              >
                {t('common.save')}
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="grid size-[38px] shrink-0 place-items-center rounded-xl bg-bg-subtle text-[20px]">
              {group.icon || '👥'}
            </span>
            <div className="min-w-0">
              <div className="t-h3 truncate">{group.name}</div>
              <div className="text-[12px] text-muted-foreground">{t('groups.manage.title')}</div>
            </div>
          </div>
        )
      }
      desktopWidth={452}
    >
      <div className="flex flex-col gap-5">
        {/* Members */}
        <div>
          <span className={sectionLabel}>{t('groups.membersCount', { count: accepted.length })}</span>
          <div className="flex flex-col gap-0.5">
            {accepted.map((m) => {
              const isSelf = m.userId === currentUserId
              return (
                <div key={m.id} className="flex items-center gap-3 py-1.5">
                  <GMemberAvatar user={m.user} self={isSelf} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-semibold">
                      {isSelf ? t('groups.you') : memberName(m.user)}
                    </div>
                    <div className="mt-0.5 truncate text-[11.5px] text-muted-foreground">{m.user?.email}</div>
                  </div>
                  <RolePill role={m.role} />
                  {canManage && m.role !== 'owner' && !isSelf && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0"
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

          {pending.length > 0 && (
            <>
              <span className={`${sectionLabel} mt-4`}>{t('groups.detail.pendingInvites', { count: pending.length })}</span>
              <div className="flex flex-col gap-0.5">
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
                      {canManage && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="shrink-0"
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
            </>
          )}
        </div>

        {/* Invite */}
        {!isArchived && (
          <div>
            {/* Email invite is owner-gated; the shareable link is open to any member. */}
            {isOwner && (
              <>
                <span className={sectionLabel}>{t('groups.invite.byEmail')}</span>
                <div className="mb-4 flex items-center gap-2">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="name@example.com"
                    className="flex-1"
                  />
                  <Button type="button" disabled={!email.includes('@')} loading={inviteMember.isPending} onClick={handleSend}>
                    <UserPlus className="size-4" />
                    {t('groups.invite.send')}
                  </Button>
                </div>
              </>
            )}

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[13px] font-semibold">
                <LinkIcon className="size-[15px] text-muted-foreground" />
                {t('groups.inviteLink.title')}
              </span>
              <Switch
                checked={linkData?.inviteCodeEnabled || false}
                onCheckedChange={handleToggleLink}
                disabled={updateLink.isPending || generateLink.isPending}
              />
            </div>

            {inviteUrl && (
              <>
                <div className="mt-2.5 flex h-[46px] items-center gap-2.5 rounded-xl border border-border bg-bg-subtle pl-3 pr-2">
                  <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">{inviteUrl}</span>
                  <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
                    {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    {copied ? t('groups.inviteLink.copied') : t('groups.inviteLink.copy')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleRegenerate}
                    disabled={generateLink.isPending}
                    aria-label={t('groups.inviteLink.regenerate')}
                  >
                    <RefreshCw className="size-3.5" />
                  </Button>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {shareTargets.map((s) => (
                    <Button
                      key={s.kind}
                      type="button"
                      variant="outline"
                      onClick={share(s.kind)}
                      className="h-auto flex-col gap-2 py-3 text-[11.5px]"
                    >
                      <span className="grid size-[38px] place-items-center rounded-full bg-bg-subtle text-muted-foreground">
                        <s.icon className="size-5" />
                      </span>
                      {s.label}
                    </Button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Danger / lifecycle actions */}
        <div className="flex flex-col gap-0.5 border-t border-hairline-soft pt-3">
          {isOwner && (
            <RowActionItem
              icon={isArchived ? ArchiveRestore : Archive}
              label={isArchived ? t('groups.archive.unarchiveButton') : t('groups.archive.button')}
              onClick={onArchiveToggle}
            />
          )}
          {isOwner ? (
            /* Everyone can leave per the rework — but the API blocks the owner until they
               hand the group off, so the action is gated with the reason, not hidden. */
            <RowActionItem
              icon={LogOut}
              label={t('groups.detail.leaveGroup')}
              disabled
              hint={t('groups.manage.ownerCannotLeave')}
              danger
            />
          ) : (
            <RowActionItem icon={LogOut} label={t('groups.detail.leaveGroup')} onClick={onLeave} danger />
          )}
          {isOwner && (
            <RowActionItem icon={Trash2} label={t('groups.manage.deleteGroup')} onClick={onDelete} danger />
          )}
        </div>
      </div>
    </GlassDialog>
  )
}
