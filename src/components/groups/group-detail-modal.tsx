import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  useGroupStats,
  useInviteMember,
  useRemoveMember,
  useLeaveGroup,
  type Group,
} from '@/hooks/groups/use-groups'
import { useAuthStore } from '@/store/auth'
import { GroupBalancesTab } from './group-balances-tab'
import { toast } from 'sonner'
import { Users, UserPlus, Trash2, LogOut, Crown, Loader2, Pencil } from 'lucide-react'

interface GroupDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: Group | null
  onEdit: (group: Group) => void
}

export function GroupDetailModal({ open, onOpenChange, group, onEdit }: GroupDetailModalProps) {
  const { t } = useTranslation()
  const [inviteEmail, setInviteEmail] = useState('')
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [showRemoveMemberConfirm, setShowRemoveMemberConfirm] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null)
  const { user } = useAuthStore()

  const { data: stats, isLoading: statsLoading } = useGroupStats(group?.id || '')
  const inviteMember = useInviteMember()
  const removeMember = useRemoveMember()
  const leaveGroup = useLeaveGroup()

  if (!group) return null

  const currentUserMember = group.members?.find((m) => m.userId === user?.id)
  const isOwner = currentUserMember?.role === 'owner'
  const isAdmin = currentUserMember?.role === 'admin' || isOwner
  const acceptedMembers = group.members?.filter((m) => m.status === 'accepted') || []
  const pendingMembers = group.members?.filter((m) => m.status === 'pending') || []

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return

    try {
      await inviteMember.mutateAsync({ groupId: group.id, email: inviteEmail })
      toast.success(t('groups.detail.inviteSent'))
      setInviteEmail('')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('groups.detail.inviteError')
      toast.error(errorMessage)
    }
  }

  const handleRemoveMemberClick = (memberId: string) => {
    setMemberToRemove(memberId)
    setShowRemoveMemberConfirm(true)
  }

  const handleRemoveMemberConfirm = async () => {
    if (!memberToRemove) return

    try {
      await removeMember.mutateAsync({ groupId: group.id, memberId: memberToRemove })
      toast.success(t('groups.detail.memberRemoved'))
      setShowRemoveMemberConfirm(false)
      setMemberToRemove(null)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('groups.detail.removeMemberError')
      toast.error(errorMessage)
    }
  }

  const handleLeaveConfirm = async () => {
    try {
      await leaveGroup.mutateAsync(group.id)
      toast.success(t('groups.detail.leftGroup'))
      setShowLeaveConfirm(false)
      onOpenChange(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('groups.detail.leaveError')
      toast.error(errorMessage)
    }
  }

  const handleEdit = () => {
    onOpenChange(false)
    onEdit(group)
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: group.currency || 'RSD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] lg:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {group.icon && <span className="text-2xl">{group.icon}</span>}
              {group.name}
            </DialogTitle>
            {isAdmin && (
              <Button variant="ghost" size="sm" className={'mr-auto'} onClick={handleEdit}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
          {group.description && (
            <DialogDescription>{group.description}</DialogDescription>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
            <span>{t('groups.detail.currency')}</span>
            <span className="font-medium text-foreground">{group.currency}</span>
          </div>
        </DialogHeader>

        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">{t('groups.tabs.summary')}</TabsTrigger>
            <TabsTrigger value="balances">{t('groups.tabs.balances')}</TabsTrigger>
            <TabsTrigger value="members">{t('groups.tabs.members')}</TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-6 mt-4">
            {/* Stats */}
            <div className="p-4 rounded-lg bg-muted/50">
            <h3 className="font-semibold mb-3">{t('groups.detail.statistics')}</h3>
            {statsLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : stats ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('groups.detail.totalReceipts')}</span>
                  <span className="font-medium">{stats.totalReceipts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('groups.detail.totalAmount')}</span>
                  <span className="font-medium">{formatAmount(stats.totalAmount)}</span>
                </div>
                {stats.perUser.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground mb-2">{t('groups.detail.perMember')}</p>
                    {stats.perUser.map((u) => (
                      <div key={u.userId} className="flex justify-between text-sm">
                        <span>{u.firstName} {u.lastName}</span>
                        <span>{formatAmount(u.totalSpent)} ({u.receiptsCount})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
            </div>
          </TabsContent>

          {/* Balances Tab */}
          <TabsContent value="balances" className="mt-4">
            <GroupBalancesTab groupId={group.id} />
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6 mt-4">
          {/* Members */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('groups.detail.members', { count: acceptedMembers.length })}
            </h3>
            <div className="space-y-2">
              {acceptedMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      firstName={member.user?.firstName}
                      lastName={member.user?.lastName}
                      imageUrl={member.user?.profileImageUrl}
                      size="sm"
                    />
                    <div className="flex items-center gap-2">
                      {member.role === 'owner' && <Crown className="h-4 w-4 text-yellow-500" />}
                      <span>
                        {member.user?.firstName || member.user?.lastName
                          ? `${member.user?.firstName || ''} ${member.user?.lastName || ''}`.trim()
                          : member.user?.email || t('common.unknown')}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({member.role})
                      </span>
                    </div>
                  </div>
                  {isAdmin && member.role !== 'owner' && member.userId !== user?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMemberClick(member.userId)}
                      disabled={removeMember.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pending Invites */}
          {pendingMembers.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 text-muted-foreground">
                {t('groups.detail.pendingInvites', { count: pendingMembers.length })}
              </h3>
              <div className="space-y-2">
                {pendingMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                  >
                    <span className="text-muted-foreground">
                      {member.invitedEmail || member.user?.email}
                    </span>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMemberClick(member.userId || member.id)}
                        disabled={removeMember.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invite Member */}
          {isAdmin && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                {t('groups.detail.inviteMember')}
              </h3>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder={t('groups.detail.emailPlaceholder')}
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <Button
                  onClick={handleInvite}
                  disabled={!inviteEmail.trim() || inviteMember.isPending}
                >
                  {inviteMember.isPending ? t('groups.detail.sending') : t('groups.detail.invite')}
                </Button>
              </div>
            </div>
          )}

          {/* Leave Group */}
          {!isOwner && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowLeaveConfirm(true)}
            >
              <LogOut className="h-4 w-4" />
              {t('groups.detail.leaveGroup')}
            </Button>
          )}
          </TabsContent>
        </Tabs>

        <ConfirmDialog
          open={showLeaveConfirm}
          onOpenChange={setShowLeaveConfirm}
          title={t('groups.detail.leaveGroupTitle')}
          description={t('groups.detail.leaveConfirm')}
          onConfirm={handleLeaveConfirm}
          confirmText={t('groups.detail.leaveGroup')}
          variant="destructive"
          isLoading={leaveGroup.isPending}
        />

        <ConfirmDialog
          open={showRemoveMemberConfirm}
          onOpenChange={setShowRemoveMemberConfirm}
          title={t('groups.detail.removeMemberTitle')}
          description={t('groups.detail.removeMemberConfirm')}
          onConfirm={handleRemoveMemberConfirm}
          confirmText={t('common.delete')}
          variant="destructive"
          isLoading={removeMember.isPending}
        />
      </DialogContent>
    </Dialog>
  )
}
