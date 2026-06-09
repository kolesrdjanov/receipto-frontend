import { useEffect, useMemo, useState, lazy, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '@/components/layout/app-layout'
import { PageToolbar } from '@/components/layout/page-toolbar'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { CurrencySelect } from '@/components/ui/currency-select'
import { useExchangeRates } from '@/hooks/currencies/use-currency-converter'
import { useSettingsStore } from '@/store/settings'
import { useAuthStore } from '@/store/auth'
import { useFabStore } from '@/store/fab'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  useGroup,
  useRemoveMember,
  useLeaveGroup,
  useArchiveGroup,
  useUnarchiveGroup,
  useSettlementHistory,
  type GroupMember,
} from '@/hooks/groups/use-groups'
import { useGroupPolling } from '@/hooks/groups/use-group-polling'
import { useReceiptScanner } from '@/hooks/receipts/use-receipt-scanner'
import { useDeleteReceipt, type Receipt } from '@/hooks/receipts/use-receipts'
import { getErrorMessage } from '@/lib/api'
import { memberName, type ComputedSettlement } from '@/lib/groups'
import { GroupModal } from '@/components/groups/group-modal'
import { SettlementModal } from '@/components/groups/settlement-modal'
import { ExpenseDetailDialog } from '@/components/groups/expense-detail-dialog'
import { GroupMenuDialog } from '@/components/groups/group-menu-dialog'
import { InviteDialog } from '@/components/groups/invite-dialog'
import { GroupOverview } from '@/components/groups/group-overview'
import { GroupExpensesList } from '@/components/groups/group-expenses-list'
import { GroupBalancePanel } from '@/components/groups/group-balance-panel'
import { GroupActivityTimeline } from '@/components/groups/group-activity-timeline'
import { GroupMembersPanel } from '@/components/groups/group-members-panel'
import { GroupHistoryList } from '@/components/groups/group-history-list'
import { GAvatarStack, GroupTabs } from '@/components/groups/primitives'
import { toast } from 'sonner'
import { ArrowLeft, MoreHorizontal, ChevronRight, Camera, Plus, Loader2 } from 'lucide-react'

const ReceiptModal = lazy(() =>
  import('@/components/receipts/receipt-modal').then((m) => ({ default: m.ReceiptModal })),
)

type Screen = 'overview' | 'expenses' | 'balances' | 'activity' | 'members' | 'history'

