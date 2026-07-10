import { useEffect, useMemo, useState, lazy, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '@/components/layout/app-layout'
import { PageContent } from '@/components/layout/page-content'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { HeaderCurrencyPill, HeaderIconButton } from '@/components/layout/header-actions'
import { AddButton } from '@/components/glass/empty-state'
import { useExchangeRates } from '@/hooks/currencies/use-currency-converter'
import { useSettingsStore } from '@/store/settings'
import { useAuthStore } from '@/store/auth'
import { useFabStore } from '@/store/fab'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  useGroup,
  useGroupStats,
  useRemoveMember,
  useLeaveGroup,
  useArchiveGroup,
  useUnarchiveGroup,
  useDeleteGroup,
  useSettlementHistory,
  type GroupMember,
} from '@/hooks/groups/use-groups'
import { useGroupPolling } from '@/hooks/groups/use-group-polling'
import { useReceiptScanner } from '@/hooks/receipts/use-receipt-scanner'
import { useDeleteReceipt, type Receipt } from '@/hooks/receipts/use-receipts'
import { getErrorMessage } from '@/lib/api'
import { memberName, type ComputedSettlement } from '@/lib/groups'
import { SettlementModal } from '@/components/groups/settlement-modal'
import { ExpenseDetailDialog } from '@/components/groups/expense-detail-dialog'
import { GroupExpenseSheet } from '@/components/groups/group-expense-sheet'
import { GroupManageSheet } from '@/components/groups/group-manage-sheet'
import { GroupHero } from '@/components/groups/group-hero'
import { GroupExpensesList } from '@/components/groups/group-expenses-list'
import { GroupHistoryList } from '@/components/groups/group-history-list'
import { GAvatarStack, SectionLabel } from '@/components/groups/primitives'
import { toast } from 'sonner'
import { ArrowLeft, MoreHorizontal, ChevronRight, Camera, Settings2, Loader2 } from 'lucide-react'

const ReceiptModal = lazy(() =>
  import('@/components/receipts/receipt-modal').then((m) => ({ default: m.ReceiptModal })),
)

