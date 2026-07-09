import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { GlassDialog } from '@/components/glass/glass-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCreateSettlement, type GroupMember } from '@/hooks/groups/use-groups'
import { useAuthStore } from '@/store/auth'
import { getErrorMessage } from '@/lib/api'
import { formatMoney } from '@/lib/utils'
import { memberFirstName } from '@/lib/groups'
import { GMemberAvatar } from '@/components/groups/primitives'
import { toast } from 'sonner'
import { ArrowRight } from 'lucide-react'

interface SettlementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  currency: string
  members: GroupMember[]
  prefillData?: {
    fromUserId?: string
    toUserId?: string
    amount?: number
  }
}

const fieldLabel = 'mb-2 block text-center text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-faint'

/** Record-payment (settle up) sheet/modal — two avatar pickers (From → To), a big amount field, an
 *  optional note, and a live preview. Prefills from a tapped settle-path row. */
export function SettlementModal({
  open,
  onOpenChange,
  groupId,
  currency,
  members,
  prefillData,
}: SettlementModalProps) {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const createSettlement = useCreateSettlement()

  const accepted = members.filter((m) => m.status === 'accepted' && m.user)

  const [fromUserId, setFromUserId] = useState('')
  const [toUserId, setToUserId] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  // Seed/reset whenever the sheet opens (honouring prefill from a settle row).
  useEffect(() => {
    if (!open) return
    const fallbackFrom = prefillData?.fromUserId || user?.id || accepted[0]?.userId || ''
    const fallbackTo =
      prefillData?.toUserId || accepted.find((m) => m.userId !== fallbackFrom)?.userId || ''
    setFromUserId(fallbackFrom)
    setToUserId(fallbackTo)
    setAmount(prefillData?.amount ? String(prefillData.amount) : '')
    setNote('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prefillData])

  const userOf = (id: string) => accepted.find((m) => m.userId === id)?.user
  const parsedAmount = parseFloat(amount.replace(',', '.'))
  const valid = !!fromUserId && !!toUserId && fromUserId !== toUserId && !isNaN(parsedAmount) && parsedAmount > 0

  const handleSubmit = async () => {
    if (!valid) return
    try {
      await createSettlement.mutateAsync({
        groupId,
        data: { fromUserId, toUserId, amount: parsedAmount, currency, note: note.trim() || undefined },
      })
      toast.success(t('groups.settlements.success'))
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error, t('groups.settlements.error')))
    }
  }

  const Picker = ({ label, value, exclude, onChange }: { label: string; value: string; exclude: string; onChange: (id: string) => void }) => (
    <div className="flex flex-1 flex-col items-center gap-1.5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-faint">{label}</div>
      <GMemberAvatar user={userOf(value)} self={value === user?.id} size={48} />
      <div className="text-[14px] font-semibold">{memberFirstName(userOf(value))}</div>
      <div className="mt-1 flex flex-wrap justify-center gap-1.5">
        {accepted
          .filter((m) => m.userId !== exclude)
          .map((m) => (
            // eslint-disable-next-line no-restricted-syntax -- raw-button-ok: bespoke avatar-selector dot (tappable avatar swatch)
            <button
              key={m.userId}
              type="button"
              aria-label={memberFirstName(m.user)}
              onClick={() => onChange(m.userId)}
              className={`hit-area grid shrink-0 place-items-center rounded-full border-2 transition-opacity ${m.userId === value ? 'border-primary opacity-100' : 'border-transparent opacity-50 hover:opacity-80'}`}
            >
              <GMemberAvatar user={m.user} self={m.userId === user?.id} size={22} />
            </button>
          ))}
      </div>
    </div>
  )

  return (
    <GlassDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('groups.settlements.recordPayment')}
      description={t('groups.settlements.title')}
      desktopWidth={452}
      actions={{
        primary: (
          <Button type="button" onClick={handleSubmit} disabled={!valid} loading={createSettlement.isPending}>
            {t('groups.settlements.recordPayment')}
          </Button>
        ),
        secondary: (
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
        ),
      }}
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-2 pb-3">
          <Picker label={t('groups.settlements.from')} value={fromUserId} exclude={toUserId} onChange={setFromUserId} />
          <div className="grid shrink-0 place-items-center pt-6">
            <ArrowRight className="size-5 text-fg-faint" />
          </div>
          <Picker label={t('groups.settlements.to')} value={toUserId} exclude={fromUserId} onChange={setToUserId} />
        </div>

        <div className="flex items-baseline justify-center gap-2 py-3">
          <input
            className="w-auto min-w-[60px] max-w-[220px] border-none bg-transparent text-right text-[34px] font-semibold tracking-[-0.03em] text-foreground outline-none placeholder:text-fg-faint"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ''))}
          />
          <span className="text-[18px] font-semibold text-muted-foreground">{currency}</span>
        </div>

        <div className="mt-1">
          <span className={fieldLabel}>{t('groups.settlements.note')}</span>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('groups.settlements.notePlaceholder')}
          />
        </div>

        {valid && (
          <div className="mt-3.5 flex items-center gap-2 rounded-[10px] bg-bg-subtle px-3.5 py-3 text-[13.5px]">
            <GMemberAvatar user={userOf(fromUserId)} self={fromUserId === user?.id} size={26} />
            <b className="font-semibold">{memberFirstName(userOf(fromUserId))}</b>
            <ArrowRight className="size-[15px] text-fg-faint" />
            <GMemberAvatar user={userOf(toUserId)} self={toUserId === user?.id} size={26} />
            <b className="font-semibold">{memberFirstName(userOf(toUserId))}</b>
            <span className="flex-1" />
            <span className="font-semibold text-foreground">{formatMoney(parsedAmount, currency)}</span>
          </div>
        )}
      </div>
    </GlassDialog>
  )
}
