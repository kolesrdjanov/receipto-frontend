import { useTranslation } from 'react-i18next'
import { memberFirstName } from '@/lib/groups'
import { cn, formatMoney } from '@/lib/utils'
import { formatDateTime } from '@/lib/date-utils'
import type { Receipt } from '@/hooks/receipts/use-receipts'
import type { GroupMember } from '@/hooks/groups/use-groups'

function toNumber(v: string | number | undefined): number {
  return typeof v === 'string' ? parseFloat(v) || 0 : v || 0
}

/**
 * One group expense (a receipt) as a tappable row: category emoji, store + "who paid · date",
 * amount, and a from-your-POV annotation (you lent / you owe / not involved).
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
  const inSplit = receipt.participants?.length
    ? receipt.participants.some((p) => p.userId === currentUserId)
    : true
  const share = amount / partCount
  const youPaid = (receipt.paidById ?? receipt.paidBy?.id) === currentUserId

  let tag: string
  let tagColor: string
  if (youPaid) {
    const lent = amount - (inSplit ? share : 0)
    tag = t('groups.expense.youLent', { amount: formatMoney(lent, currency) })
    tagColor = 'text-foreground'
  } else if (inSplit) {
    tag = t('groups.expense.youOwe', { amount: formatMoney(share, currency) })
    tagColor = 'text-destructive'
  } else {
    tag = t('groups.expense.notInvolved')
    tagColor = 'text-fg-faint'
  }

  const payerName = memberFirstName(receipt.paidBy)
  const emoji = receipt.category?.icon || '🧾'

  return (
    // eslint-disable-next-line no-restricted-syntax -- raw-button-ok: list-row tap-face (opens the expense detail sheet)
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-hairline-soft py-2.5 text-left last:border-b-0"
    >
      <span className="grid size-[42px] shrink-0 place-items-center rounded-xl bg-bg-subtle text-[21px]">{emoji}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14.5px] font-semibold text-foreground">
          {receipt.storeName || t('receipts.unknownStore')}
        </span>
        <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">
          {payerName ? t('groups.expense.whoPaid', { name: payerName }) : ''}
          {receipt.receiptDate ? ` · ${formatDateTime(receipt.receiptDate)}` : ''}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end">
        <span className="text-[14.5px] font-bold">{formatMoney(amount, currency)}</span>
        <span className={cn('mt-1 text-[11px] font-semibold', tagColor)}>{tag}</span>
      </span>
    </button>
  )
}
