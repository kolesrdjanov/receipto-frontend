import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  useGroupStats,
  useInviteMember,
  useRemoveMember,
  useLeaveGroup,
  type Group,
} from '@/hooks/groups/use-groups'
import { useAuthStore } from '@/store/auth'
import { toast } from 'sonner'
import { Users, UserPlus, Trash2, LogOut, Crown, Loader2, Pencil } from 'lucide-react'

interface GroupDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: Group | null
  onEdit: (group: Group) => void
}

export function GroupDetailModal({ open, onOpenChange, group, onEdit }: GroupDetailModalProps) {
  const [inviteEmail, setInviteEmail] = useState('')
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
      toast.success('Invite sent!')
      setInviteEmail('')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send invite'
      toast.error(errorMessage)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return

    try {
      await removeMember.mutateAsync({ groupId: group.id, memberId })
      toast.success('Member removed')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove member'
      toast.error(errorMessage)
    }
  }

  const handleLeave = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) return

    try {
      await leaveGroup.mutateAsync(group.id)
      toast.success('You left the group')
      onOpenChange(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to leave group'
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
      currency: 'RSD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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
        </DialogHeader>

        <div className="space-y-6">
          {/* Stats */}
          <div className="p-4 rounded-lg bg-muted/50">
            <h3 className="font-semibold mb-3">Statistics</h3>
            {statsLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : stats ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Receipts</span>
                  <span className="font-medium">{stats.totalReceipts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-medium">{formatAmount(stats.totalAmount)}</span>
                </div>
                {stats.perUser.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Per member:</p>
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

          {/* Members */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Members ({acceptedMembers.length})
            </h3>
            <div className="space-y-2">
              {acceptedMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    {member.role === 'owner' && <Crown className="h-4 w-4 text-yellow-500" />}
                    <span>
                      {member.user?.firstName} {member.user?.lastName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({member.role})
                    </span>
                  </div>
                  {isAdmin && member.role !== 'owner' && member.userId !== user?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.userId)}
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
                Pending Invites ({pendingMembers.length})
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
                        onClick={() => handleRemoveMember(member.userId || member.id)}
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
                Invite Member
              </h3>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <Button
                  onClick={handleInvite}
                  disabled={!inviteEmail.trim() || inviteMember.isPending}
                >
                  {inviteMember.isPending ? 'Sending...' : 'Invite'}
                </Button>
              </div>
            </div>
          )}

          {/* Leave Group */}
          {!isOwner && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleLeave}
              disabled={leaveGroup.isPending}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {leaveGroup.isPending ? 'Leaving...' : 'Leave Group'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

