import { useState } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  useGroups,
  usePendingInvites,
  useAcceptInvite,
  useDeclineInvite,
  type Group,
} from '@/hooks/groups/use-groups'
import { GroupModal } from '@/components/groups/group-modal'
import { GroupDetailModal } from '@/components/groups/group-detail-modal'
import { Plus, Users, Loader2, Mail, Check, X } from 'lucide-react'
import { toast } from 'sonner'

export default function Groups() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')

  const { data: groups = [], isLoading } = useGroups()
  const { data: pendingInvites = [] } = usePendingInvites()
  const acceptInvite = useAcceptInvite()
  const declineInvite = useDeclineInvite()

  const handleCreateGroup = () => {
    setSelectedGroup(null)
    setModalMode('create')
    setIsModalOpen(true)
  }

  const handleEditGroup = (group: Group) => {
    setSelectedGroup(group)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleViewGroup = (group: Group) => {
    setSelectedGroup(group)
    setIsDetailModalOpen(true)
  }

  const handleAcceptInvite = async (groupId: string) => {
    try {
      await acceptInvite.mutateAsync(groupId)
      toast.success('Invite accepted!')
    } catch {
      toast.error('Failed to accept invite')
    }
  }

  const handleDeclineInvite = async (groupId: string) => {
    try {
      await declineInvite.mutateAsync(groupId)
      toast.success('Invite declined')
    } catch {
      toast.error('Failed to decline invite')
    }
  }

  const getMemberCount = (group: Group) => {
    return group.members?.filter((m) => m.status === 'accepted').length || 0
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between sm:mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1 sm:text-3xl sm:mb-2">Groups</h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            Create and manage expense groups
          </p>
        </div>
        <Button onClick={handleCreateGroup}>
          <Plus className="h-4 w-4 mr-2" />
          New Group
        </Button>
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <Card className="mb-6 border-primary/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{invite.group.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Invited by {invite.invitedBy?.firstName} {invite.invitedBy?.lastName}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAcceptInvite(invite.group.id)}
                      disabled={acceptInvite.isPending}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeclineInvite(invite.group.id)}
                      disabled={declineInvite.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : groups.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-muted-foreground">No groups yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-center text-muted-foreground">
              Create a group to share expenses with others
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card
              key={group.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleViewGroup(group)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {group.icon && <span className="text-2xl">{group.icon}</span>}
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                  </div>
                </div>
                {group.description && (
                  <CardDescription className="line-clamp-2">
                    {group.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{getMemberCount(group)} members</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <GroupModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        group={selectedGroup}
        mode={modalMode}
      />

      <GroupDetailModal
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        group={selectedGroup}
        onEdit={handleEditGroup}
      />
    </AppLayout>
  )
}

