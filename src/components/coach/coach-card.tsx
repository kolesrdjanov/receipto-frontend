import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Sparkles,
  ChevronRight,
  Bot,
  RefreshCw,
} from 'lucide-react'
import { useCoach, type Insight } from '@/hooks/coach/use-coach'
import { useExchangeRates } from '@/hooks/currencies/use-currency-converter'
import { useSettingsStore } from '@/store/settings'
import { WidgetCard, WidgetHead, WidgetEmpty, TrendPill, Shimmer } from '@/components/dashboard/primitives'
import { cn } from '@/lib/utils'

function formatAmount(amount: number, currency: string, locale: string = 'sr-RS'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount))
}

interface CoachCardProps {
  displayCurrency?: string
}

function InsightIcon({ insight }: { insight: Insight }) {
  const iconProps = { className: 'size-4 shrink-0' }

  switch (insight.type) {
    case 'spending_increase':
      return <TrendingUp {...iconProps} />
    case 'spending_decrease':
      return <TrendingDown {...iconProps} />
    case 'budget_exceeded':
    case 'budget_warning':
      return <AlertTriangle {...iconProps} />
    case 'budget_on_track':
      return <CheckCircle2 {...iconProps} />
    case 'tip':
      return <Lightbulb {...iconProps} />
    default:
      return <Sparkles {...iconProps} />
  }
}

const TONE_STYLES: Record<Insight['tone'], string> = {
  positive: 'bg-success-soft text-success-foreground',
  neutral: 'bg-primary-soft text-primary',
  warning: 'bg-warning-soft text-warning-foreground',
  celebration: 'bg-brand-violet-soft text-brand-violet-foreground',
}

function InsightItem({ insight }: { insight: Insight }) {
  const navigate = useNavigate()

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl px-3 py-2.5 text-[13px]',
        TONE_STYLES[insight.tone],
      )}
    >
      <div className="mt-0.5">
        <InsightIcon insight={insight} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{insight.title}</p>
        <p className="mt-0.5 text-[12px] opacity-80">{insight.message}</p>
      </div>
      {insight.actionRoute && (
        <button
          type="button"
          onClick={() => navigate(insight.actionRoute!)}
          className="-m-1 shrink-0 rounded-md p-1 transition-opacity hover:opacity-70"
          aria-label={insight.title}
        >
          <ChevronRight className="size-4" />
        </button>
      )}
    </div>
  )
}

