import { useTranslation } from 'react-i18next'
import { formatDistanceToNow } from 'date-fns'
import { enUS, srLatn } from 'date-fns/locale'
import i18n from 'i18next'
import { SoftCard } from '@/components/groups/primitives'
import { EmptyState, ModalEmptyState } from '@/components/glass/empty-state'
import { useSettlementHistory, type SettlementRecord } from '@/hooks/groups/use-groups'
import { memberFirstName } from '@/lib/groups'
import { formatMoney } from '@/lib/utils'
import { HandCoins, Loader2 } from 'lucide-react'

/** Settlement-history view — recorded payments, newest first. `flush` drops the card wrapper
 *  (for rendering inside the history sheet, which already provides the surface). */
export function GroupHistoryList({
  groupId,
  displayCurrency,
  flush,
}: {
  groupId: string
  displayCurrency: string
  flush?: boolean
}) {
  const { t } = useTranslation()
  const { data: settlements = [], isLoading } = useSettlementHistory(groupId)

  const ago = (date: string) =>
    formatDistanceToNow(new Date(date), { addSuffix: true, locale: i18n.language === 'sr' ? srLatn : enUS })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-7 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (settlements.length === 0) {
    return flush ? (
      <ModalEmptyState icon={HandCoins} title={t('groups.settlements.noHistory')} />
    ) : (
      <EmptyState compact icon={HandCoins} title={t('groups.settlements.noHistory')} />
    )
  }

  const rows = (
    <div className="flex flex-col gap-2">
      {settlements.map((s: SettlementRecord) => (
          <div key={s.id} className="flex items-center gap-3 py-1.5">
            <span className="grid size-[38px] shrink-0 place-items-center rounded-xl bg-success-soft">
              <HandCoins className="size-[17px] text-success" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] text-fg-2">
                <b className="font-bold text-foreground">{memberFirstName(s.fromUser)}</b> {t('groups.settlements.paidVerb')}{' '}
                <b className="font-bold text-foreground">{memberFirstName(s.toUser)}</b>
              </div>
              <div className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                {ago(s.settledAt)}
                {s.note ? ` · ${s.note}` : ''}
              </div>
            </div>
            <span className="t-num shrink-0 font-bold">{formatMoney(s.amount, s.currency || displayCurrency)}</span>
          </div>
      ))}
    </div>
  )

  return flush ? rows : <SoftCard>{rows}</SoftCard>
}
