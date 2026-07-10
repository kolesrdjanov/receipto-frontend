import { useTranslation } from 'react-i18next'
import { memberFirstName } from '@/lib/groups'
import { formatMoney } from '@/lib/utils'
import type { Receipt } from '@/hooks/receipts/use-receipts'
import type { GroupMember } from '@/hooks/groups/use-groups'

function toNumber(v: string | number | undefined): number {
  return typeof v === 'string' ? parseFloat(v) || 0 : v || 0
}

/**
 * One group expense (a receipt) as a tappable row (handoff: emoji tile · store +
 * "{payer} paid · split N ways" · total). The from-your-POV breakdown (you lent / owe)
 * lives in the expense detail sheet this row opens.
 */
export function GroupExpenseRow({
  receipt,
  members,
  currentUserId,
  onClick,
}: {
  receipt: Receipt
  members: GroupMember[]
  currentUserId?: string
  onClick: () => void
}) {
  const { t } = useTranslation()
  const amount = toNumber(receipt.totalAmount)
  const currency = receipt.currency || 'RSD'
  const accepted = members.filter((m) => m.status === 'accepted')

  const partCount = receipt.participants?.length || accepted.length || 1
  const youPaid = (receipt.paidById ?? receipt.paidBy?.id) === currentUserId
  const payerLabel = youPaid ? t('groups.you') : memberFirstName(receipt.paidBy)
  const emoji = receipt.category?.icon || '🧾'

  const meta = [
    payerLabel ? t('groups.expense.whoPaid', { name: payerLabel }) : null,
    t('groups.expense.splitWays', { count: partCount }),
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    // eslint-disable-next-line no-restricted-syntax -- raw-button-ok: list-row tap-face (opens the expense detail sheet)
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-hairline-soft py-2.5 text-left last:border-b-0"
    >
      <span className="grid size-[42px] shrink-0 place-items-center rounded-xl bg-bg-subtle text-[21px]">{emoji}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold text-foreground">
          {receipt.storeName || t('receipts.unknownStore')}
        </span>
        <span className="mt-0.5 block truncate text-[12.5px] text-muted-foreground">{meta}</span>
      </span>
      <span className="shrink-0 text-[15px] font-semibold">{formatMoney(amount, currency)}</span>
    </button>
  )
}
