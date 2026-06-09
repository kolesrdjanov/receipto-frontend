import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { QrCode, Barcode, Eye, Pencil, Trash2, MoreVertical, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { RowActionItem } from '@/components/glass/primitives'
import type { LoyaltyCard } from '@/hooks/loyalty-cards/use-loyalty-cards'
import { CARD_COLORS, formatLabel } from './format'

/** The code-type glyph tile — colour @ ~12% bg, icon in full colour. */
export function CodeGlyph({ card, size = 40 }: { card: LoyaltyCard; size?: number }) {
  const color = card.color || CARD_COLORS[0]
  const Icon = card.codeType === 'qr' ? QrCode : Barcode
  return (
    <span
      className="grid shrink-0 place-items-center rounded-[11px]"
      style={{ width: size, height: size, background: `color-mix(in srgb, ${color} 12%, transparent)` }}
    >
      <Icon className="size-5" style={{ color }} />
    </span>
  )
}

/** Pill badge: "QR" / "CODE 128" / "EAN 13". */
export function FormatBadge({ card }: { card: LoyaltyCard }) {
  return (
    <span className="shrink-0 whitespace-nowrap rounded-full bg-bg-subtle px-2 py-[3px] text-[10px] font-bold uppercase tracking-[0.03em] text-muted-foreground">
      {formatLabel(card)}
    </span>
  )
}

/** 10-preset swatch picker — selected swatch carries a ring + white check. */
export function ColorSwatches({ value, onChange }: { value?: string; onChange: (hex: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {CARD_COLORS.map((hex) => {
        const on = hex.toLowerCase() === (value || '').toLowerCase()
        return (
          <button
            key={hex}
            type="button"
            aria-label={hex}
            aria-pressed={on}
            onClick={() => onChange(hex)}
            className={cn(
              'grid size-[34px] place-items-center rounded-full outline-none transition-transform',
              'hover:scale-[1.08] focus-visible:scale-[1.08]',
            )}
            style={{
              background: hex,
              boxShadow: on
                ? `0 0 0 2px var(--card), 0 0 0 4px ${hex}`
                : 'inset 0 0 0 1px oklch(0 0 0 / 0.08)',
            }}
          >
            {on && <Check className="size-3.5 text-white" strokeWidth={3} />}
          </button>
        )
      })}
    </div>
  )
}

interface CardActions {
  onShow?: (card: LoyaltyCard) => void
  onEdit?: (card: LoyaltyCard) => void
  onDelete?: (card: LoyaltyCard) => void
}

/** Shared Show code / Edit / Delete list — desktop kebab popover + mobile action sheet. */
export function RowActionList({ card, onShow, onEdit, onDelete }: { card: LoyaltyCard } & CardActions) {
  const { t } = useTranslation()
  const item =
    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[14px] font-medium transition-colors hover:bg-bg-subtle'
  return (
    <div className="flex flex-col gap-0.5">
      <button type="button" className={item} onClick={() => onShow?.(card)}>
        <Eye className="size-[18px] shrink-0 text-muted-foreground" />
        {t('loyaltyCards.showCode')}
      </button>
      <button type="button" className={item} onClick={() => onEdit?.(card)}>
        <Pencil className="size-[18px] shrink-0 text-muted-foreground" />
        {t('loyaltyCards.edit')}
      </button>
      <RowActionItem icon={Trash2} label={t('common.delete')} onClick={() => onDelete?.(card)} danger />
    </div>
  )
}

interface LoyaltyCardItemProps extends CardActions {
  card: LoyaltyCard
  /** Mobile: open the action sheet for this card (kebab tap). */
  onOpenActions?: (card: LoyaltyCard) => void
}

/** Wallet-style glass card. The whole face taps to Show the code; the kebab opens actions. */
export function LoyaltyCardItem({ card, onShow, onEdit, onDelete, onOpenActions }: LoyaltyCardItemProps) {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const color = card.color || CARD_COLORS[0]
  const close = (fn?: (c: LoyaltyCard) => void) => () => {
    setMenuOpen(false)
    fn?.(card)
  }

  return (
    <div
      className={cn(
        'group cursor-pointer overflow-hidden rounded-2xl border border-border bg-card/[0.82] shadow-glass-1',
        '[backdrop-filter:blur(18px)_saturate(1.4)] [-webkit-backdrop-filter:blur(18px)_saturate(1.4)]',
        'transition-[box-shadow,border-color] duration-150 hover:shadow-glass-2',
        'hover:[border-color:color-mix(in_srgb,var(--primary)_35%,transparent)]',
      )}
      onClick={() => onShow?.(card)}
    >
      <div className="h-[5px] w-full" style={{ background: color }} />

      <div className="px-[15px] pb-3 pt-[15px]">
        <div className="flex items-start gap-[11px]">
          <CodeGlyph card={card} />
          <div className="min-w-0 grow">
            <div className="truncate text-[15px] font-bold leading-[1.25] tracking-[-0.01em]" title={card.cardName}>
              {card.cardName}
            </div>
            <div className="mt-[3px] truncate font-mono text-[12px] tracking-[0.02em] text-muted-foreground">
              {card.codeValue}
            </div>
          </div>
          <FormatBadge card={card} />
        </div>

        <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-hairline-soft pt-3">
          <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-fg-2">
            <Eye className="size-3.5 text-muted-foreground" />
            {t('loyaltyCards.tapToShow')}
          </span>

          {/* Desktop: kebab popover. Mobile: kebab opens the action sheet. */}
          <div className="hidden shrink-0 md:block" onClick={(e) => e.stopPropagation()}>
            <Popover open={menuOpen} onOpenChange={setMenuOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={t('loyaltyCards.actions')}
                  className="grid size-8 place-items-center rounded-[9px] text-muted-foreground transition-colors hover:bg-bg-subtle hover:text-foreground"
                >
                  <MoreVertical className="size-[18px]" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" sideOffset={6} className="w-52 rounded-xl p-1.5">
                <RowActionList
                  card={card}
                  onShow={close(onShow)}
                  onEdit={close(onEdit)}
                  onDelete={close(onDelete)}
                />
              </PopoverContent>
            </Popover>
          </div>
          <button
            type="button"
            aria-label={t('loyaltyCards.actions')}
            onClick={(e) => {
              e.stopPropagation()
              onOpenActions?.(card)
            }}
            className="grid size-8 shrink-0 place-items-center rounded-[9px] text-muted-foreground transition-colors hover:bg-bg-subtle hover:text-foreground md:hidden"
          >
            <MoreVertical className="size-[18px]" />
          </button>
        </div>
      </div>
    </div>
  )
}

/** Responsive card grid: 2-up (≥150px) on mobile, wider 3-up (≥300px) on desktop. */
export function CardGrid({
  cards,
  onShow,
  onEdit,
  onDelete,
  onOpenActions,
}: { cards: LoyaltyCard[]; onOpenActions?: (c: LoyaltyCard) => void } & CardActions) {
  return (
    <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fill,minmax(100%,1fr))] md:gap-4 md:[grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
      {cards.map((card) => (
        <LoyaltyCardItem
          key={card.id}
          card={card}
          onShow={onShow}
          onEdit={onEdit}
          onDelete={onDelete}
          onOpenActions={onOpenActions}
        />
      ))}
    </div>
  )
}

/** Loading skeleton matching the card layout (strip · glyph · name/code · footer). */
export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-glass-1">
      <div className="h-[5px] w-full bg-bg-subtle" />
      <div className="px-[15px] pb-3 pt-[15px]">
        <div className="flex items-start gap-[11px]">
          <div className="size-10 shrink-0 animate-pulse rounded-[11px] bg-bg-subtle" />
          <div className="grow space-y-2">
            <div className="h-3 w-[70%] animate-pulse rounded bg-bg-subtle" />
            <div className="h-2.5 w-[50%] animate-pulse rounded bg-bg-subtle" />
          </div>
        </div>
        <div className="mt-3.5 border-t border-hairline-soft pt-3">
          <div className="h-2.5 w-20 animate-pulse rounded bg-bg-subtle" />
        </div>
      </div>
    </div>
  )
}