export default function GroupDetail() {
  const { t } = useTranslation()
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isMobile = useIsMobile(768)
  const { user } = useAuthStore()
  const { currency: preferredCurrency } = useSettingsStore()

  const { data: group, isLoading } = useGroup(id)
  useGroupPolling(id)
  const { data: settlementHistory = [] } = useSettlementHistory(id)
  const [displayCurrency, setDisplayCurrency] = useState(preferredCurrency || 'RSD')
  useExchangeRates(displayCurrency)

  const removeMember = useRemoveMember()
  const leaveGroup = useLeaveGroup()
  const archiveGroup = useArchiveGroup()
  const unarchiveGroup = useUnarchiveGroup()
  const deleteReceipt = useDeleteReceipt()
  const { openQrScannerWithContext, scannerModals } = useReceiptScanner()

  const [screen, setScreen] = useState<Screen>('overview')
  const [returnScreen, setReturnScreen] = useState<Screen>('overview')

  // Overlays
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [receiptModalMode, setReceiptModalMode] = useState<'create' | 'edit'>('create')
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null)
  const [detailReceipt, setDetailReceipt] = useState<Receipt | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [settleOpen, setSettleOpen] = useState(false)
  const [settlePrefill, setSettlePrefill] = useState<{ fromUserId?: string; toUserId?: string; amount?: number }>({})
  const [editGroupOpen, setEditGroupOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)

  // Confirm dialogs
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<GroupMember | null>(null)
  const [receiptToDelete, setReceiptToDelete] = useState<Receipt | null>(null)

  // Default the display currency to the group's currency once loaded.
  useEffect(() => {
    if (group?.currency) setDisplayCurrency(group.currency)
  }, [group?.currency])

  const currentMember = group?.members?.find((m) => m.userId === user?.id)
  const isOwner = currentMember?.role === 'owner'
  const isAdmin = currentMember?.role === 'admin' || isOwner
  const isArchived = !!group?.isArchived
  const acceptedMembers = useMemo(
    () => group?.members?.filter((m) => m.status === 'accepted') || [],
    [group?.members],
  )

  // Actions ---------------------------------------------------------------
  const openAdd = () => {
    setReceiptModalMode('create')
    setEditingReceipt(null)
    setReceiptModalOpen(true)
  }
  const openScan = () => openQrScannerWithContext({ groupId: id, paidById: user?.id })
  const openEditExpense = (receipt: Receipt) => {
    setReceiptModalMode('edit')
    setEditingReceipt(receipt)
    setReceiptModalOpen(true)
  }
  const openExpenseDetail = (receipt: Receipt) => {
    setDetailReceipt(receipt)
    setDetailOpen(true)
  }
  const onSettle = (s: ComputedSettlement) => {
    setSettlePrefill({ fromUserId: s.from.userId, toUserId: s.to.userId, amount: s.amount })
    setSettleOpen(true)
  }
  const goScreen = (s: Screen) => {
    if ((s === 'members' || s === 'history') && screen !== 'members' && screen !== 'history') setReturnScreen(screen)
    setScreen(s)
  }

  // Mobile FAB → add expense (when on a group surface, not archived)
  const setFab = useFabStore((s) => s.setFab)
  const clearFab = useFabStore((s) => s.clearFab)
  useEffect(() => {
    if (isArchived) return
    setFab(openAdd)
    return () => clearFab()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isArchived, setFab, clearFab])

  // Confirm handlers ------------------------------------------------------
  const confirmRemoveMember = async () => {
    if (!memberToRemove) return
    const memberId = memberToRemove.status === 'accepted' ? memberToRemove.userId : memberToRemove.id
    try {
      await removeMember.mutateAsync({ groupId: id, memberId })
      toast.success(t('groups.detail.memberRemoved'))
      setMemberToRemove(null)
    } catch (error) {
      toast.error(getErrorMessage(error, t('groups.detail.removeMemberError')))
    }
  }
  const confirmLeave = async () => {
    try {
      await leaveGroup.mutateAsync(id)
      toast.success(t('groups.detail.leftGroup'))
      setLeaveOpen(false)
      navigate('/groups')
    } catch (error) {
      toast.error(getErrorMessage(error, t('groups.detail.leaveError')))
    }
  }
  const confirmArchive = async () => {
    try {
      if (isArchived) {
        await unarchiveGroup.mutateAsync(id)
        toast.success(t('groups.archive.unarchiveSuccess'))
      } else {
        await archiveGroup.mutateAsync(id)
        toast.success(t('groups.archive.success'))
      }
      setArchiveOpen(false)
    } catch (error) {
      toast.error(getErrorMessage(error, isArchived ? t('groups.archive.unarchiveError') : t('groups.archive.error')))
    }
  }
  const confirmDeleteExpense = async () => {
    if (!receiptToDelete) return
    try {
      await deleteReceipt.mutateAsync(receiptToDelete.id)
      toast.success(t('receipts.modal.deleteSuccess'))
      setReceiptToDelete(null)
    } catch (error) {
      toast.error(t('receipts.modal.deleteError'), { description: getErrorMessage(error) })
    }
  }

  // Loading / not found ---------------------------------------------------
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }
  if (!group) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-muted-foreground">{t('common.noData')}</p>
          <Button variant="link" onClick={() => navigate('/groups')}>
            <ArrowLeft className="size-4" />
            {t('common.back')}
          </Button>
        </div>
      </AppLayout>
    )
  }

  const settleHandler = isArchived ? undefined : onSettle

  // Tab bodies ------------------------------------------------------------
  const renderBody = (s: Screen) => {
    switch (s) {
      case 'overview':
        return (
          <GroupOverview
            groupId={id}
            members={acceptedMembers}
            displayCurrency={displayCurrency}
            currentUserId={user?.id}
            isArchived={isArchived}
            onAdd={openAdd}
            onGoBalances={() => setScreen('balances')}
            onSeeAllExpenses={() => setScreen('expenses')}
            onOpenExpense={openExpenseDetail}
            onSettle={onSettle}
          />
        )
      case 'expenses':
        return (
          <GroupExpensesList
            groupId={id}
            members={acceptedMembers}
            currentUserId={user?.id}
            displayCurrency={displayCurrency}
            isArchived={isArchived}
            onOpenExpense={openExpenseDetail}
            onAdd={openAdd}
          />
        )
      case 'balances':
        return (
          <GroupBalancePanel
            groupId={id}
            displayCurrency={displayCurrency}
            currentUserId={user?.id}
            settlementsCount={settlementHistory.length}
            onSettle={settleHandler ?? (() => {})}
            onOpenHistory={() => goScreen('history')}
          />
        )
      case 'activity':
        return <GroupActivityTimeline groupId={id} />
      case 'members':
        return (
          <GroupMembersPanel
            group={group}
            isAdmin={isAdmin}
            isArchived={isArchived}
            currentUserId={user?.id}
            onInvite={() => setInviteOpen(true)}
            onRemoveMember={setMemberToRemove}
          />
        )
      case 'history':
        return <GroupHistoryList groupId={id} displayCurrency={displayCurrency} />
    }
  }

  const membersButton = (
    <button
      type="button"
      onClick={() => goScreen('members')}
      className="flex items-center gap-2 text-[12.5px] font-semibold text-muted-foreground"
    >
      {/* raw-button-ok: tappable members summary (avatar stack → members screen) */}
      <GAvatarStack members={acceptedMembers.map((m) => m.user)} max={5} size={24} currentUserId={user?.id} />
      <span>{t('groups.membersCount', { count: acceptedMembers.length })}</span>
      <ChevronRight className="size-3.5 text-fg-faint" />
    </button>
  )

  const currencyControl = (
    <CurrencySelect
      value={displayCurrency}
      onValueChange={setDisplayCurrency}
      triggerClassName="h-9 w-auto min-w-[90px] text-[13px]"
    />
  )

  const overlays = (
    <>
      <Suspense fallback={null}>
        {receiptModalOpen && (
          <ReceiptModal
            open={receiptModalOpen}
            onOpenChange={setReceiptModalOpen}
            receipt={editingReceipt}
            mode={receiptModalMode}
            prefillData={
              receiptModalMode === 'create' ? { groupId: id, currency: group.currency || 'RSD' } : undefined
            }
            onRequestDelete={(r) => setReceiptToDelete(r)}
          />
        )}
      </Suspense>

      <ExpenseDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        receipt={detailReceipt}
        members={acceptedMembers}
        isArchived={isArchived}
        onEdit={openEditExpense}
        onDelete={(r) => setReceiptToDelete(r)}
      />

      <SettlementModal
        open={settleOpen}
        onOpenChange={setSettleOpen}
        groupId={id}
        currency={displayCurrency}
        members={acceptedMembers}
        prefillData={settlePrefill}
      />

      <GroupModal open={editGroupOpen} onOpenChange={setEditGroupOpen} group={group} mode="edit" />

      <GroupMenuDialog
        open={menuOpen}
        onOpenChange={setMenuOpen}
        group={group}
        isOwner={isOwner}
        isAdmin={isAdmin}
        onEdit={() => setEditGroupOpen(true)}
        onInvite={() => setInviteOpen(true)}
        onManageMembers={() => goScreen('members')}
        onScan={openScan}
        onArchiveToggle={() => setArchiveOpen(true)}
        onLeave={() => setLeaveOpen(true)}
      />

      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} group={group} />

      <ConfirmDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        title={t('groups.detail.leaveGroupTitle')}
        description={t('groups.detail.leaveConfirm')}
        onConfirm={confirmLeave}
        confirmText={t('groups.detail.leaveGroup')}
        variant="destructive"
        isLoading={leaveGroup.isPending}
      />

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={isArchived ? t('groups.archive.unarchiveTitle') : t('groups.archive.confirmTitle')}
        description={
          isArchived
            ? t('groups.archive.unarchiveDescription', { name: group.name })
            : t('groups.archive.confirmDescription', { name: group.name })
        }
        onConfirm={confirmArchive}
        confirmText={isArchived ? t('groups.archive.unarchiveButton') : t('groups.archive.button')}
        isLoading={archiveGroup.isPending || unarchiveGroup.isPending}
      />

      <ConfirmDialog
        open={!!memberToRemove}
        onOpenChange={(o) => !o && setMemberToRemove(null)}
        title={t('groups.detail.removeMemberTitle')}
        description={t('groups.members.removeConfirm', {
          name:
            memberToRemove?.status === 'accepted'
              ? memberName(memberToRemove?.user)
              : memberToRemove?.invitedEmail || memberToRemove?.user?.email || '',
        })}
        onConfirm={confirmRemoveMember}
        confirmText={t('common.delete')}
        variant="destructive"
        isLoading={removeMember.isPending}
      />

      <ConfirmDialog
        open={!!receiptToDelete}
        onOpenChange={(o) => !o && setReceiptToDelete(null)}
        title={t('receipts.modal.deleteTitle')}
        description={t('receipts.modal.deleteConfirm', {
          store: receiptToDelete?.storeName || t('receipts.unknownStore'),
        })}
        onConfirm={confirmDeleteExpense}
        confirmText={t('common.delete')}
        variant="destructive"
        isLoading={deleteReceipt.isPending}
      />

      {scannerModals}
    </>
  )

  // ----------------------------------------------------------------------
  // MOBILE
  // ----------------------------------------------------------------------
  if (isMobile) {
    if (screen === 'members' || screen === 'history') {
      return (
        <AppLayout>
          <PushedHeader
            title={
              screen === 'members'
                ? `${t('groups.tabsNav.members')} · ${group.name}`
                : t('groups.settlements.history')
            }
            onBack={() => setScreen(returnScreen)}
          />
          {renderBody(screen)}
          {overlays}
        </AppLayout>
      )
    }
    return (
      <AppLayout>
        <div className="-mt-2 mb-2 flex items-center justify-between">
          <Button variant="ghost" size="icon" className="size-9" onClick={() => navigate('/groups')} aria-label={t('common.back')}>
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex items-center gap-1">
            {currencyControl}
            <Button variant="ghost" size="icon" className="size-9" onClick={() => setMenuOpen(true)} aria-label={t('groups.menu.title')}>
              <MoreHorizontal className="size-5" />
            </Button>
          </div>
        </div>
        <div className="mb-3.5 flex items-center gap-3">
          <span className="grid size-[52px] shrink-0 place-items-center rounded-2xl bg-bg-subtle text-[28px]">
            {group.icon || '👥'}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[22px] font-extrabold tracking-[-0.02em]">{group.name}</div>
            <div className="mt-1">{membersButton}</div>
          </div>
        </div>
        <div className="mb-4">
          <GroupTabs
            tabs={[
              { id: 'overview', label: t('groups.tabsNav.overview') },
              { id: 'expenses', label: t('groups.tabsNav.expenses') },
              { id: 'balances', label: t('groups.tabsNav.balances') },
              { id: 'activity', label: t('groups.tabsNav.activity') },
            ]}
            active={screen}
            onChange={(s) => setScreen(s as Screen)}
          />
        </div>
        {renderBody(screen)}
        {overlays}
      </AppLayout>
    )
  }

  // ----------------------------------------------------------------------
  // DESKTOP — two columns (left tabs + content, right persistent balance rail)
  // ----------------------------------------------------------------------
  const leftTab: Screen = (['expenses', 'activity', 'members'] as Screen[]).includes(screen)
    ? screen
    : screen === 'history'
      ? 'history'
      : 'expenses'

  return (
    <AppLayout>
      <PageToolbar
        title={group.name}
        subtitle={group.description || t('groups.membersCount', { count: acceptedMembers.length })}
        actions={
          <>
            {currencyControl}
            {!isArchived && (
              <Button variant="outline" size="icon" onClick={openScan} aria-label={t('receipts.scanQr')}>
                <Camera className="size-4" />
              </Button>
            )}
            {!isArchived && (
              <Button variant="brand" onClick={openAdd}>
                <Plus className="size-[17px]" />
                {t('groups.expense.addExpense')}
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={() => setMenuOpen(true)} aria-label={t('groups.menu.title')}>
              <MoreHorizontal className="size-4" />
            </Button>
          </>
        }
      />

      <div className="mx-auto mt-6 max-w-[1080px]">
        <Button variant="ghost" size="sm" className="mb-3 -ml-2 text-muted-foreground" onClick={() => navigate('/groups')}>
          <ArrowLeft className="size-4" />
          {t('groups.title')}
        </Button>

        <div className="flex items-center gap-3.5">
          <span className="grid size-[52px] shrink-0 place-items-center rounded-2xl bg-bg-subtle text-[28px]">
            {group.icon || '👥'}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[24px] font-extrabold tracking-[-0.02em]">{group.name}</div>
            <div className="mt-1">{membersButton}</div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 items-start gap-5 lg:grid-cols-[1.55fr_1fr]">
          {/* Left: tabbed content */}
          <div className="flex flex-col">
            {screen === 'history' ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mb-3 -ml-2 w-fit text-muted-foreground"
                  onClick={() => setScreen(returnScreen === 'history' ? 'expenses' : returnScreen)}
                >
                  <ArrowLeft className="size-4" />
                  {t('groups.settlements.history')}
                </Button>
                {renderBody('history')}
              </>
            ) : (
              <>
                <div className="mb-4 max-w-[460px]">
                  <GroupTabs
                    tabs={[
                      { id: 'expenses', label: t('groups.tabsNav.expenses') },
                      { id: 'activity', label: t('groups.tabsNav.activity') },
                      { id: 'members', label: t('groups.tabsNav.members') },
                    ]}
                    active={leftTab}
                    onChange={(s) => setScreen(s as Screen)}
                  />
                </div>
                {renderBody(leftTab)}
              </>
            )}
          </div>

          {/* Right: persistent balance rail */}
          <div className="lg:sticky lg:top-24">
            <GroupBalancePanel
              groupId={id}
              displayCurrency={displayCurrency}
              currentUserId={user?.id}
              settlementsCount={settlementHistory.length}
              compactHeadline
              onSettle={settleHandler ?? (() => {})}
              onOpenHistory={() => goScreen('history')}
            />
          </div>
        </div>
      </div>

      {overlays}
    </AppLayout>
  )

  // Shared overlays (declared after render branches so every layout includes them) -----------
  function PushedHeader({ title, onBack }: { title: string; onBack: () => void }) {
    return (
      <div className="-mt-2 mb-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" className="size-9" onClick={onBack} aria-label={t('common.back')}>
          <ArrowLeft className="size-5" />
        </Button>
        <div className="truncate text-[16px] font-bold">{title}</div>
      </div>
    )
  }
}