export default function GroupDetail() {
  const { t } = useTranslation()
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isMobile = useIsMobile(768)
  const { user } = useAuthStore()
  const { currency: preferredCurrency } = useSettingsStore()

  const { data: group, isLoading } = useGroup(id)
  const { data: stats } = useGroupStats(id)
  useGroupPolling(id)
  const { data: settlementHistory = [] } = useSettlementHistory(id)
  // Display currency defaults to the group's currency (then the user's preference), with an
  // explicit override once the user picks one from the header pill — no state-syncing effect.
  const [currencyOverride, setCurrencyOverride] = useState<string | null>(null)
  const displayCurrency = currencyOverride || group?.currency || preferredCurrency || 'RSD'
  const setDisplayCurrency = setCurrencyOverride
  useExchangeRates(displayCurrency)

  const removeMember = useRemoveMember()
  const leaveGroup = useLeaveGroup()
  const archiveGroup = useArchiveGroup()
  const unarchiveGroup = useUnarchiveGroup()
  const deleteGroup = useDeleteGroup()
  const deleteReceipt = useDeleteReceipt()
  const { openQrScannerWithContext, scannerModals } = useReceiptScanner()

  // Overlays — collapsed to three feature surfaces: Manage, Settle, and Add expense
  // (plus the read-only expense detail and the receipt editor for existing entries).
  const [expenseSheetOpen, setExpenseSheetOpen] = useState(false)
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null)
  const [detailReceipt, setDetailReceipt] = useState<Receipt | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [settleOpen, setSettleOpen] = useState(false)
  const [settlePrefill, setSettlePrefill] = useState<{ fromUserId?: string; toUserId?: string; amount?: number }>({})
  const [manageOpen, setManageOpen] = useState(false)

  // Confirm dialogs
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<GroupMember | null>(null)
  const [receiptToDelete, setReceiptToDelete] = useState<Receipt | null>(null)

  const currentMember = group?.members?.find((m) => m.userId === user?.id)
  const isOwner = currentMember?.role === 'owner'
  const isArchived = !!group?.isArchived
  const acceptedMembers = useMemo(
    () => group?.members?.filter((m) => m.status === 'accepted') || [],
    [group?.members],
  )
  // The display-currency picker only earns its place when the group mixes currencies.
  const isMultiCurrency = (stats?.byCurrency?.length ?? 0) > 1

  // Actions ---------------------------------------------------------------
  const openAdd = () => setExpenseSheetOpen(true)
  const openScan = () => openQrScannerWithContext({ groupId: id, paidById: user?.id })
  const openEditExpense = (receipt: Receipt) => setEditingReceipt(receipt)
  const openExpenseDetail = (receipt: Receipt) => {
    setDetailReceipt(receipt)
    setDetailOpen(true)
  }
  const onSettle = (s: ComputedSettlement) => {
    setSettlePrefill({ fromUserId: s.from.userId, toUserId: s.to.userId, amount: s.amount })
    setSettleOpen(true)
  }

  // Mobile FAB → add expense (when not archived)
  const setFab = useFabStore((s) => s.setFab)
  const clearFab = useFabStore((s) => s.clearFab)
  useEffect(() => {
    if (isArchived) return
    setFab(openAdd)
    return () => clearFab()
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
  const confirmDelete = async () => {
    try {
      await deleteGroup.mutateAsync(id)
      toast.success(t('groups.modal.deleteSuccess'))
      setDeleteOpen(false)
      navigate('/groups')
    } catch (error) {
      toast.error(t('groups.modal.deleteError'), { description: getErrorMessage(error) })
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
        <PageContent>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
        </PageContent>
      </AppLayout>
    )
  }
  if (!group) {
    return (
      <AppLayout>
        <PageContent>
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-muted-foreground">{t('common.noData')}</p>
          <Button variant="link" onClick={() => navigate('/groups')}>
            <ArrowLeft className="size-4" />
            {t('common.back')}
          </Button>
        </div>
        </PageContent>
      </AppLayout>
    )
  }

  // Shared pieces ---------------------------------------------------------
  const membersButton = (
    <button
      type="button"
      onClick={() => setManageOpen(true)}
      className="flex items-center gap-2 text-[12.5px] font-semibold text-muted-foreground transition-colors hover:text-fg-2"
    >
      {/* raw-button-ok: tappable members summary (avatar stack → Manage sheet) */}
      <GAvatarStack members={acceptedMembers.map((m) => m.user)} max={5} size={24} currentUserId={user?.id} />
      <span>{t('groups.membersCount', { count: acceptedMembers.length })}</span>
      <ChevronRight className="size-3.5 text-fg-faint" />
    </button>
  )

  const currencyControl = isMultiCurrency ? (
    <HeaderCurrencyPill value={displayCurrency} onValueChange={setDisplayCurrency} />
  ) : (
    <span className="px-1 text-[12.5px] font-semibold text-muted-foreground">{displayCurrency}</span>
  )

  const hero = (
    <GroupHero
      groupId={id}
      displayCurrency={displayCurrency}
      currentUserId={user?.id}
      isArchived={isArchived}
      onSettle={onSettle}
    />
  )

  // Detail is tabs-less (Activity retired): the feed owns its "N expenses · total" header
  // (GroupExpensesList), then inline settlement history below it.
  const expensesBody = (
    <GroupExpensesList
      groupId={id}
      members={acceptedMembers}
      currentUserId={user?.id}
      displayCurrency={displayCurrency}
      onOpenExpense={openExpenseDetail}
    />
  )

  const historySection = Array.isArray(settlementHistory) && settlementHistory.length > 0 && (
    <div className="mt-2">
      <div className="px-1">
        <SectionLabel>{t('groups.settlements.history')}</SectionLabel>
      </div>
      <GroupHistoryList groupId={id} displayCurrency={displayCurrency} />
    </div>
  )

  const overlays = (
    <>
      {/* Bespoke group-native Add-expense sheet (handoff §3). */}
      <GroupExpenseSheet
        open={expenseSheetOpen}
        onOpenChange={setExpenseSheetOpen}
        groupId={id}
        groupCurrency={group.currency || 'RSD'}
        members={acceptedMembers}
        currentUserId={user?.id}
      />

      {/* Existing entries keep the full receipt editor (scanned receipts carry receipt fields). */}
      <Suspense fallback={null}>
        {editingReceipt && (
          <ReceiptModal
            open={!!editingReceipt}
            onOpenChange={(o) => !o && setEditingReceipt(null)}
            receipt={editingReceipt}
            mode="edit"
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

      <GroupManageSheet
        open={manageOpen}
        onOpenChange={setManageOpen}
        group={group}
        isOwner={isOwner}
        isArchived={isArchived}
        currentUserId={user?.id}
        onRemoveMember={setMemberToRemove}
        onArchiveToggle={() => {
          setManageOpen(false)
          setArchiveOpen(true)
        }}
        onLeave={() => {
          setManageOpen(false)
          setLeaveOpen(true)
        }}
        onDelete={() => {
          setManageOpen(false)
          setDeleteOpen(true)
        }}
      />

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
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t('groups.modal.deleteTitle')}
        description={t('groups.modal.deleteConfirmDescription', { name: group.name })}
        onConfirm={confirmDelete}
        confirmText={t('common.delete')}
        variant="destructive"
        isLoading={deleteGroup.isPending}
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

  // MOBILE detail ---------------------------------------------------------
  if (isMobile) {
    return (
      <AppLayout>
        <div className="-mt-2 mb-2 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="size-9"
            onClick={() => navigate('/groups')}
            aria-label={t('common.back')}
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex items-center gap-1">
            {currencyControl}
            <Button
              variant="ghost"
              size="icon"
              className="size-9"
              onClick={() => setManageOpen(true)}
              aria-label={t('groups.manage.title')}
            >
              <MoreHorizontal className="size-5" />
            </Button>
          </div>
        </div>
        <div className="mb-3.5 flex items-center gap-3">
          <span className="grid size-[52px] shrink-0 place-items-center rounded-2xl bg-bg-subtle text-[28px]">
            {group.icon || '👥'}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[22px] font-semibold tracking-[-0.02em]">{group.name}</div>
            <div className="mt-1">{membersButton}</div>
          </div>
        </div>
        <div className="flex flex-col gap-3.5">
          {hero}
          {expensesBody}
          {historySection}
        </div>
        {overlays}
      </AppLayout>
    )
  }

  // DESKTOP detail — in-content header (no toolbar, per the handoff), balance hero aside +
  // expenses feed + inline settlement history. Capped at 1000px like the reference.
  return (
    <AppLayout>
      <PageContent className="md:pt-6">
      <div className="mx-auto max-w-[1000px]">
        {/* Back + action cluster */}
        <div className="mb-4 flex items-center gap-2">
          <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" onClick={() => navigate('/groups')}>
            <ArrowLeft className="size-4" />
            {t('groups.title')}
          </Button>
          <div className="ml-auto flex items-center gap-2">
            {currencyControl}
            {!isArchived && <HeaderIconButton icon={Camera} label={t('receipts.scanQr')} onClick={openScan} />}
            {!isArchived && <AddButton onClick={openAdd} label={t('groups.expense.addExpense')} />}
            <Button variant="outline" size="sm" onClick={() => setManageOpen(true)}>
              <Settings2 className="size-4" />
              {t('groups.manage.title')}
            </Button>
          </div>
        </div>

        {/* Identity — tile + name + "N members · CUR" + avatar stack (opens Manage) */}
        <div className="mb-5 flex items-center gap-3.5">
          <span className="grid size-[52px] shrink-0 place-items-center rounded-2xl bg-bg-subtle text-[27px]">
            {group.icon || '👥'}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[24px] font-semibold tracking-[-0.02em]">{group.name}</div>
            <div className="mt-0.5 truncate text-[13px] text-muted-foreground">
              {t('groups.membersCount', { count: acceptedMembers.length })} · {displayCurrency}
            </div>
          </div>
          {/* eslint-disable-next-line no-restricted-syntax -- raw-button-ok: avatar-stack shortcut into the Manage sheet */}
          <button
            type="button"
            onClick={() => setManageOpen(true)}
            className="shrink-0 rounded-full transition-opacity hover:opacity-80"
            aria-label={t('groups.manage.title')}
          >
            <GAvatarStack members={acceptedMembers.map((m) => m.user)} max={5} size={32} currentUserId={user?.id} />
          </button>
        </div>

        {/* Two columns: balance hero (362) + expenses feed (fluid) */}
        <div className="grid grid-cols-1 items-start gap-[22px] lg:grid-cols-[362px_1fr]">
          <div className="lg:sticky lg:top-6">{hero}</div>
          <div className="flex min-w-0 flex-col gap-5">
            {expensesBody}
            {historySection}
          </div>
        </div>
      </div>
      </PageContent>

      {overlays}
    </AppLayout>
  )
}
