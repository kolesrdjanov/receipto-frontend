import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { useCreatePromo } from '@/hooks/admin/use-analytics'

interface PromoCampaignModalProps {
  isOpen: boolean
  onClose: () => void
  chains: string[]
}

export function PromoCampaignModal({ isOpen, onClose, chains }: PromoCampaignModalProps) {
  const { t } = useTranslation()
  const createPromo = useCreatePromo()

  const [form, setForm] = useState({
    name: '',
    chainName: chains[0] || '',
    startDate: '',
    endDate: '',
    baselineStartDate: '',
    baselineEndDate: '',
    notes: '',
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createPromo.mutateAsync({
      ...form,
      notes: form.notes || undefined,
    })
    onClose()
    setForm({ name: '', chainName: chains[0] || '', startDate: '', endDate: '', baselineStartDate: '', baselineEndDate: '', notes: '' })
  }

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-background border rounded-lg shadow-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">{t('analytics.createCampaign')}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium">{t('analytics.campaignName')}</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm rounded-lg border bg-background"
            />
          </div>
          <div>
            <label className="text-sm font-medium">{t('analytics.chain')}</label>
            <select
              required
              value={form.chainName}
              onChange={(e) => update('chainName', e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm rounded-lg border bg-background"
            >
              {chains.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">{t('analytics.promoStart')}</label>
              <DatePicker value={form.startDate} onChange={(val) => update('startDate', val)} placeholder={t('analytics.promoStart')} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('analytics.promoEnd')}</label>
              <DatePicker value={form.endDate} onChange={(val) => update('endDate', val)} placeholder={t('analytics.promoEnd')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">{t('analytics.baselineStart')}</label>
              <DatePicker value={form.baselineStartDate} onChange={(val) => update('baselineStartDate', val)} placeholder={t('analytics.baselineStart')} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('analytics.baselineEnd')}</label>
              <DatePicker value={form.baselineEndDate} onChange={(val) => update('baselineEndDate', val)} placeholder={t('analytics.baselineEnd')} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">{t('analytics.notes')}</label>
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              rows={2}
              className="w-full mt-1 px-3 py-2 text-sm rounded-lg border bg-background resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>{t('common.cancel')}</Button>
            <Button type="submit" size="sm" disabled={createPromo.isPending}>
              {createPromo.isPending ? t('common.loading') : t('common.create')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