export function CoachCard({ displayCurrency }: CoachCardProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'sr' ? 'sr-RS' : 'en-US'
  const { currency: preferredCurrency } = useSettingsStore()
  const targetCurrency = displayCurrency || preferredCurrency || 'RSD'
  const { data: exchangeRates } = useExchangeRates(targetCurrency)
  const { data, isLoading, error, refetch } = useCoach()

  if (isLoading) {
    return (
      <WidgetCard>
        <WidgetHead icon={Bot} iconTone="primary" title={t('coach.title')} />
        <div className="space-y-3">
          <Shimmer className="h-4 w-2/3" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Shimmer className="h-16 rounded-xl" />
            <Shimmer className="h-16 rounded-xl" />
          </div>
          <Shimmer className="h-12 rounded-xl" />
        </div>
      </WidgetCard>
    )
  }

  if (error || !data) {
    return (
      <WidgetCard>
        <WidgetHead icon={Bot} iconTone="primary" title={t('coach.title')} />
        <WidgetEmpty tall>
          <span className="font-medium text-foreground">{t('coach.errorTitle')}</span>
          <span>{t('coach.errorDescription')}</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[13px] font-medium transition-colors hover:bg-bg-subtle"
          >
            <RefreshCw className="size-3.5" />
            {t('coach.retry')}
          </button>
        </WidgetEmpty>
      </WidgetCard>
    )
  }

  const { greeting, insights, summary, tip } = data

  const convertBreakdownToTotal = (breakdown: { currency: string; amount: number }[]) => {
    let total = 0
    for (const { currency, amount } of breakdown) {
      if (currency === targetCurrency) {
        total += amount
      } else {
        const rate = exchangeRates?.[currency]
        if (rate && rate !== 0) {
          total += amount / rate
        }
        // Skip amounts with no exchange rate — adding unconverted amounts is misleading
      }
    }
    return total
  }

  const thisWeekConverted = summary?.byCurrency
    ? convertBreakdownToTotal(summary.byCurrency)
    : summary?.totalSpentThisWeek || 0

  const lastWeekConverted = summary?.lastWeekByCurrency
    ? convertBreakdownToTotal(summary.lastWeekByCurrency)
    : summary?.totalSpentLastWeek || 0

  const convertedWeeklyChangePercent = lastWeekConverted > 0
    ? Math.round(((thisWeekConverted - lastWeekConverted) / lastWeekConverted) * 1000) / 10
    : thisWeekConverted > 0
      ? 100
      : 0

  const topCategoryConverted = summary?.topCategory?.byCurrency
    ? convertBreakdownToTotal(summary.topCategory.byCurrency)
    : null

  const isAiSource = data.source === 'ai'

  // For rule-based responses: re-generate insight messages with converted currency amounts
  // and filter out spending insights that contradict the actual converted percentage.
  // For AI responses: messages are already generated in the correct language, skip overrides.
  const convertedInsights = insights
    .filter((insight: Insight) => {
      if (isAiSource) return true
      if (insight.type === 'spending_increase' && convertedWeeklyChangePercent <= 0) return false
      if (insight.type === 'spending_decrease' && convertedWeeklyChangePercent >= 0) return false
      return true
    })
    .map((insight: Insight) => {
      if (isAiSource) return insight

      const details = insight.details
      if (!details) return insight

      if (insight.type === 'weekly_summary' && details.byCurrency) {
        const converted = convertBreakdownToTotal(details.byCurrency)
        return {
          ...insight,
          message: t('coach.topCategoryMessage', {
            amount: formatAmount(converted, targetCurrency, locale),
            category: details.categoryName,
          }),
        }
      }

      if (insight.type === 'spending_increase' && details.currentByCurrency) {
        return {
          ...insight,
          message: t('coach.spendingUpMessage', {
            percent: Math.abs(convertedWeeklyChangePercent),
          }),
        }
      }

      if (insight.type === 'spending_decrease' && details.currentByCurrency) {
        return {
          ...insight,
          message: t('coach.spendingDownMessage', {
            percent: Math.abs(convertedWeeklyChangePercent),
          }),
        }
      }

      return insight
    })

  return (
    <WidgetCard>
      <WidgetHead
        icon={Bot}
        iconTone="primary"
        title={t('coach.title')}
        trailing={
          summary && summary.receiptsThisWeek > 0 ? (
            <span className="text-[12px] text-muted-foreground">
              {t('coach.receiptsThisWeek', { count: summary.receiptsThisWeek })}
            </span>
          ) : undefined
        }
      />

      {greeting && <p className="-mt-2 mb-4 text-[13px] text-muted-foreground">{greeting}</p>}

      <div className="space-y-4">
        {/* Weekly summary — two-column */}
        {summary && (
          <div className="grid gap-3 sm:grid-cols-2">
            {/* This week */}
            <div className="space-y-1 rounded-xl bg-bg-subtle p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="t-xs text-muted-foreground">{t('coach.thisWeek')}</span>
                <TrendPill value={convertedWeeklyChangePercent} />
              </div>
              <p className="text-[20px] font-extrabold leading-tight tabular-nums">
                {formatAmount(thisWeekConverted, targetCurrency, locale)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {t('coach.vsLastWeek')}: {formatAmount(lastWeekConverted, targetCurrency, locale)}
              </p>
            </div>

            {/* Top category */}
            {summary.topCategory ? (
              <div className="space-y-1 rounded-xl bg-bg-subtle p-3">
                <span className="t-xs text-muted-foreground">{t('coach.topSpending')}</span>
                <p className="text-[20px] font-extrabold leading-tight tabular-nums">
                  {formatAmount(topCategoryConverted ?? summary.topCategory.amount, targetCurrency, locale)}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {summary.topCategory.icon} {summary.topCategory.name}
                </p>
              </div>
            ) : (
              <div className="grid place-items-center rounded-xl bg-bg-subtle p-3">
                <p className="text-[12px] text-muted-foreground">{t('coach.noInsights')}</p>
              </div>
            )}
          </div>
        )}

        {/* Insights */}
        {convertedInsights.length > 0 && (
          <div className="space-y-2">
            <h4 className="t-xs text-muted-foreground">{t('coach.insightsTitle')}</h4>
            <div className="space-y-2">
              {convertedInsights.map((insight: Insight) => (
                <InsightItem key={insight.id} insight={insight} />
              ))}
            </div>
          </div>
        )}

        {/* Tip */}
        {tip && (
          <div className="flex items-start gap-3 rounded-xl bg-warning-soft/60 px-3 py-2.5 text-[13px]">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-warning" />
            <div>
              <p className="font-semibold text-foreground">{tip.title}</p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">{tip.message}</p>
            </div>
          </div>
        )}

        {convertedInsights.length === 0 && !tip && (
          <p className="py-4 text-center text-[13px] text-muted-foreground">{t('coach.noInsights')}</p>
        )}
      </div>
    </WidgetCard>
  )
}
