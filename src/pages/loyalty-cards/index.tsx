import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { AppLayout } from '@/components/layout/app-layout'
import { PageToolbar } from '@/components/layout/page-toolbar'
import { PageTransition } from '@/components/ui/animated'
import { GlassDialog } from '@/components/glass/glass-dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { CardGrid, CardSkeleton, RowActionList } from '@/components/loyalty-cards/primitives'
import { formatLabel } from '@/components/loyalty-cards/format'
import {
  useLoyaltyCards,
  useDeleteLoyaltyCard,
  type LoyaltyCard,
} from '@/hooks/loyalty-cards/use-loyalty-cards'
import { useFabStore } from '@/store/fab'
import { cn } from '@/lib/utils'

const LoyaltyCardModal = lazy(() =>
  import('@/components/loyalty-cards/loyalty-card-modal').then((m) => ({ default: m.LoyaltyCardModal }))
)
const LoyaltyCardDisplay = lazy(() =>
  import('@/components/loyalty-cards/loyalty-card-display').then((m) => ({ default: m.LoyaltyCardDisplay }))
)

/** Auto-width brand-gradient CTA (gradient stays on the logo, this CTA, and the FAB only). */
function AddButton({ onClick, label, className }: { onClick: () => void; label: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('btn-brand inline-flex h-10 items-center gap-2 rounded-full px-4 text-[15px] font-semibold text-white', className)}
      data-testid="loyalty-add-button"
    >
      <Plus className="size-[17px]" strokeWidth={2.4} />
      {label}
    </button>
  )
}

export default function LoyaltyCards() {
  const { t } = useTranslation()
  const { data: cards, isLoading } = useLoyaltyCards()
  const deleteCard = useDeleteLoyaltyCard()

  const [modalOpen, setModalOpen] = useState(false)
  const [editCard, setEditCard] = useState<LoyaltyCard | null>(null)
  const [displayCard, setDisplayCard] = useState<LoyaltyCard | null>(null)
  const [displayOpen, setDisplayOpen] = useState(false)
  const [actionsCard, setActionsCard] = useState<LoyaltyCard | null>(null)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [cardToDelete, setCardToDelete] = useState<LoyaltyCard | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const handleAdd = useCallback(() => {
    setEditCard(null)
    setModalOpen(true)
  }, [])

  // Take over the global mobile FAB so it opens the Add form directly.
  const setFab = useFabStore((s) => s.setFab)
  const clearFab = useFabStore((s) => s.clearFab)
  useEffect(() => {
    setFab(handleAdd)
    return () => clearFab()
  }, [setFab, clearFab, handleAdd])

  const handleEdit = (card: LoyaltyCard) => {
    setEditCard(card)
    setModalOpen(true)
  }

  const handleDisplay = (card: LoyaltyCard) => {
    setDisplayCard(card)
    setDisplayOpen(true)
  }

  const requestDelete = (card: LoyaltyCard) => {
    setCardToDelete(card)
    setDeleteOpen(true)
  }

  const openActions = (card: LoyaltyCard) => {
    setActionsCard(card)
    setActionsOpen(true)
  }

  const confirmDelete = async () => {
    if (!cardToDelete) return
    try {
      await deleteCard.mutateAsync(cardToDelete.id)
      toast.success(t('loyaltyCards.cardDeleted'))
    } catch {
      toast.error(t('common.error'))
    } finally {
      setCardToDelete(null)
    }
  }

  const list = cards ?? []

  const header = (
    <>
      <PageToolbar
        className="md:-mx-8 md:-mt-8 md:mb-6"
        title={t('loyaltyCards.title')}
        subtitle={t('loyaltyCards.subtitle')}
        actions={<AddButton onClick={handleAdd} label={t('loyaltyCards.addCard')} />}
      />
      <div className="mb-1 flex items-end justify-between md:hidden">
        <div>
          <h1 className="t-h1 text-[28px]">{t('loyaltyCards.title')}</h1>
          <p className="mt-1 text-[12.5px] text-muted-foreground">{t('loyaltyCards.mobileSubtitle')}</p>
        </div>
        <AddButton onClick={handleAdd} label={t('loyaltyCards.add')} className="h-[38px] px-3.5" />
      </div>
    </>
  )

  return (
    <AppLayout>
      <PageTransition>
        {header}

        {isLoading ? (
          <div className="mt-4 grid gap-3.5 [grid-template-columns:repeat(auto-fill,minmax(150px,1fr))] md:mt-0 md:gap-4 md:[grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div
            className="mt-4 grid place-items-center rounded-3xl border border-border bg-card px-6 py-16 text-center shadow-glass-1 md:mt-0"
            data-testid="loyalty-empty"
          >
            <span className="grid size-[76px] place-items-center rounded-[22px] bg-bg-subtle text-muted-foreground">
              <CreditCard className="size-8" />
            </span>
            <h3 className="t-h3 mt-[18px]">{t('loyaltyCards.noCards')}</h3>
            <p className="t-sm mt-2 max-w-[320px] text-muted-foreground">{t('loyaltyCards.noCardsDescription')}</p>
            <div className="mt-[22px]">
              <AddButton onClick={handleAdd} label={t('loyaltyCards.addCard')} />
            </div>
          </div>
        ) : (
          <>
            {/* "All cards · N" row */}
            <div className="mb-3.5 mt-4 flex items-baseline justify-between px-1">
              <span className="t-xs md:hidden">{t('loyaltyCards.allCards')}</span>
              <div className="hidden items-baseline gap-2 md:flex">
                <span className="text-[14px] font-semibold">{t('loyaltyCards.allCards')}</span>
                <span className="text-[13px] text-muted-foreground">· {list.length}</span>
              </div>
              <span className="text-[12px] text-muted-foreground md:hidden">
                {t('loyaltyCards.cardCount', { count: list.length })}
              </span>
            </div>

            <CardGrid
              cards={list}
              onShow={handleDisplay}
              onEdit={handleEdit}
              onDelete={requestDelete}
              onOpenActions={openActions}
            />

            <p className="py-4 text-center text-[12px] text-fg-faint md:hidden">{t('loyaltyCards.footerHint')}</p>
          </>
        )}
      </PageTransition>

      <Suspense fallback={null}>
        <LoyaltyCardModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          card={editCard}
          onRequestDelete={requestDelete}
        />
        <LoyaltyCardDisplay card={displayCard} open={displayOpen} onOpenChange={setDisplayOpen} />
      </Suspense>

      {/* Mobile card action sheet */}
      {actionsCard && (
        <GlassDialog
          open={actionsOpen}
          onOpenChange={setActionsOpen}
          title={actionsCard.cardName}
          description={`${formatLabel(actionsCard)} · ${actionsCard.codeValue}`}
          bodyClassName="py-3"
        >
          <RowActionList
            card={actionsCard}
            onShow={(c) => {
              setActionsOpen(false)
              handleDisplay(c)
            }}
            onEdit={(c) => {
              setActionsOpen(false)
              handleEdit(c)
            }}
            onDelete={(c) => {
              setActionsOpen(false)
              requestDelete(c)
            }}
          />
        </GlassDialog>
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        variant="destructive"
        title={t('loyaltyCards.deleteTitle')}
        description={t('loyaltyCards.deleteConfirm', { name: cardToDelete?.cardName ?? '' })}
        confirmText={t('common.delete')}
        isLoading={deleteCard.isPending}
      />
    </AppLayout>
  )
}
