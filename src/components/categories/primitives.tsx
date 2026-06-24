import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Wallet, Pencil, Trash2, MoreVertical, Check } from 'lucide-react'
import { cn, formatMoney } from '@/lib/utils'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { ListCard, RowActionItem } from '@/components/glass/primitives'
import type { Category } from '@/hooks/categories/use-categories'

/* The 10-swatch palette — shared visual language with Recurring + Loyalty cards. */
const PALETTE = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#22C55E',
  '#14B8A6', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280',
]
export const DEFAULT_CATEGORY_COLOR = '#22C55E'

/**
 * The color circle — the visual anchor of every category. Round, filled with the
 * category color at 15% with a 28% inset ring; the emoji centered at ~46% of the size.
 */
export function CategoryCircle({
  color,
  icon,
  size = 48,
  font,
  className,
}: {
  color?: string
  icon?: string
  size?: number
  font?: number
  className?: string
}) {
  const c = color || '#6B7280'
  const f = font ?? Math.round(size * 0.46)
  return (
    <div
      className={cn('grid shrink-0 place-items-center rounded-full leading-none', className)}
      style={{
        width: size,
        height: size,
        fontSize: f,
        background: `color-mix(in srgb, ${c} 15%, transparent)`,
        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${c} 28%, transparent)`,
      }}
    >
      {icon || '🏷️'}
    </div>
  )
}

/** Budget line — "30.000 RSD / month". Rendered only when a budget is set. */
export function BudgetLine({
  amount,
  currency = 'RSD',
  compact,
}: {
  amount: number
  currency?: string
  compact?: boolean
}) {
  const { t } = useTranslation()
  return (
    <span
      className="mt-1.5 inline-flex items-center gap-1.5 font-semibold text-fg-2"
      style={{ fontSize: compact ? 11.5 : 12.5 }}
    >
      <Wallet className={cn('text-fg-faint', compact ? 'size-[11px]' : 'size-3')} />
      <span>{formatMoney(amount, currency)}</span>
      <span className="font-medium text-fg-faint">{t('categories.perMonth')}</span>
    </span>
  )
}

/** 5×2 swatch picker — selected swatch carries a ring + white check, spring-scales. */
export function ColorSwatches({
  value,
  onChange,
}: {
  value?: string
  onChange: (hex: string) => void
}) {
  return (
    <div className="grid max-w-[320px] grid-cols-5 gap-3.5">
      {PALETTE.map((hex) => {
        const on = hex.toLowerCase() === (value || '').toLowerCase()
        return (
          <button
            key={hex}
            type="button"
            aria-label={hex}
            aria-pressed={on}
            onClick={() => onChange(hex)}
            className={cn(
              'grid size-10 place-items-center rounded-full transition-transform',
              'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
              'hover:scale-[1.08] focus-visible:scale-[1.08]',
            )}
            style={{
              background: hex,
              transform: on ? 'scale(1.04)' : undefined,
              boxShadow: on ? `0 0 0 3px var(--card), 0 0 0 5px ${hex}` : undefined,
            }}
          >
            {on && <Check className="size-[18px] text-white" strokeWidth={3} />}
          </button>
        )
      })}
    </div>
  )
}

interface RowActions {
  onEdit?: (category: Category) => void
  onDelete?: (category: Category) => void
}

/** Shared Edit / Delete list — used by the desktop kebab popover and the mobile action sheet. */
export function RowActionList({ category, onEdit, onDelete }: { category: Category } & RowActions) {
  const { t } = useTranslation()
  const item =
    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[14px] font-medium transition-colors hover:bg-bg-subtle'
  return (
    <div className="flex flex-col gap-0.5">
      <button type="button" className={item} onClick={() => onEdit?.(category)}>
        <Pencil className="size-[18px] shrink-0 text-muted-foreground" />
        {t('categories.actions.edit')}
      </button>
      <RowActionItem icon={Trash2} label={t('categories.actions.delete')} onClick={() => onDelete?.(category)} danger />
    </div>
  )
}

interface CategoryRowProps extends RowActions {
  category: Category
  wide?: boolean
  /** Mobile: open the action sheet for this row (kebab tap). */
  onOpenActions?: (category: Category) => void
}

export function CategoryRow({ category, wide, onEdit, onDelete, onOpenActions }: CategoryRowProps) {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const close = (fn?: (c: Category) => void) => () => {
    setMenuOpen(false)
    fn?.(category)
  }

  return (
    <div
      className={cn(
        'flex min-h-[80px] cursor-pointer items-center transition-colors hover:bg-bg-subtle',
        wide ? 'gap-4 px-5 py-4' : 'gap-3.5 px-4 py-3.5',
      )}
      onClick={() => onEdit?.(category)}
    >
      <CategoryCircle color={category.color} icon={category.icon} size={wide ? 48 : 46} />

      <div className="min-w-0 flex-1">
        <div className="truncate text-[15.5px] font-bold leading-tight tracking-[-0.01em]">
          {category.name}
        </div>
        {category.description ? (
          <div className="mt-0.5 truncate text-[13px] font-medium text-muted-foreground">
            {category.description}
          </div>
        ) : null}
        {category.monthlyBudget ? (
          <BudgetLine amount={category.monthlyBudget} currency={category.budgetCurrency || 'RSD'} />
        ) : null}
      </div>

      {wide ? (
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={t('categories.table.actions')}
                className="grid size-9 place-items-center rounded-[9px] text-muted-foreground transition-colors hover:bg-bg-subtle hover:text-foreground hit-area"
              >
                <MoreVertical className="size-[18px]" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={6} className="w-52 rounded-xl p-1.5">
              <RowActionList category={category} onEdit={close(onEdit)} onDelete={close(onDelete)} />
            </PopoverContent>
          </Popover>
        </div>
      ) : (
        <button
          type="button"
          aria-label={t('categories.table.actions')}
          onClick={(e) => {
            e.stopPropagation()
            onOpenActions?.(category)
          }}
          className="grid size-9 shrink-0 place-items-center rounded-[9px] text-muted-foreground transition-colors hover:bg-bg-subtle hover:text-foreground hit-area"
        >
          <MoreVertical className="size-[18px]" />
        </button>
      )}
    </div>
  )
}

/** Flat category list — one glass card, hairline-separated rows. */
export function CategoryList({
  categories,
  wide,
  onEdit,
  onDelete,
  onOpenActions,
}: { categories: Category[]; wide?: boolean; onOpenActions?: (c: Category) => void } & RowActions) {
  return (
    <ListCard>
      {categories.map((category) => (
        <CategoryRow
          key={category.id}
          category={category}
          wide={wide}
          onEdit={onEdit}
          onDelete={onDelete}
          onOpenActions={onOpenActions}
        />
      ))}
    </ListCard>
  )
}
