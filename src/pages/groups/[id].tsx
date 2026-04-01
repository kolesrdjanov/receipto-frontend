import { useState, useRef, useEffect, lazy, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCurrencies, getCurrencyFlag } from '@/hooks/currencies/use-currencies'
import { useExchangeRates } from '@/hooks/currencies/use-currency-converter'
import { useSettingsStore } from '@/store/settings'
import {
  useGroup,
  useGroupStats,
  useInviteMember,
  useRemoveMember,
  useLeaveGroup,
  useArchiveGroup,
  useUnarchiveGroup,
  type GroupMember,
} from '@/hooks/groups/use-groups'
import { useGroupPolling } from '@/hooks/groups/use-group-polling'
import type { Receipt } from '@/hooks/receipts/use-receipts'
import { useReceiptScanner } from '@/hooks/receipts/use-receipt-scanner'
import { useAuthStore } from '@/store/auth'
import { queryKeys } from '@/lib/query-keys'
import { GroupModal } from '@/components/groups/group-modal'
import { InviteLinkCard } from '@/components/groups/invite-link-card'
import { GroupBalancesTab } from '@/components/groups/group-balances-tab'
import { GroupReceiptsTable } from '@/components/groups/group-receipts-table'
import { ActivityFeed } from '@/components/groups/activity-feed'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Users,
  UserPlus,
  Trash2,
  LogOut,
  Crown,
  Loader2,
  Pencil,
  Receipt as ReceiptIcon,
  Wallet,
  Camera,
  Plus,
  ChevronDown,
  Archive,
  ArchiveRestore,
  RefreshCw,
} from 'lucide-react'

const ReceiptModal = lazy(() => import('@/components/receipts/receipt-modal').then(m => ({ default: m.ReceiptModal })))

