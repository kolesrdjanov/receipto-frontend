import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '@/components/layout/app-layout'
import { PageToolbar } from '@/components/layout/page-toolbar'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { EmptyState, AddButton } from '@/components/glass/empty-state'
import { GroupModal } from '@/components/groups/group-modal'
import { GAvatarStack, BalancePill } from '@/components/groups/primitives'
import {
  useGroups,
  usePendingInvites,
  useAcceptInvite,
  useDeclineInvite,
  type Group,
} from '@/hooks/groups/use-groups'
import { useGroupsNet } from '@/hooks/groups/use-group-balance-model'
import { useAuthStore } from '@/store/auth'
import { useSettingsStore } from '@/store/settings'
import { useFabStore } from '@/store/fab'
import { getBalanceState } from '@/lib/groups'
import { formatMoney } from '@/lib/utils'
import { Plus, Users, UserPlus, Receipt, HandCoins, ChevronRight, Loader2, X, Archive } from 'lucide-react'
import { toast } from 'sonner'

export default function Groups() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { currency: preferredCurrency } = useSettingsStore()
  const displayCurrency = preferredCurrency || 'RSD'

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  const { data: groups = [], isLoading } = useGroups(showArchived)
  const { data: pendingInvites = [] } = usePendingInvites()
  const acceptInvite = useAcceptInvite()
  const declineInvite = useDeclineInvite()
  const { byGroup, overall } = useGroupsNet(groups, displayCurrency)

  const openCreate = () => setIsModalOpen(true)

  // Mobile FAB → create group
  const setFab = useFabStore((s) => s.setFab)
  const clearFab = useFabStore((s) => s.clearFab)
  useEffect(() => {
    setFab(openCreate)
    return () => clearFab()
  }, [setFab, clearFab])

  const acceptedMembers = (g: Group) => g.members?.filter((m) => m.status === 'accepted') || []

  const handleAccept = async (groupId: string) => {
    try {
      await acceptInvite.mutateAsync(groupId)
      toast.success(t('groups.inviteAccepted'))
    } catch {
      toast.error(t('groups.inviteAcceptError'))
    }
  }
  const handleDecline = async (groupId: string) => {
    try {
      await declineInvite.mutateAsync(groupId)
      toast.success(t('groups.inviteDeclined'))
    } catch {
      toast.error(t('groups.inviteDeclineError'))
    }
  }

  const archivedToggle = (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
      <Switch checked={showArchived} onCheckedChange={setShowArchived} />
      <Archive className="size-4" />
      <span className="hidden sm:inline">{t('groups.archive.showArchived')}</span>
    </label>
  )

  const overallState = getBalanceState(overall)

  return (
    <AppLayout>
      <PageToolbar
        className="md:-mx-8 md:-mt-8 md:mb-6"
        title={t('groups.title')}
        subtitle={t('groups.subtitle')}
        actions={
          <>
            {archivedToggle}
            <AddButton onClick={openCreate} label={t('groups.newGroup')} />
          </>
        }
      />

      {/* Mobile header */}
      <div className="mb-4 flex items-start justify-between gap-3 md:hidden">
        <div className="min-w-0">
          <h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.025em]">{t('groups.title')}</h1>
          <p className="mt-0.5 text-[13.5px] font-medium text-muted-foreground">{t('groups.subtitle')}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-[42px] shrink-0 rounded-full"
          onClick={openCreate}
          aria-label={t('groups.newGroup')}
        >
          <Plus className="size-5" />
        </Button>
      </div>
      <div className="mb-4 flex justify-end md:hidden">{archivedToggle}</div>

      <div className="mx-auto flex max-w-[1080px] flex-col gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : groups.length === 0 && pendingInvites.length === 0 ? (
          <HubEmpty onCreate={openCreate} />
        ) : (
          <>
            {/* Overall net */}
            {groups.length > 0 && (
              <div
                className={`flex items-center justify-between rounded-2xl border px-[18px] py-4 shadow-glass-1 ${
                  overallState === 'owed'
                    ? 'border-success/20 bg-success-soft'
                    : overallState === 'owe'
                      ? 'border-destructive/20 bg-destructive-soft'
                      : 'border-border bg-card'
                }`}
              >
                <div>
                  <div className="text-[12px] font-semibold text-muted-foreground">
                    {overallState === 'owed'
                      ? t('groups.hub.overallOwed')
                      : overallState === 'owe'
                        ? t('groups.hub.overallOwe')
                        : t('groups.hub.acrossAll')}
                  </div>
                  <div
                    className={`t-num mt-1.5 text-[24px] font-extrabold tracking-[-0.02em] ${
                      overallState === 'owed'
                        ? 'text-success-foreground'
                        : overallState === 'owe'
                          ? 'text-[color:var(--destructive-foreground-on-soft)]'
                          : 'text-foreground'
                    }`}
                  >
                    {overallState === 'settled'
                      ? t('groups.hub.allSettled')
                      : formatMoney(Math.abs(overall), displayCurrency)}
                  </div>
                </div>
                <div className="text-[12px] font-semibold text-fg-faint">
                  {t('groups.hub.groupsCount', { count: groups.length })}
                </div>
              </div>
            )}

            {/* Pending invites */}
            {pendingInvites.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center gap-3 rounded-2xl border border-brand-violet/25 bg-brand-violet-soft px-3.5 py-3"
              >
                <span className="grid size-[42px] shrink-0 place-items-center rounded-xl bg-card text-[22px] shadow-glass-1">
                  {inv.group.icon || '👥'}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14.5px] font-bold">{inv.group.name}</div>
                  <div className="mt-0.5 truncate text-[12px] text-muted-foreground">
                    {t('groups.hub.invitedYou', {
                      name: inv.invitedBy?.firstName || t('common.unknown'),
                      count: acceptedMembers(inv.group).length,
                    })}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="brand"
                  size="sm"
                  loading={acceptInvite.isPending}
                  onClick={() => handleAccept(inv.group.id)}
                >
                  {t('groups.hub.join')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  onClick={() => handleDecline(inv.group.id)}
                  disabled={declineInvite.isPending}
                  aria-label={t('groups.inviteDeclined')}
                >
                  <X className="size-[17px]" />
                </Button>
              </div>
            ))}

            {/* Group cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((g) => {
                const net = byGroup[g.id]
                const members = acceptedMembers(g)
                return (
                  <Link
                    key={g.id}
                    to={`/groups/${g.id}`}
                    className="flex flex-col gap-3.5 rounded-[18px] border border-border bg-card p-4 shadow-glass-1 transition-shadow hover:shadow-glass-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid size-[50px] shrink-0 place-items-center rounded-2xl bg-bg-subtle text-[26px]">
                        {g.icon || '👥'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[16.5px] font-bold tracking-[-0.01em]">{g.name}</span>
                          {g.isArchived && (
                            <span className="shrink-0 rounded-full bg-bg-subtle px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                              {t('groups.archive.archivedBadge')}
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 truncate text-[12.5px] text-muted-foreground">
                          {g.description || t('groups.membersCount', { count: members.length })}
                        </div>
                      </div>
                      <ChevronRight className="size-[18px] shrink-0 text-fg-faint" />
                    </div>
                    <div className="flex items-center justify-between gap-2.5">
                      <GAvatarStack members={members.map((m) => m.user)} max={4} size={28} currentUserId={user?.id} />
                      {net && <BalancePill state={net.state} amount={net.balance} currency={displayCurrency} />}
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </div>

      <GroupModal open={isModalOpen} onOpenChange={setIsModalOpen} group={null} mode="create" />
    </AppLayout>
  )
}

function HubEmpty({ onCreate }: { onCreate: () => void }) {
  const { t } = useTranslation()
  const steps = [
    { icon: UserPlus, text: t('groups.empty.step1') },
    { icon: Receipt, text: t('groups.empty.step2') },
    { icon: HandCoins, text: t('groups.empty.step3') },
  ]
  return (
    <div className="flex flex-col items-center">
      <EmptyState
        icon={Users}
        title={t('groups.empty.title')}
        description={t('groups.empty.description')}
        action={<AddButton onClick={onCreate} label={t('groups.newGroup')} />}
        className="w-full"
      />
      <div className="mt-7 flex w-full max-w-[320px] flex-col gap-3">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-3 text-left text-[13.5px] font-semibold text-fg-2">
            <span className="grid size-[38px] shrink-0 place-items-center rounded-xl bg-primary-soft">
              <s.icon className="size-4 text-primary" />
            </span>
            {s.text}
          </div>
        ))}
      </div>
    </div>
  )
}
