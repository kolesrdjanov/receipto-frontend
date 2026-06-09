import { useTranslation } from 'react-i18next'
import { formatDistanceToNow } from 'date-fns'
import { enUS, srLatn } from 'date-fns/locale'
import i18n from 'i18next'
import { SoftCard } from '@/components/groups/primitives'
import { EmptyState } from '@/components/glass/empty-state'
import { useGroupActivities, type GroupActivity } from '@/hooks/groups/use-groups'
import { formatMoney } from '@/lib/utils'
import {
  Activity,
  PartyPopper,
  UserPlus,
  UserMinus,
  Receipt,
  Settings,
  HandCoins,
  Link as LinkIcon,
  Loader2,
  type LucideIcon,
} from 'lucide-react'

const ACTIVITY_ICON: Record<string, LucideIcon> = {
  group_created: PartyPopper,
  group_updated: Settings,
  group_archived: Settings,
  group_unarchived: Settings,
  member_invited: UserPlus,
  member_joined: UserPlus,
  member_joined_via_link: LinkIcon,
  member_left: UserMinus,
  member_removed: UserMinus,
  receipt_added: Receipt,
  receipt_updated: Receipt,
  receipt_deleted: Receipt,
  settlement_created: HandCoins,
}

/** Activity tab — a vertical timeline of group events on a connector rail. */
export function GroupActivityTimeline({ groupId }: { groupId: string }) {
  const { t } = useTranslation()
  const { data, isLoading } = useGroupActivities(groupId, 50)
  const activities = data?.data ?? []

  const userName = (a: GroupActivity) => {
    if (!a.user) return t('common.unknown')
    const { firstName, lastName, email } = a.user
    return firstName || lastName ? `${firstName || ''} ${lastName || ''}`.trim() : email
  }

  const verb = (a: GroupActivity) => {
    const key = `groups.activities.types.${a.type}`
    if (a.type === 'member_invited' && a.metadata?.email) return t(key, { email: a.metadata.email })
    return t(key, { defaultValue: a.type })
  }

  const detail = (a: GroupActivity): string | null => {
    const m = a.metadata
    if (!m) return null
    if (a.type === 'receipt_added' && m.amount && m.currency) {
      return `${m.storeName || t('common.unknown')} — ${formatMoney(m.amount, m.currency)}`
    }
    if (a.type === 'settlement_created' && m.settlementAmount && m.currency) {
      return `${m.fromUserName || ''} → ${m.toUserName || ''}: ${formatMoney(m.settlementAmount, m.currency)}`
    }
    if ((a.type === 'member_left' || a.type === 'member_removed') && m.memberName) return m.memberName
    return null
  }

  const split = (a: GroupActivity): string | null => {
    const m = a.metadata
    if (a.type !== 'receipt_added' || !m) return null
    if (m.splitType === 'all') return t('groups.activities.betweenAllMembers')
    if (m.splitType === 'custom' && Array.isArray(m.participantNames)) {
      return t('groups.activities.betweenMembers', { names: m.participantNames.join(', ') })
    }
    return null
  }

  const ago = (date: string) =>
    formatDistanceToNow(new Date(date), { addSuffix: true, locale: i18n.language === 'sr' ? srLatn : enUS })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-7 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (activities.length === 0) {
    return <EmptyState compact icon={Activity} title={t('groups.activities.noActivities')} />
  }

  return (
    <SoftCard>
      <div className="flex flex-col">
        {activities.map((a, idx) => {
          const Icon = ACTIVITY_ICON[a.type] || Activity
          const last = idx === activities.length - 1
          const d = detail(a)
          const s = split(a)
          return (
            <div key={a.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="grid size-[34px] shrink-0 place-items-center rounded-full bg-bg-subtle">
                  <Icon className="size-3.5 text-muted-foreground" />
                </span>
                {!last && <span className="my-1 w-0.5 flex-1 rounded-full bg-border" />}
              </div>
              <div className={`min-w-0 flex-1 ${last ? '' : 'pb-[18px]'}`}>
                <div className="text-[13.5px] leading-snug text-fg-2">
                  <b className="font-bold text-foreground">{userName(a)}</b> {verb(a)}
                </div>
                {d && <div className="mt-0.5 text-[13px] font-semibold text-foreground">{d}</div>}
                {s && <div className="mt-0.5 text-[11.5px] text-muted-foreground">{s}</div>}
                <div className="mt-1 text-[11px] text-fg-faint">{ago(a.createdAt)}</div>
              </div>
            </div>
          )
        })}
      </div>
    </SoftCard>
  )
}
