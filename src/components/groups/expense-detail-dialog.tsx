import { useTranslation } from 'react-i18next'
import { GlassDialog } from '@/components/glass/glass-dialog'
import { Button } from '@/components/ui/button'
import { GMemberAvatar } from '@/components/groups/primitives'
import { useAuthStore } from '@/store/auth'
import { memberName } from '@/lib/groups'
import { formatMoney } from '@/lib/utils'
import { formatDateTime } from '@/lib/date-utils'
import type { Receipt } from '@/hooks/receipts/use-receipts'
import type { GroupMember } from '@/hooks/groups/use-groups'
import { Pencil, Trash2 } from 'lucide-react'

interface ExpenseDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  receipt: Receipt | null
  members: GroupMember[]
  isArchived?: boolean
  onEdit: (receipt: Receipt) => void
  onDelete: (receipt: Receipt) => void
}

/** Read view for a group expense (receipt): amount + title + split breakdown, with Edit / Delete. */
export function ExpenseDetailDialog({
  open,
  onOpenChange,
  receipt,
  members,
  isArchived,
  onEdit,
  onDelete,
}: ExpenseDetailDialogProps) {
  const { t } = useTranslation()
  const { user } = useAuthStore()

  if (!receipt) return null

  const currency = receipt.currency || 'RSD'
  const amount = typeof receipt.totalAmount === 'string' ? parseFloat(receipt.totalAmount) : receipt.totalAmount || 0
  const emoji = receipt.category?.icon || '🧾'

  const accepted = members.filter((m) => m.status === 'accepted' && m.user)
  const partIds = receipt.participants?.length
    ? receipt.participants.map((p) => p.userId)
    : accepted.map((m) => m.userId)
  const participants = partIds
    .map((id) => accepted.find((m) => m.userId === id))
    .filter((m): m is GroupMember => !!m)
  const share = amount / (participants.length || 1)
  const payer = receipt.paidBy ?? accepted.find((m) => m.userId === receipt.paidById)?.user

  return (
    <GlassDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('groups.expense.title')}
      desktopWidth={452}
      actions={{
        primary: !isArchived ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false)
              onEdit(receipt)
            }}
          >
            <Pencil className="size-4" />
            {t('common.edit')}
          </Button>
        ) : undefined,
        destructive: !isArchived ? (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => {
              onOpenChange(false)
              onDelete(receipt)
            }}
          >
            <Trash2 className="size-4" />
            {t('common.delete')}
          </Button>
        ) : undefined,
      }}
    >
      <div className="flex flex-col">
        {/* Hero */}
        <div className="flex flex-col items-center pb-3.5 text-center">
          <span className="mb-3 grid size-14 place-items-center rounded-2xl bg-bg-subtle text-[28px]">{emoji}</span>
          <div className="t-num text-[34px] font-extrabold tracking-[-0.03em]">{formatMoney(amount, currency)}</div>
          <div className="mt-1.5 text-[17px] font-bold">{receipt.storeName || t('receipts.unknownStore')}</div>
          <div className="mt-1 text-[13px] text-muted-foreground">
            {[receipt.category?.name, receipt.receiptDate ? formatDateTime(receipt.receiptDate) : null]
              .filter(Boolean)
              .join(' · ')}
          </div>
        </div>

        {/* Paid by */}
        {payer && (
          <div className="mb-4 flex items-center gap-3 rounded-[12px] bg-bg-subtle px-3.5 py-3">
            <GMemberAvatar user={payer} self={payer.id === user?.id} size={34} />
            <div className="flex-1 text-[14px] text-fg-2">
              <b className="font-bold text-foreground">
                {payer.id === user?.id ? t('groups.you') : memberName(payer)}
              </b>{' '}
              {t('groups.expense.paidTheBill')}
            </div>
            <span className="t-num font-bold">{formatMoney(amount, currency)}</span>
          </div>
        )}

        {/* Split breakdown */}
        <div className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.05em] text-fg-faint">
          {t('groups.expense.splitBetween', { count: participants.length, each: formatMoney(share, currency) })}
        </div>
        <div className="flex flex-col gap-0.5">
          {participants.map((m) => (
            <div key={m.userId} className="flex items-center gap-3 py-1.5 text-[14px] font-semibold">
              <GMemberAvatar user={m.user} self={m.userId === user?.id} size={30} />
              <span className="flex-1">
                {m.userId === user?.id ? t('groups.you') : memberName(m.user)}
                {m.userId === receipt.paidById && (
                  <span className="ml-2 rounded-full bg-primary-soft px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.04em] text-primary">
                    {t('groups.expense.payer')}
                  </span>
                )}
              </span>
              <span className="t-num font-bold text-destructive">{formatMoney(share, currency)}</span>
            </div>
          ))}
        </div>
      </div>
    </GlassDialog>
  )
}
