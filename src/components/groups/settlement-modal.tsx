import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateSettlement, type GroupMember } from '@/hooks/groups/use-groups'
import { toast } from 'sonner'
import { Loader2, ArrowRight } from 'lucide-react'

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

export function SettlementModal({
  open,
  onOpenChange,
  groupId,
  currency,
  members,
  prefillData,
}: SettlementModalProps) {
  const { t } = useTranslation()
  const createSettlement = useCreateSettlement()

  const [fromUserId, setFromUserId] = useState(prefillData?.fromUserId || '')
  const [toUserId, setToUserId] = useState(prefillData?.toUserId || '')
  const [amount, setAmount] = useState(prefillData?.amount?.toString() || '')
  const [note, setNote] = useState('')

  // Update state when prefillData changes
  useEffect(() => {
    if (prefillData) {
      if (prefillData.fromUserId) setFromUserId(prefillData.fromUserId)
      if (prefillData.toUserId) setToUserId(prefillData.toUserId)
      if (prefillData.amount) setAmount(prefillData.amount.toString())
    }
  }, [prefillData])

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setFromUserId(prefillData?.fromUserId || '')
      setToUserId(prefillData?.toUserId || '')
      setAmount(prefillData?.amount?.toString() || '')
      setNote('')
    }
  }, [open, prefillData])

  const acceptedMembers = members.filter((m) => m.status === 'accepted' && m.user)

  const getMemberName = (member: GroupMember) => {
    if (member.user?.firstName && member.user?.lastName) {
      return `${member.user.firstName} ${member.user.lastName}`
    }
    return member.user?.firstName || member.user?.lastName || member.user?.email || ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const parsedAmount = parseFloat(amount.replace(',', '.'))
    if (!fromUserId || !toUserId || isNaN(parsedAmount) || parsedAmount <= 0) {
      return
    }

    try {
      await createSettlement.mutateAsync({
        groupId,
        data: {
          fromUserId,
          toUserId,
          amount: parsedAmount,
          currency,
          note: note.trim() || undefined,
        },
      })
      toast.success(t('groups.settlements.success'))
      onOpenChange(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('groups.settlements.error')
      toast.error(errorMessage)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: currency || 'RSD',
      minimumFractionDigits: 2,
    }).format(value)
  }

  const fromMember = acceptedMembers.find((m) => m.userId === fromUserId)
  const toMember = acceptedMembers.find((m) => m.userId === toUserId)
  const parsedAmount = parseFloat(amount.replace(',', '.'))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('groups.settlements.recordPayment')}</DialogTitle>
          <DialogDescription>
            {t('groups.settlements.title')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fromUser">{t('groups.settlements.from')}</Label>
            <Select value={fromUserId} onValueChange={setFromUserId}>
              <SelectTrigger>
                <SelectValue placeholder={t('groups.settlements.selectPayer')} />
              </SelectTrigger>
              <SelectContent>
                {acceptedMembers.map((member) => (
                  <SelectItem
                    key={member.userId}
                    value={member.userId}
                    disabled={member.userId === toUserId}
                  >
                    {getMemberName(member)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="toUser">{t('groups.settlements.to')}</Label>
            <Select value={toUserId} onValueChange={setToUserId}>
              <SelectTrigger>
                <SelectValue placeholder={t('groups.settlements.selectReceiver')} />
              </SelectTrigger>
              <SelectContent>
                {acceptedMembers.map((member) => (
                  <SelectItem
                    key={member.userId}
                    value={member.userId}
                    disabled={member.userId === fromUserId}
                  >
                    {getMemberName(member)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">{t('groups.settlements.amount')} ({currency})</Label>
            <Input
              id="amount"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">{t('groups.settlements.note')}</Label>
            <Input
              id="note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('groups.settlements.notePlaceholder')}
            />
          </div>

          {/* Preview */}
          {fromMember && toMember && !isNaN(parsedAmount) && parsedAmount > 0 && (
            <div className="p-4 rounded-lg bg-muted/50 flex items-center justify-center gap-2 text-sm">
              <span className="font-medium">{getMemberName(fromMember)}</span>
              <ArrowRight className="h-4 w-4" />
              <span className="font-medium">{getMemberName(toMember)}</span>
              <span className="text-primary font-semibold ml-2">
                {formatCurrency(parsedAmount)}
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={
                !fromUserId ||
                !toUserId ||
                fromUserId === toUserId ||
                isNaN(parsedAmount) ||
                parsedAmount <= 0 ||
                createSettlement.isPending
              }
            >
              {createSettlement.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.saving')}
                </>
              ) : (
                t('groups.settlements.recordPayment')
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
