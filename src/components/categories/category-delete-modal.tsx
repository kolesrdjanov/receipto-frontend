import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Info, CircleSlash, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/api'
import { GlassDialog } from '@/components/glass/glass-dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Alert } from '@/components/glass/glass'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CategoryCircle } from '@/components/categories/primitives'
import {
  useCategoryReceipts,
  useCategories,
  useDeleteCategory,
  type Category,
} from '@/hooks/categories/use-categories'
import { useUpdateReceipt, type Receipt } from '@/hooks/receipts/use-receipts'
import { formatMoney } from '@/lib/utils'

interface CategoryDeleteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: Category | null
  onDeleted: () => void
}

const UNCATEGORIZED = 'uncategorized'

/** Category picker built on the shadcn Select — Uncategorized + color-dotted categories. */
function CategorySelect({
  value,
  onChange,
  categories,
}: {
  value: string
  onChange: (value: string) => void
  categories: Category[]
}) {
  const { t } = useTranslation()
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={UNCATEGORIZED}>
          <span className="inline-flex items-center gap-2">
            <span className="grid size-5 place-items-center rounded-full border border-dashed border-border text-fg-faint">
              <CircleSlash className="size-3" />
            </span>
            <span className="text-muted-foreground">{t('categories.modal.uncategorized')}</span>
          </span>
        </SelectItem>
        {categories.map((cat) => (
          <SelectItem key={cat.id} value={cat.id}>
            <span className="inline-flex items-center gap-2">
              <CategoryCircle color={cat.color} icon={cat.icon} size={26} font={14} />
              <span>{cat.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function CategoryDeleteModal({ open, onOpenChange, category, onDeleted }: CategoryDeleteModalProps) {
  const { t, i18n } = useTranslation()
  const { data: receipts, isLoading: receiptsLoading } = useCategoryReceipts(category?.id || '')
  const { data: categories } = useCategories()
  const updateReceipt = useUpdateReceipt()
  const deleteCategory = useDeleteCategory()
  const [reassignments, setReassignments] = useState<Record<string, string>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasReceipts = !!receipts && receipts.length > 0
  const availableCategories = (categories || []).filter((c) => c.id !== category?.id)

  useEffect(() => {
    if (receipts) {
      setReassignments(Object.fromEntries(receipts.map((r) => [r.id, UNCATEGORIZED])))
    }
    setError(null)
  }, [receipts])

  const setAll = (value: string) => {
    if (!receipts) return
    setReassignments(Object.fromEntries(receipts.map((r) => [r.id, value])))
  }

  const handleConfirm = async () => {
    if (!category) return
    setIsProcessing(true)
    setError(null)
    try {
      if (hasReceipts) {
        await Promise.all(
          Object.entries(reassignments).map(([receiptId, value]) =>
            updateReceipt.mutateAsync({
              id: receiptId,
              data: { categoryId: value === UNCATEGORIZED ? null : value },
            }),
          ),
        )
        toast.success(t('categories.modal.reassignSuccess'))
      }
      await deleteCategory.mutateAsync(category.id)
      toast.success(t('categories.modal.deleteSuccess'))
      onOpenChange(false)
      onDeleted()
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      toast.error(hasReceipts ? t('categories.modal.reassignError') : t('categories.modal.deleteError'), {
        description: message,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const fmtAmount = (r: Receipt) => {
    const amount = r.totalAmount
    if (amount === undefined || amount === null) return '—'
    return formatMoney(Number(amount), r.currency || 'RSD')
  }
  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString(i18n.language === 'sr' ? 'sr-Latn-RS' : 'en-GB', { day: 'numeric', month: 'short' }) : '—'

  // Loading the receipt count (drives which branch to show).
  if (open && receiptsLoading) {
    return (
      <GlassDialog open={open} onOpenChange={onOpenChange} title={t('categories.modal.deleteTitle', { defaultValue: 'Delete category' })} desktopWidth={420}>
        <div className="grid place-items-center py-10">
          <Loader2 className="size-7 animate-spin text-muted-foreground" />
        </div>
      </GlassDialog>
    )
  }

  // No linked receipts → simple confirm (reused global responsive ConfirmDialog).
  if (!hasReceipts) {
    return (
      <ConfirmDialog
        open={open}
        onOpenChange={onOpenChange}
        onConfirm={handleConfirm}
        title={t('categories.simpleDelete.title', { name: category?.name || '' })}
        description={t('categories.simpleDelete.description')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="destructive"
        isLoading={isProcessing}
      />
    )
  }

  // Has linked receipts → reassignment flow.
  return (
    <GlassDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('categories.reassign.title', { name: category?.name || '' })}
      description={t('categories.reassign.subtitle', { count: receipts!.length })}
      desktopWidth={580}
      actions={{
        primary: (
          <Button variant="destructive" onClick={handleConfirm} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            {isProcessing ? t('categories.modal.reassigning') : t('categories.reassign.confirm')}
          </Button>
        ),
        secondary: (
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            {t('common.cancel')}
          </Button>
        ),
      }}
    >
      <div className="flex flex-col gap-4">
        {/* Info banner */}
        <div className="flex items-start gap-3 rounded-[14px] border border-info-soft bg-info-soft/70 p-3.5">
          <Info className="mt-0.5 size-4 shrink-0 text-info" />
          <p className="text-[13px] font-medium leading-relaxed text-info-foreground">
            <b className="font-extrabold">{t('categories.reassign.receiptsCount', { count: receipts!.length })}</b>
            {t('categories.reassign.bannerRest', { name: category?.name || '' })}
          </p>
        </div>

        {/* Bulk "Set all to" */}
        <div className="flex items-center gap-3 rounded-[14px] border border-hairline-soft bg-bg-subtle px-3.5 py-3">
          <span className="text-[13px] font-medium text-fg-2">{t('categories.reassign.setAllTo')}</span>
          <div className="ml-auto w-[200px]">
            <CategorySelect value={UNCATEGORIZED} onChange={setAll} categories={availableCategories} />
          </div>
        </div>

        {/* Affected receipts */}
        <div className="overflow-hidden rounded-[14px] border border-border [&>div+div]:border-t [&>div+div]:border-hairline-soft">
          {receipts!.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 bg-card px-3.5 py-3">
              <div className="min-w-0">
                <div className="truncate text-[14px] font-bold">{r.storeName || t('receipts.unknownStore')}</div>
                <div className="mt-0.5 text-[12px] text-muted-foreground">
                  <span>{fmtAmount(r)}</span> · {fmtDate(r.receiptDate)}
                </div>
              </div>
              <div className="w-[168px] shrink-0">
                <CategorySelect
                  value={reassignments[r.id] ?? UNCATEGORIZED}
                  onChange={(value) => setReassignments((prev) => ({ ...prev, [r.id]: value }))}
                  categories={availableCategories}
                />
              </div>
            </div>
          ))}
        </div>

        {error && <Alert kind="err">{error}</Alert>}
      </div>
    </GlassDialog>
  )
}
