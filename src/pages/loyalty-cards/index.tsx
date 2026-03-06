import { useState, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  useLoyaltyCards,
  useDeleteLoyaltyCard,
  type LoyaltyCard,
} from '@/hooks/loyalty-cards/use-loyalty-cards'
import { Plus, CreditCard, QrCode, Barcode, Trash2, Pencil, Eye, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const LoyaltyCardModal = lazy(() =>
  import('@/components/loyalty-cards/loyalty-card-modal').then((m) => ({ default: m.LoyaltyCardModal }))
)
const LoyaltyCardDisplay = lazy(() =>
  import('@/components/loyalty-cards/loyalty-card-display').then((m) => ({ default: m.LoyaltyCardDisplay }))
)

export default function LoyaltyCards() {
  const { t } = useTranslation()
  const { data: cards, isLoading } = useLoyaltyCards()
  const deleteCard = useDeleteLoyaltyCard()

  const [modalOpen, setModalOpen] = useState(false)
  const [editCard, setEditCard] = useState<LoyaltyCard | null>(null)
  const [displayCard, setDisplayCard] = useState<LoyaltyCard | null>(null)
  const [displayOpen, setDisplayOpen] = useState(false)

  const handleAdd = () => {
    setEditCard(null)
    setModalOpen(true)
  }

  const handleEdit = (card: LoyaltyCard) => {
    setEditCard(card)
    setModalOpen(true)
  }

  const handleDisplay = (card: LoyaltyCard) => {
    setDisplayCard(card)
    setDisplayOpen(true)
  }

  const handleDelete = async (card: LoyaltyCard) => {
    try {
      await deleteCard.mutateAsync(card.id)
      toast.success(t('loyaltyCards.cardDeleted'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('loyaltyCards.title')}</h1>
            <p className="text-muted-foreground">{t('loyaltyCards.subtitle')}</p>
          </div>
          <Button onClick={handleAdd} className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            {t('loyaltyCards.addCard')}
          </Button>
        </div>

        {/* Cards grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !cards?.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">{t('loyaltyCards.noCards')}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t('loyaltyCards.noCardsDescription')}</p>
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('loyaltyCards.addCard')}
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <div
                key={card.id}
                className="group relative rounded-xl border bg-card overflow-hidden transition-all hover:shadow-md cursor-pointer"
                onClick={() => handleDisplay(card)}
              >
                {/* Color strip */}
                <div
                  className="h-2"
                  style={{ backgroundColor: card.color || '#3B82F6' }}
                />

                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${card.color || '#3B82F6'}20` }}
                      >
                        {card.codeType === 'qr' ? (
                          <QrCode className="h-4 w-4" style={{ color: card.color || '#3B82F6' }} />
                        ) : (
                          <Barcode className="h-4 w-4" style={{ color: card.color || '#3B82F6' }} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">{card.cardName}</h3>
                        <p className="text-xs text-muted-foreground font-mono truncate">{card.codeValue}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {card.codeType === 'qr' ? 'QR' : card.codeFormat.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>

                  {/* Action buttons */}
                  <div className={cn(
                    'flex items-center gap-1 pt-3 border-t',
                    'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity'
                  )}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 flex-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDisplay(card)
                      }}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {t('loyaltyCards.show')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 flex-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(card)
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      {t('loyaltyCards.edit')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 flex-1 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(card)
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t('common.delete')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Suspense fallback={null}>
        <LoyaltyCardModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          card={editCard}
        />
        <LoyaltyCardDisplay
          card={displayCard}
          open={displayOpen}
          onOpenChange={setDisplayOpen}
        />
      </Suspense>
    </AppLayout>
  )
}
