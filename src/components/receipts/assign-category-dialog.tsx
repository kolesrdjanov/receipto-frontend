import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassDialog } from '@/components/glass/glass-dialog'
import { cn } from '@/lib/utils'
import type { Category } from '@/hooks/categories/use-categories'

interface AssignCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  count: number
  onAssign: (categoryId: string) => void
  isLoading?: boolean
}

/** Bulk assign-category overlay — glass modal (desktop) / sheet (mobile) with single-select chips. */
export function AssignCategoryDialog({
  open, onOpenChange, categories, count, onAssign, isLoading,
}: AssignCategoryDialogProps) {
  const { t } = useTranslation()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Reset the chosen chip whenever the dialog opens.
  useEffect(() => { if (open) setSelectedId(null) }, [open])

  return (
    <GlassDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('receipts.assignCategory')}
      description={t('receipts.bulkCategoryDescription', { count })}
      desktopWidth={480}
      actions={{
        primary: (
          <Button
            type="button"
            onClick={() => selectedId && onAssign(selectedId)}
            disabled={!selectedId || isLoading}
          >
            {isLoading && <Loader2 className="size-4 animate-spin" />}
            {t('receipts.assignCategory')}
          </Button>
        ),
        secondary: (
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t('common.cancel')}
          </Button>
        ),
      }}
    >
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => {
          const on = selectedId === c.id
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedId(c.id)}
              className={cn(
                'inline-flex h-[34px] items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold transition-colors',
                on
                  ? 'border-transparent bg-primary-soft text-primary'
                  : 'border-border bg-bg-subtle text-fg-2 hover:text-foreground',
              )}
            >
              {c.icon && <span className="text-[14px] leading-none">{c.icon}</span>}
              {c.name}
            </button>
          )
        })}
      </div>
    </GlassDialog>
  )
}
