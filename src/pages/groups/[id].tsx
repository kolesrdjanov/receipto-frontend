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
import { useCreateReceipt, type Receipt } from '@/hooks/receipts/use-receipts'
import { useAuthStore } from '@/store/auth'
import { queryKeys } from '@/lib/query-keys'
import { GroupModal } from '@/components/groups/group-modal'
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
const QrScanner = lazy(() => import('@/components/receipts/qr-scanner').then(m => ({ default: m.QrScanner })))

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
  const [isScannerOpen, setIsScannerOpen] = useState(false)
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
  const createReceipt = useCreateReceipt()

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
      // Role priority: owner > admin > member
      const rolePriority = { owner: 0, admin: 1, member: 2 }
      const aPriority = rolePriority[a.role] ?? 2
      const bPriority = rolePriority[b.role] ?? 2

      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }

      // Then sort by name
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

  // Convert amount from one currency to the display currency
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

  // Calculate total amount from all currencies
  const getTotalAmount = (): number => {
    if (!stats?.byCurrency) return 0
    return stats.byCurrency.reduce((sum, curr) => {
      return sum + convertAmount(curr.totalAmount, curr.currency)
    }, 0)
  }

  // Calculate user's total spent from all currencies
  const getUserTotalSpent = (userByCurrency: { currency: string; totalSpent: number }[]): number => {
    return userByCurrency.reduce((sum, curr) => {
      return sum + convertAmount(curr.totalSpent, curr.currency)
    }, 0)
  }

  // Receipt entry handlers
  const handleAddManually = () => {
    setPrefillData({
      groupId: group.id,
      currency: group.currency || 'RSD', // Use group's default currency
    })
    setIsReceiptModalOpen(true)
    setShowAddDropdown(false)
  }

  const handleScanQr = () => {
    setIsScannerOpen(true)
    setShowAddDropdown(false)
  }

  const handleQrScan = async (url: string) => {
    try {
      await createReceipt.mutateAsync({
        qrCodeUrl: url,
        groupId: group.id,
        paidById: user?.id,
      })
      toast.success(t('receipts.qrScanner.scanSuccess'), {
        description: t('receipts.qrScanner.scanSuccessDescription'),
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('receipts.qrScanner.scanError')
      toast.error(errorMessage)
    }
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/groups')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            {group.icon && <span className="text-4xl">{group.icon}</span>}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {group.name}
                </h2>
                {group.isArchived && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                    {t('groups.archive.archivedBadge')}
                  </span>
                )}
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setIsEditModalOpen(true)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {group.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {group.description}
                </p>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <Wallet className="h-4 w-4" />
                <span>{t('groups.detail.displayCurrency')}</span>
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
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(id!) })}
              title={t('groups.detail.refresh')}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            {/* Add Receipt Buttons - hidden when archived */}
            {!group.isArchived && (
              <>
                <div className="relative" ref={dropdownRef}>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddDropdown(!showAddDropdown)}
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('receipts.addManually')}</span>
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                  {showAddDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-popover/95 backdrop-blur-lg border border-border/50 rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in-0 zoom-in-95">
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
                  variant="glossy"
                  onClick={handleScanQr}
                  disabled={createReceipt.isPending}
                >
                  {createReceipt.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{t('receipts.scanQr')}</span>
                </Button>
              </>
            )}

            {isOwner && (
              <Button
                variant="outline"
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
                onClick={() => setShowLeaveConfirm(true)}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{t('groups.detail.leaveGroup')}</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Summary and Balances */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ReceiptIcon className="h-5 w-5" />
                {t('groups.tabs.summary')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : stats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">
                        {t('groups.detail.totalReceipts')}
                      </p>
                      <p className="text-2xl font-bold">{stats.totalReceipts}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">
                        {t('groups.detail.totalAmount')}
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        {formatAmount(getTotalAmount())}
                      </p>
                      {/* Show breakdown by currency if multiple */}
                      {stats.byCurrency.length > 1 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {stats.byCurrency.map((curr, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                            >
                              {formatAmount(curr.totalAmount, curr.currency)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {stats.perUser.length > 0 && (
                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium text-muted-foreground mb-3">
                        {t('groups.detail.perMember')}
                      </p>
                      <div className="space-y-2">
                        {stats.perUser.map((u) => (
                          <div
                            key={u.userId}
                            className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                          >
                            <span className="font-medium">
                              {u.firstName} {u.lastName}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {formatAmount(getUserTotalSpent(u.byCurrency))}{' '}
                              <span className="text-xs">({u.receiptsCount})</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  {t('groups.balances.noExpenses')}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Receipts Table */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ReceiptIcon className="h-5 w-5" />
              {t('groups.detail.receipts')}
            </h3>
            <GroupReceiptsTable groupId={group.id} isArchived={!!group.isArchived} />
          </div>

          {/* Balances Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              {t('groups.tabs.balances')}
            </h3>
            <GroupBalancesTab groupId={group.id} displayCurrency={displayCurrency} exchangeRates={exchangeRates} />
          </div>
        </div>

        {/* Right column: Members and Activity */}
        <div className="space-y-6">
          {/* Activity Feed */}
          <ActivityFeed groupId={group.id} />

          {/* Members Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('groups.detail.members', { count: acceptedMembers.length })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Accepted Members */}
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
                        {member.role === 'owner' && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className="text-sm">
                          {member.user?.firstName || member.user?.lastName
                            ? `${member.user?.firstName || ''} ${member.user?.lastName || ''}`.trim()
                            : member.user?.email || t('common.unknown')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({member.role})
                        </span>
                      </div>
                    </div>
                    {isAdmin && !group.isArchived && member.role !== 'owner' && member.userId !== user?.id && (
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

              {/* Pending Invites */}
              {pendingMembers.length > 0 && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    {t('groups.detail.pendingInvites', { count: pendingMembers.length })}
                  </h4>
                  <div className="space-y-2">
                    {pendingMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                      >
                        <span className="text-sm text-muted-foreground">
                          {member.invitedEmail || member.user?.email}
                        </span>
                        {isAdmin && !group.isArchived && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMemberClick(member.id)}
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

              {/* Invite Member - hidden when archived */}
              {isAdmin && !group.isArchived && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    {t('groups.detail.inviteMember')}
                  </h4>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder={t('groups.detail.emailPlaceholder')}
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleInvite}
                      disabled={!inviteEmail.trim() || inviteMember.isPending}
                    >
                      {inviteMember.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        t('groups.detail.invite')
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
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

      {/* QR Scanner */}
      <Suspense fallback={null}>
        {isScannerOpen && (
          <QrScanner
            open={isScannerOpen}
            onOpenChange={setIsScannerOpen}
            onScan={handleQrScan}
          />
        )}
      </Suspense>
    </AppLayout>
  )
}
