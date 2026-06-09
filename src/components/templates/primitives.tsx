import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { CatTile, CatName, ListCard, RowActionItem } from '@/components/glass/primitives'
import type { Template } from '@/hooks/templates/use-templates'

interface RowActions {
  onEdit?: (template: Template) => void
  onDelete?: (template: Template) => void
}

/** Shared Edit / Delete list — used by the desktop kebab popover and the mobile action sheet. */
export function RowActionList({ template, onEdit, onDelete }: { template: Template } & RowActions) {
  const { t } = useTranslation()
  const item =
    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[14px] font-medium transition-colors hover:bg-bg-subtle'
  return (
    <div className="flex flex-col gap-0.5">
      <button type="button" className={item} onClick={() => onEdit?.(template)}>
        <Pencil className="size-[18px] shrink-0 text-muted-foreground" />
        {t('common.edit')}
      </button>
      <RowActionItem icon={Trash2} label={t('common.delete')} onClick={() => onDelete?.(template)} danger />
    </div>
  )
}

interface TemplateRowProps extends RowActions {
  template: Template
  wide?: boolean
  /** Mobile: open the action sheet for this row (kebab tap). */
  onOpenActions?: (template: Template) => void
}

export function TemplateRow({ template, wide, onEdit, onDelete, onOpenActions }: TemplateRowProps) {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const close = (fn?: (x: Template) => void) => () => {
    setMenuOpen(false)
    fn?.(template)
  }

  return (
    <div
      className={cn(
        'flex min-h-[72px] cursor-pointer items-center transition-colors hover:bg-bg-subtle',
        wide ? 'gap-4 px-5 py-4' : 'gap-3.5 px-4 py-3.5',
      )}
      onClick={() => onEdit?.(template)}
    >
      <CatTile category={template.category} size={wide ? 46 : 44} radius={14} />

      <div className="min-w-0 flex-1">
        <div className="truncate text-[15.5px] font-bold leading-tight tracking-[-0.01em]">{template.name}</div>
        <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
          <span className="truncate">{template.storeName}</span>
          {template.category?.name && (
            <>
              <span className="shrink-0 text-fg-faint">·</span>
              <CatName name={template.category.name} />
            </>
          )}
          {template.currency && (
            <>
              <span className="shrink-0 text-fg-faint">·</span>
              <span className="shrink-0">{template.currency}</span>
            </>
          )}
        </div>
      </div>

      {wide ? (
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={t('templates.table.actions')}
                className="grid size-9 place-items-center rounded-[9px] text-muted-foreground transition-colors hover:bg-bg-subtle hover:text-foreground"
              >
                <MoreVertical className="size-[18px]" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={6} className="w-48 rounded-xl p-1.5">
              <RowActionList template={template} onEdit={close(onEdit)} onDelete={close(onDelete)} />
            </PopoverContent>
          </Popover>
        </div>
      ) : (
        <button
          type="button"
          aria-label={t('templates.table.actions')}
          onClick={(e) => {
            e.stopPropagation()
            onOpenActions?.(template)
          }}
          className="grid size-9 shrink-0 place-items-center rounded-[9px] text-muted-foreground transition-colors hover:bg-bg-subtle hover:text-foreground"
        >
          <MoreVertical className="size-[18px]" />
        </button>
      )}
    </div>
  )
}

/** Flat template list — one glass card, hairline-separated rows. */
export function TemplateList({
  templates,
  wide,
  onEdit,
  onDelete,
  onOpenActions,
}: { templates: Template[]; wide?: boolean; onOpenActions?: (t: Template) => void } & RowActions) {
  return (
    <ListCard>
      {templates.map((template) => (
        <TemplateRow
          key={template.id}
          template={template}
          wide={wide}
          onEdit={onEdit}
          onDelete={onDelete}
          onOpenActions={onOpenActions}
        />
      ))}
    </ListCard>
  )
}