export default function GroupDetail() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [inviteEmail, setInviteEmail] = useState('')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [showRemoveMemberConfirm, setShowRemoveMemberConfirm] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const { user } = useAuthStore()
  const { currency: preferredCurrency } = useSettingsStore()
  const [displayCurrency, setDisplayCurrency] = useState(preferredCurrency || 'RSD')
  const { data: currencies = [] } = useCurrencies()
  const { data: exchangeRates, isLoading: ratesLoading } = useExchangeRates(displayCurrency)

  // Receipt entry state
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)
  const [showAddDropdown, setShowAddDropdown] = useState(false)
  const [prefillData, setPrefillData] = useState<Partial<Receipt> | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const queryClient = useQueryClient()
  const { data: group, isLoading: groupLoading } = useGroup(id || '')
  const { data: stats, isLoading: statsLoading } = useGroupStats(id || '')
  useGroupPolling(id || '')
  const inviteMember = useInviteMember()
  const removeMember = useRemoveMember()
  const leaveGroup = useLeaveGroup()
  const archiveGroup = useArchiveGroup()
  const unarchiveGroup = useUnarchiveGroup()
  const { openQrScannerWithContext, scannerModals, isCreating } = useReceiptScanner()

  // Set display currency to group's default currency when group is loaded
  useEffect(() => {
    if (group?.currency) {
      setDisplayCurrency(group.currency)
    }
  }, [group?.currency])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAddDropdown(false)
      }
    }

    if (showAddDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAddDropdown])

  if (groupLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  if (!group) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">{t('common.noData')}</p>
          <Button variant="link" onClick={() => navigate('/groups')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
        </div>
      </AppLayout>
    )
  }

  const currentUserMember = group.members?.find((m) => m.userId === user?.id)
  const isOwner = currentUserMember?.role === 'owner'
  const isAdmin = currentUserMember?.role === 'admin' || isOwner

  // Sort members: owner first, then admin, then by name
  const sortMembers = (members: GroupMember[]) => {
    return [...members].sort((a, b) => {
      const rolePriority = { owner: 0, admin: 1, member: 2 }
      const aPriority = rolePriority[a.role] ?? 2
      const bPriority = rolePriority[b.role] ?? 2

      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }

      const aName = `${a.user?.firstName || ''} ${a.user?.lastName || ''}`.trim().toLowerCase()
      const bName = `${b.user?.firstName || ''} ${b.user?.lastName || ''}`.trim().toLowerCase()
      return aName.localeCompare(bName)
    })
  }

  const acceptedMembers = sortMembers(
    group.members?.filter((m) => m.status === 'accepted') || []
  )
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
      navigate('/groups')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('groups.detail.leaveError')
      toast.error(errorMessage)
    }
  }

  const handleArchiveConfirm = async () => {
    try {
      if (group.isArchived) {
        await unarchiveGroup.mutateAsync(group.id)
        toast.success(t('groups.archive.unarchiveSuccess'))
      } else {
        await archiveGroup.mutateAsync(group.id)
        toast.success(t('groups.archive.success'))
      }
      setShowArchiveConfirm(false)
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : group.isArchived
          ? t('groups.archive.unarchiveError')
          : t('groups.archive.error')
      toast.error(errorMessage)
    }
  }

  const formatAmount = (amount: number, currency?: string) => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: currency || displayCurrency || 'RSD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const convertAmount = (amount: number, fromCurrency: string): number => {
    if (fromCurrency === displayCurrency || !exchangeRates) {
      return amount
    }
    const rate = exchangeRates[fromCurrency]
    if (!rate || rate === 0) {
      return amount
    }
    return amount / rate
  }

  const getTotalAmount = (): number => {
    if (!stats?.byCurrency) return 0
    return stats.byCurrency.reduce((sum, curr) => {
      return sum + convertAmount(curr.totalAmount, curr.currency)
    }, 0)
  }

  const getUserTotalSpent = (userByCurrency: { currency: string; totalSpent: number }[]): number => {
    return userByCurrency.reduce((sum, curr) => {
      return sum + convertAmount(curr.totalSpent, curr.currency)
    }, 0)
  }

  const handleAddManually = () => {
    setPrefillData({
      groupId: group.id,
      currency: group.currency || 'RSD',
    })
    setIsReceiptModalOpen(true)
    setShowAddDropdown(false)
  }

  const handleScanQr = () => {
    openQrScannerWithContext({
      groupId: group.id,
      paidById: user?.id,
    })
    setShowAddDropdown(false)
  }

  return (
    <AppLayout>
      {/* Hero header */}
      <div className="mb-6 sm:mb-8">
        {/* Nav bar */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/groups')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(id!) })}
              title={t('groups.detail.refresh')}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowArchiveConfirm(true)}
                disabled={archiveGroup.isPending || unarchiveGroup.isPending}
              >
                {archiveGroup.isPending || unarchiveGroup.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : group.isArchived ? (
                  <ArchiveRestore className="h-4 w-4" />
                ) : (
                  <Archive className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">
                  {group.isArchived ? t('groups.archive.unarchiveButton') : t('groups.archive.button')}
                </span>
              </Button>
            )}
            {!isOwner && !group.isArchived && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLeaveConfirm(true)}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{t('groups.detail.leaveGroup')}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Group identity + stats hero */}
        <div className="rounded-2xl bg-gradient-to-br from-primary/[0.06] to-primary/[0.02] border border-primary/[0.08] p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
            {/* Group icon + name */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                {group.icon && <span className="text-3xl sm:text-4xl">{group.icon}</span>}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-3xl font-bold tracking-tight truncate">
                      {group.name}
                    </h2>
                    {group.isArchived && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground shrink-0">
                        {t('groups.archive.archivedBadge')}
                      </span>
                    )}
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => setIsEditModalOpen(true)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  {group.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {group.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Member avatars row */}
              <div className="flex items-center gap-3 mt-3 sm:mt-4">
                <div className="flex -space-x-2">
                  {acceptedMembers.slice(0, 5).map((member) => (
                    <div key={member.id} className="ring-2 ring-background rounded-full">
                      <Avatar
                        firstName={member.user?.firstName}
                        lastName={member.user?.lastName}
                        imageUrl={member.user?.profileImageUrl}
                        size="sm"
                      />
                    </div>
                  ))}
                  {acceptedMembers.length > 5 && (
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-xs font-semibold ring-2 ring-background">
                      +{acceptedMembers.length - 5}
                    </div>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {t('groups.detail.members', { count: acceptedMembers.length })}
                </span>
              </div>
            </div>

            {/* Stats summary */}
            <div className="flex gap-6 sm:gap-8 shrink-0">
              <div className="sm:text-right">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  {t('groups.detail.totalReceipts')}
                </p>
                <p className="text-2xl sm:text-3xl font-bold tabular-nums">
                  {statsLoading ? '...' : (stats?.totalReceipts ?? 0)}
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  {t('groups.detail.totalAmount')}
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-primary tabular-nums">
                  {statsLoading ? '...' : formatAmount(getTotalAmount())}
                </p>
                {stats && stats.byCurrency.length > 1 && (
                  <div className="flex flex-wrap gap-1 mt-1 sm:justify-end">
                    {stats.byCurrency.map((curr, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-1.5 py-0.5 rounded bg-background/80 text-muted-foreground"
                      >
                        {formatAmount(curr.totalAmount, curr.currency)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Currency selector + actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-primary/[0.08]">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wallet className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{t('groups.detail.displayCurrency')}</span>
              <Select value={displayCurrency} onValueChange={setDisplayCurrency}>
                <SelectTrigger className="h-7 w-auto min-w-[80px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.id} value={c.code}>
                      {getCurrencyFlag(c.code)} {c.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {ratesLoading && <Loader2 className="h-3 w-3 animate-spin" />}
            </div>

            {!group.isArchived && (
              <div className="flex gap-2">
                <div className="relative flex-1 sm:flex-initial" ref={dropdownRef}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => setShowAddDropdown(!showAddDropdown)}
                  >
                    <Plus className="h-4 w-4" />
                    {t('receipts.addManually')}
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                  {showAddDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-lg shadow-md z-50 p-1.5 animate-in fade-in-0 zoom-in-95">
                      <button
                        onClick={handleAddManually}
                        className="w-full px-3 py-2.5 text-left text-sm hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        {t('receipts.addBlank')}
                      </button>
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  className="flex-1 sm:flex-initial"
                  onClick={handleScanQr}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                  {t('receipts.scanQr')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Per-member breakdown (compact, below hero) */}
      {stats && stats.perUser.length > 0 && (
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
          {stats.perUser.map((u) => (
            <div
              key={u.userId}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-sm"
            >
              <span className="font-medium">{u.firstName} {u.lastName}</span>
              <span className="text-muted-foreground">
                {formatAmount(getUserTotalSpent(u.byCurrency))}
              </span>
              <span className="text-xs text-muted-foreground/70">
                ({u.receiptsCount})
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Left column: Receipts and Balances */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Receipts Table */}
          <Card className="max-sm:border-0 max-sm:shadow-none max-sm:bg-transparent">
            <CardHeader className="max-sm:px-0">
              <CardTitle className="flex items-center gap-2">
                <ReceiptIcon className="h-5 w-5" />
                {t('groups.detail.receipts')}
              </CardTitle>
            </CardHeader>
            <CardContent className="max-sm:px-0">
              <GroupReceiptsTable groupId={group.id} isArchived={!!group.isArchived} />
            </CardContent>
          </Card>

          {/* Balances Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              {t('groups.tabs.balances')}
            </h3>
            <GroupBalancesTab groupId={group.id} displayCurrency={displayCurrency} exchangeRates={exchangeRates} />
          </div>
        </div>

        {/* Right column: Members then Activity */}
        <div className="space-y-4 sm:space-y-6">
          {/* Members Card */}
          <Card className="max-sm:border-0 max-sm:shadow-none max-sm:bg-transparent">
            <CardHeader className="pb-3 max-sm:px-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                {t('groups.detail.members', { count: acceptedMembers.length })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-sm:px-0">
              {/* Accepted Members */}
              <div className="space-y-1">
                {acceptedMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors -mx-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar
                        firstName={member.user?.firstName}
                        lastName={member.user?.lastName}
                        imageUrl={member.user?.profileImageUrl}
                        size="sm"
                      />
                      <div className="flex items-center gap-1.5 min-w-0">
                        {member.role === 'owner' && (
                          <Crown className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
                        )}
                        <span className="text-sm truncate">
                          {member.user?.firstName || member.user?.lastName
                            ? `${member.user?.firstName || ''} ${member.user?.lastName || ''}`.trim()
                            : member.user?.email || t('common.unknown')}
                        </span>
                      </div>
                    </div>
                    {isAdmin && !group.isArchived && member.role !== 'owner' && member.userId !== user?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100"
                        onClick={() => handleRemoveMemberClick(member.userId)}
                        disabled={removeMember.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Pending Invites */}
              {pendingMembers.length > 0 && (
                <div className="pt-3 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {t('groups.detail.pendingInvites', { count: pendingMembers.length })}
                  </p>
                  <div className="space-y-1">
                    {pendingMembers.map((member) => {
                      const isExpired = member.expiresAt && new Date(member.expiresAt) < new Date()
                      return (
                        <div
                          key={member.id}
                          className="flex items-center justify-between py-1.5"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm text-muted-foreground truncate">
                              {member.invitedEmail || member.user?.email}
                            </span>
                            {isExpired && (
                              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-red-100 text-red-700 shrink-0">
                                {t('groups.detail.inviteExpired')}
                              </span>
                            )}
                          </div>
                          {isAdmin && !group.isArchived && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={() => handleRemoveMemberClick(member.id)}
                              disabled={removeMember.isPending}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Invite Member */}
              {isAdmin && !group.isArchived && (
                <div className="pt-3 border-t">
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder={t('groups.detail.emailPlaceholder')}
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                      className="flex-1 h-9 text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={handleInvite}
                      disabled={!inviteEmail.trim() || inviteMember.isPending}
                    >
                      {inviteMember.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Invite Link */}
              {isAdmin && !group.isArchived && (
                <InviteLinkCard groupId={group.id} />
              )}
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <ActivityFeed groupId={group.id} />
        </div>
      </div>

      {/* Edit Group Modal */}
      <GroupModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        group={group}
        mode="edit"
      />

      {/* Leave Group Confirm Dialog */}
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

      {/* Remove Member Confirm Dialog */}
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

      {/* Archive Confirm Dialog */}
      <ConfirmDialog
        open={showArchiveConfirm}
        onOpenChange={setShowArchiveConfirm}
        title={group.isArchived ? t('groups.archive.unarchiveTitle') : t('groups.archive.confirmTitle')}
        description={
          group.isArchived
            ? t('groups.archive.unarchiveDescription', { name: group.name })
            : t('groups.archive.confirmDescription', { name: group.name })
        }
        onConfirm={handleArchiveConfirm}
        confirmText={group.isArchived ? t('groups.archive.unarchiveButton') : t('groups.archive.button')}
        isLoading={archiveGroup.isPending || unarchiveGroup.isPending}
      />

      {/* Receipt Modal */}
      <Suspense fallback={null}>
        {isReceiptModalOpen && (
          <ReceiptModal
            open={isReceiptModalOpen}
            onOpenChange={setIsReceiptModalOpen}
            receipt={null}
            mode="create"
            prefillData={prefillData}
          />
        )}
      </Suspense>

      {scannerModals}
    </AppLayout>
  )
}
