import { useState } from 'react'
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
import { Receipt, Info } from 'lucide-react'

interface PfrEntryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: PfrData) => void
}

export interface PfrData {
  InvoiceNumberSe?: string // AP64WJRN-AP64WJRN-132587
  InvoiceCounter?: string // 132557/132587
  InvoiceCounterExtension?: string // ПП
  TotalAmount?: string // 1.110,00
  SdcDateTime?: string // 10.1.2026. 20:56:18
}

export function PfrEntryModal({ open, onOpenChange, onSubmit }: PfrEntryModalProps) {
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)

  // PFR Form State
  const [pfrPart1, setPfrPart1] = useState('')
  const [pfrPart2, setPfrPart2] = useState('')
  const [pfrPart3, setPfrPart3] = useState('')
  const [counterPart1, setCounterPart1] = useState('')
  const [counterPart2, setCounterPart2] = useState('')
  const [pfrDate, setPfrDate] = useState('')
  const [pfrAmount, setPfrAmount] = useState('')

  // Handle PFR Form Submit
  const handlePfrSubmit = () => {
    // Validate all fields
    if (!pfrPart1 || !pfrPart2 || !pfrPart3) {
      setError(t('receipts.pfrEntry.errorPfrRequired'))
      return
    }

    if (!counterPart1 || !counterPart2) {
      setError(t('receipts.pfrEntry.errorCounterRequired'))
      return
    }

    if (!pfrDate) {
      setError(t('receipts.pfrEntry.errorDateRequired'))
      return
    }

    if (!pfrAmount) {
      setError(t('receipts.pfrEntry.errorAmountRequired'))
      return
    }

    // Build PFR data
    const pfrData: PfrData = {
      InvoiceNumberSe: `${pfrPart1}-${pfrPart2}-${pfrPart3}`.toUpperCase(),
      InvoiceCounter: `${counterPart1}/${counterPart2}`,
      InvoiceCounterExtension: 'ПП',
      SdcDateTime: pfrDate,
      TotalAmount: pfrAmount,
    }

    console.log('Submitting PFR data:', pfrData)

    onSubmit(pfrData)
    // Reset form
    resetForm()
    onOpenChange(false)
  }

  const resetForm = () => {
    setPfrPart1('')
    setPfrPart2('')
    setPfrPart3('')
    setCounterPart1('')
    setCounterPart2('')
    setPfrDate('')
    setPfrAmount('')
    setError(null)
  }

  // Auto-focus next input when current is filled
  const handlePfrPart1Change = (value: string) => {
    const clean = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    if (clean.length <= 8) {
      setPfrPart1(clean)
      setPfrPart2(clean) // Mirror to second input automatically
      if (clean.length === 8) {
        document.getElementById('pfr-part2')?.focus()
      }
    }
  }

  const handlePfrPart2Change = (value: string) => {
    const clean = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    if (clean.length <= 8) {
      setPfrPart2(clean)
      if (clean.length === 8) {
        document.getElementById('pfr-part3')?.focus()
      }
    }
  }

  const handlePfrPart3Change = (value: string) => {
    const clean = value.replace(/[^0-9]/g, '')
    if (clean.length <= 6) {
      setPfrPart3(clean)
      if (clean.length === 6) {
        document.getElementById('counter-part1')?.focus()
      }
    }
  }

  const handleCounterPart1Change = (value: string) => {
    const clean = value.replace(/[^0-9]/g, '')
    if (clean.length <= 6) {
      setCounterPart1(clean)
      if (clean.length >= 5) {
        document.getElementById('counter-part2')?.focus()
      }
    }
  }

  const handleCounterPart2Change = (value: string) => {
    const clean = value.replace(/[^0-9]/g, '')
    if (clean.length <= 6) {
      setCounterPart2(clean)
      if (clean.length === 6) {
        document.getElementById('pfr-date')?.focus()
      }
    }
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {t('receipts.pfrEntry.title')}
          </DialogTitle>
          <DialogDescription>
            {t('receipts.pfrEntry.description')}
          </DialogDescription>
        </DialogHeader>

        {/* PFR Manual Entry Form */}
        <div className="space-y-4 py-4">
          {/* Coming Soon Notice */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <Info className="h-4 w-4 mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">{t('receipts.pfrEntry.comingSoon')}</p>
              <p className="text-blue-700 dark:text-blue-300 mt-1">{t('receipts.pfrEntry.apiNotReady')}</p>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* PFR Broj računa */}
          <div className="space-y-2">
            <Label>{t('receipts.pfrEntry.pfrNumber')} *</Label>
            <div className="flex gap-2">
              <Input
                id="pfr-part1"
                placeholder="XXXXXXXX"
                value={pfrPart1}
                onChange={(e) => handlePfrPart1Change(e.target.value)}
                maxLength={8}
                className="flex-1 font-mono text-center"
                disabled
              />
              <span className="flex items-center text-muted-foreground">-</span>
              <Input
                id="pfr-part2"
                placeholder="XXXXXXXX"
                value={pfrPart2}
                onChange={(e) => handlePfrPart2Change(e.target.value)}
                maxLength={8}
                className="flex-1 font-mono text-center"
                disabled
              />
              <span className="flex items-center text-muted-foreground">-</span>
              <Input
                id="pfr-part3"
                placeholder="XXXXXX"
                value={pfrPart3}
                onChange={(e) => handlePfrPart3Change(e.target.value)}
                maxLength={6}
                className="flex-1 font-mono text-center"
                disabled
              />
            </div>
          </div>

          {/* Brojač računa */}
          <div className="space-y-2">
            <Label>{t('receipts.pfrEntry.counter')} *</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="counter-part1"
                placeholder="XXXXX"
                value={counterPart1}
                onChange={(e) => handleCounterPart1Change(e.target.value)}
                maxLength={6}
                className="w-24 font-mono text-center"
                disabled
              />
              <span className="text-muted-foreground">/</span>
              <Input
                id="counter-part2"
                placeholder="XXXXXX"
                value={counterPart2}
                onChange={(e) => handleCounterPart2Change(e.target.value)}
                maxLength={6}
                className="w-24 font-mono text-center"
                disabled
              />
              <div className="flex-1 flex items-center justify-center">
                <span className="px-3 py-2 bg-muted rounded-md font-mono text-sm">ПП</span>
              </div>
            </div>
          </div>

          {/* Datum i vreme */}
          <div className="space-y-2">
            <Label htmlFor="pfr-date">{t('receipts.pfrEntry.dateTime')} *</Label>
            <Input
              id="pfr-date"
              placeholder="DD.MM.YYYY HH:MM:SS"
              value={pfrDate}
              onChange={(e) => setPfrDate(e.target.value)}
              className="font-mono"
              disabled
            />
            <p className="text-xs text-muted-foreground">{t('receipts.pfrEntry.dateTimeFormat')}</p>
          </div>

          {/* Iznos */}
          <div className="space-y-2">
            <Label htmlFor="pfr-amount">{t('receipts.pfrEntry.amount')} *</Label>
            <Input
              id="pfr-amount"
              placeholder="1.110,00"
              value={pfrAmount}
              onChange={(e) => setPfrAmount(e.target.value)}
              className="font-mono"
              disabled
            />
            <p className="text-xs text-muted-foreground">{t('receipts.pfrEntry.amountHint')}</p>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handlePfrSubmit}
            className="w-full"
            size="lg"
            disabled
          >
            {t('receipts.pfrEntry.verifyButton')}
          </Button>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

