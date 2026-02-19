import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Wallet, TrendingDown, TrendingUp, Percent, Settings, Sparkles } from 'lucide-react'
import { useSettingsStore } from '@/store/settings'
import { useExchangeRates } from '@/hooks/currencies/use-currency-converter'
import { useCurrencies } from '@/hooks/currencies/use-currencies'
import type { SavingsOverview } from '@/hooks/savings/use-savings'

interface MonthlySnapshotProps {
  overview: SavingsOverview | undefined
  isLoading: boolean
}

export function MonthlySnapshot({ overview, isLoading }: MonthlySnapshotProps) {
  const { t } = useTranslation()
  const { currency: displayCurrency } = useSettingsStore()
  const { data: rates } = useExchangeRates(displayCurrency)
  const { currencies } = useCurrencies()

  const currencySymbol = currencies.find((c) => c.code === displayCurrency)?.symbol || displayCurrency

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          {t('common.loading')}
        </CardContent>
      </Card>
    )
  }

  // No income set — prompt
  if (!overview?.monthlyIncome) {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-3">
          <Wallet className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {t('savings.snapshot.noIncome')}
          </p>
          <Link to="/settings">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
              {t('savings.snapshot.goToSettings')}
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  // Convert income to display currency
  const incomeInDisplay = rates
    ? overview.monthlyIncome / (rates[overview.incomeCurrency || displayCurrency] || 1)
    : overview.monthlyIncome

  // Convert all spending to display currency
  const totalSpentInDisplay = (overview?.spending || []).reduce((sum, s) => {
    const rate = rates?.[s.currency] || 1
    return sum + s.totalAmount / rate
  }, 0)

  const saved = incomeInDisplay - totalSpentInDisplay
  const savingsRate = incomeInDisplay > 0 ? (saved / incomeInDisplay) * 100 : 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          {t('savings.snapshot.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {t('savings.snapshot.income')}
            </p>
            <p className="text-lg font-semibold">
              {Math.round(incomeInDisplay).toLocaleString()} {currencySymbol}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              {t('savings.snapshot.spent')}
            </p>
            <p className="text-lg font-semibold">
              {Math.round(totalSpentInDisplay).toLocaleString()} {currencySymbol}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Wallet className="h-3 w-3" />
              {t('savings.snapshot.saved')}
            </p>
            <p className={`text-lg font-semibold ${saved >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {saved >= 0 ? '+' : ''}{Math.round(saved).toLocaleString()} {currencySymbol}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Percent className="h-3 w-3" />
              {t('savings.snapshot.rate')}
            </p>
            <p className={`text-lg font-semibold ${savingsRate >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {savingsRate >= 0 ? '+' : ''}{Math.round(savingsRate)}%
            </p>
          </div>
        </div>

        {/* Auto-savings potential */}
        {(() => {
          const totalPotential = (overview?.goals || [])
            .filter((g) => !g.isCompleted && g.potentialSavings != null && g.potentialSavings > 0)
            .reduce((sum, g) => sum + (g.potentialSavings || 0), 0)
          if (totalPotential <= 0) return null
          return (
            <div className="mt-4 pt-3 border-t flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span className="text-muted-foreground">{t('savings.insights.autoSavingsTotal')}:</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                ~{Math.round(totalPotential).toLocaleString()} {currencySymbol}
              </span>
            </div>
          )
        })()}
      </CardContent>
    </Card>
  )
}
