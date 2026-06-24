import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useShoppingInsights } from '@/hooks/items/use-items'
import { EmptyState } from '@/components/glass/empty-state'
import {
  Sparkles,
  Repeat,
  ArrowLeftRight,
  TrendingUp,
  Store,
  Lightbulb,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const typeIcons = {
  frequency: Repeat,
  price_comparison: ArrowLeftRight,
  trend: TrendingUp,
  store_preference: Store,
  tip: Lightbulb,
} as const

const toneColors = {
  positive: 'text-success-foreground bg-success-soft border-success/20',
  neutral: 'text-info-foreground bg-info-soft border-info/20',
  warning: 'text-warning-foreground bg-warning-soft border-warning/20',
} as const

export function ShoppingInsights() {
  const { t } = useTranslation()
  const { data, isLoading } = useShoppingInsights()

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.insights.length === 0) {
    return (
      <EmptyState
        compact
        className="mb-6"
        icon={Sparkles}
        title={t('items.insights.title')}
        description={t('items.insights.noInsights')}
      />
    )
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {t('items.insights.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 flex flex-col">
          {data.insights.map((insight) => {
            const Icon = typeIcons[insight.type] || Lightbulb
            const colorClass = toneColors[insight.tone] || toneColors.neutral
            const hasValidProductId = insight.productId && UUID_REGEX.test(insight.productId)

            const content = (
              <div
                className={cn(
                  'flex gap-3 p-2.5 rounded-lg border transition-colors',
                  colorClass,
                  hasValidProductId && 'hover:opacity-80 cursor-pointer',
                )}
              >
                <div className="shrink-0 mt-0.5">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm leading-tight">{insight.title}</p>
                  <p className="text-xs mt-0.5 opacity-80 leading-snug">{insight.message}</p>
                </div>
              </div>
            )

            if (hasValidProductId) {
              return (
                <Link
                  key={insight.id}
                  to={`/items/${insight.productId}`}
                  className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {content}
                </Link>
              )
            }

            return <div key={insight.id}>{content}</div>
          })}
        </div>
      </CardContent>
    </Card>
  )
}
