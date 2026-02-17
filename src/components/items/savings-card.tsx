import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSavingsOpportunities } from '@/hooks/items/use-items'
import { useSettingsStore } from '@/store/settings'
import { PiggyBank, ArrowRight, TrendingDown } from 'lucide-react'

export function SavingsCard() {
  const { t } = useTranslation()
  const { data: savings } = useSavingsOpportunities(5)
  const { currency } = useSettingsStore()

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: currency || 'RSD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (!savings || savings.length === 0) return null

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PiggyBank className="h-5 w-5 text-green-500" />
          {t('items.savingsOpportunities')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {savings.map((saving) => (
            <Link
              key={`${saving.productId}-${saving.cheaperStore}`}
              to={`/items/${saving.productId}`}
              className="flex items-center justify-between gap-4 p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{saving.displayName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {saving.currentStore}: {formatPrice(saving.currentPrice)}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-green-600 font-medium">
                    {saving.cheaperStore}: {formatPrice(saving.cheaperPrice)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <TrendingDown className="h-3.5 w-3.5 text-green-500" />
                <span className="text-sm font-semibold text-green-600">
                  -{saving.savingsPercent}%
                </span>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
