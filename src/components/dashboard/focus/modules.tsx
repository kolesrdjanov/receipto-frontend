import { useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import {
  Wallet,
  Crown,
  Activity,
  PieChart as PieChartIcon,
  Bot,
  TrendingUp,
  Lightbulb,
  CalendarClock,
  Receipt as ReceiptIcon,
  Target,
} from 'lucide-react'
import { FocusCard, FocusTrailing, AmountsEyeToggle } from './primitives'
import { WidgetEmpty, Shimmer, TrendPill, HiddenDots } from '@/components/dashboard/primitives'
import { Button } from '@/components/ui/button'
import { useCoach, type Insight } from '@/hooks/coach/use-coach'
import { useExchangeRates } from '@/hooks/currencies/use-currency-converter'
import {
  useUpcomingExpenses,
  type UpcomingExpense,
} from '@/hooks/recurring-expenses/use-recurring-expenses'
import type { Receipt } from '@/hooks/receipts/use-receipts'
import { cn, formatMoney } from '@/lib/utils'
import { formatDate } from '@/lib/date-utils'

/** Short masked placeholder for inline amounts (the hero uses the longer `HiddenDots`). */
const MASK = '••••'

/* ============================================================
   HERO — month spend + integrated budget meter
   ============================================================ */
export interface FocusHeroProps {
  monthLabel: string
  spent: number
  budget: number
  projected: number
  vsLastMonth: number
  daysElapsed: number
  daysTotal: number
  displayCurrency: string
  amountsVisible: boolean
  onToggleAmounts: () => void
  isCurrentMonth: boolean
}

export function FocusHero({
  monthLabel,
  spent,
  budget,
  projected,
  vsLastMonth,
  daysElapsed,
  daysTotal,
  displayCurrency,
  amountsVisible,
  onToggleAmounts,
  isCurrentMonth,
}: FocusHeroProps) {
  const { t } = useTranslation()
  const hasBudget = budget > 0
  const pct = hasBudget ? Math.min((spent / budget) * 100, 100) : 0
  const projPct = hasBudget ? Math.min((projected / budget) * 100, 100) : 0
  const remaining = budget - spent
  const overPace = projected - budget

  return (
    <section className="glass-card relative flex flex-col overflow-hidden px-[26px] pb-[22px] pt-6">
      <div className="dash-hero-sheen" aria-hidden />

      <AmountsEyeToggle
        visible={amountsVisible}
        onToggle={onToggleAmounts}
        className="absolute right-[18px] top-[18px] z-[2]"
      />

      <div className="relative z-[1] text-[12.5px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
        {t('dashboard.focus.spentLabel', { month: monthLabel })}
      </div>

      <div className="relative z-[1] mt-2.5 flex flex-wrap items-baseline gap-x-3.5 gap-y-2">
        <span className="font-display text-[42px] font-extrabold leading-none tracking-[-0.03em] text-foreground md:text-[52px]">
          {amountsVisible ? formatMoney(spent, displayCurrency) : <HiddenDots />}
        </span>
        <TrendPill value={vsLastMonth} className="h-6 gap-1 px-2.5 text-[12.5px] [&_svg]:size-3.5" />
      </div>

      <div className="relative z-[1] mt-2.5 text-[12.5px] leading-snug text-muted-foreground">
        {vsLastMonth !== 0 &&
          `${t(vsLastMonth < 0 ? 'dashboard.focus.vsBelow' : 'dashboard.focus.vsAbove', {
            percent: Math.abs(vsLastMonth),
          })} · `}
        {t('dashboard.focus.daysElapsed', { elapsed: daysElapsed, total: daysTotal })}
      </div>

      {hasBudget && (
        <div className="relative z-[1] mt-auto pt-5">
          <div className="relative h-2.5 rounded-full bg-bg-subtle/90 dark:bg-black/30">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
            {isCurrentMonth && (
              <div
                className="absolute -top-[3px] h-4 w-[3px] -translate-x-1/2 rounded-sm bg-foreground shadow-[0_0_0_2px_var(--card)]"
                style={{ left: `${projPct}%` }}
                title={t('dashboard.focus.projectedMonthEnd')}
              />
            )}
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-3 text-[12.5px] text-muted-foreground">
            <span>
              <Trans
                i18nKey="dashboard.focus.budgetOf"
                values={{
                  spent: amountsVisible ? formatMoney(spent, displayCurrency) : MASK,
                  budget: formatMoney(budget, displayCurrency),
                }}
                components={[<b className="font-bold text-foreground" />]}
              />
            </span>
            {isCurrentMonth && overPace > 0 ? (
              <span className="font-bold text-warning-foreground">
                {t('dashboard.focus.budgetOverPace', {
                  amount: amountsVisible ? formatMoney(overPace, displayCurrency) : MASK,
                })}
              </span>
            ) : (
              <span className="font-bold text-success-foreground">
                {t('dashboard.focus.budgetLeft', {
                  amount: amountsVisible ? formatMoney(Math.max(remaining, 0), displayCurrency) : MASK,
                })}
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

/* ============================================================
   SAFE TO SPEND / FORECAST — the headline forward-looking card
   ============================================================ */
export interface FocusSafeToSpendProps {
  budget: number
  spent: number
  projected: number
  dailyAvg: number
  vsLastMonth: number
  daysLeft: number
  monthLabel: string
  displayCurrency: string
  amountsVisible: boolean
  isCurrentMonth: boolean
}

export function FocusSafeToSpend({
  budget,
  spent,
  projected,
  dailyAvg,
  vsLastMonth,
  daysLeft,
  monthLabel,
  displayCurrency,
  amountsVisible,
  isCurrentMonth,
}: FocusSafeToSpendProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // No global budget set (the app uses per-category budgets) → invite the user to set one.
  if (budget <= 0) {
    return (
      <section className="flex flex-col rounded-[28px] border border-primary/20 bg-primary-soft p-[22px] shadow-glass-1">
        <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.05em] text-primary">
          <Wallet className="size-3.5" />
          {t('dashboard.focus.safeToSpend')}
        </span>
        <h3 className="mt-3 text-[18px] font-extrabold tracking-[-0.01em]">
          {t('dashboard.focus.noBudgetTitle')}
        </h3>
        <p className="mt-1.5 text-[13px] text-muted-foreground">{t('dashboard.focus.noBudgetBody')}</p>
        <Button
          type="button"
          variant="glass"
          size="pill"
          className="mt-auto self-start"
          onClick={() => navigate('/categories')}
        >
          <Target className="size-4" />
          {t('dashboard.focus.noBudgetCta')}
        </Button>
      </section>
    )
  }

  const remaining = budget - spent
  const safePerDay = isCurrentMonth && daysLeft > 0 ? Math.max(Math.round(remaining / daysLeft), 0) : 0
  const showSafe = isCurrentMonth && daysLeft > 0

  return (
    <section className="flex flex-col rounded-[28px] border border-primary/20 bg-primary-soft p-[22px] shadow-glass-1">
      <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.05em] text-primary">
        <Wallet className="size-3.5" />
        {t('dashboard.focus.safeToSpend')}
      </span>

      {showSafe ? (
        <>
          <div className="mt-3 flex items-baseline gap-1.5 font-display text-[34px] font-extrabold leading-none tracking-[-0.02em] md:text-[38px]">
            {amountsVisible ? formatMoney(safePerDay, displayCurrency) : MASK}
            <span className="text-[15px] font-bold text-muted-foreground">{t('dashboard.focus.perDay')}</span>
          </div>
          <p className="mt-2 max-w-[30ch] text-[12.5px] leading-snug text-muted-foreground">
            {t('dashboard.focus.safeCaption', { days: daysLeft, month: monthLabel })}
          </p>
        </>
      ) : (
        <>
          <div className="mt-3 flex items-baseline gap-1.5 font-display text-[34px] font-extrabold leading-none tracking-[-0.02em] md:text-[38px]">
            {amountsVisible ? formatMoney(Math.round(dailyAvg), displayCurrency) : MASK}
            <span className="text-[15px] font-bold text-muted-foreground">{t('dashboard.focus.perDay')}</span>
          </div>
          <p className="mt-2 max-w-[30ch] text-[12.5px] leading-snug text-muted-foreground">
            {t('dashboard.focus.avgPerDayCaption', { month: monthLabel })}
          </p>
        </>
      )}

      <div className="mt-auto flex flex-col gap-3 pt-[18px]">
        <div className="flex items-center justify-between gap-3 border-t border-primary/15 pt-3 dark:border-white/10">
          <span className="text-[12.5px] font-semibold text-muted-foreground">
            {isCurrentMonth ? t('dashboard.focus.projectedMonthEnd') : t('dashboard.focus.monthTotal')}
          </span>
          <span className="inline-flex items-center gap-2 text-[15px] font-bold">
            {amountsVisible ? formatMoney(projected, displayCurrency) : MASK}
            <TrendPill value={vsLastMonth} />
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-primary/15 pt-3 dark:border-white/10">
          <span className="text-[12.5px] font-semibold text-muted-foreground">{t('dashboard.focus.dailyAverage')}</span>
          <span className="text-[15px] font-bold">
            {amountsVisible ? formatMoney(dailyAvg, displayCurrency) : MASK}
          </span>
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   RANK RIBBON — slim amber status strip
   ============================================================ */
export interface FocusRankRibbonProps {
  rankName: string
  receiptCount: number
  progress: number
  isTopTier: boolean
  toNextCount: number
}

export function FocusRankRibbon({ rankName, receiptCount, progress, isTopTier, toNextCount }: FocusRankRibbonProps) {
  const { t } = useTranslation()
  return (
    <section className="flex items-center gap-3.5 rounded-2xl border border-warning/30 bg-warning-soft px-[18px] py-[13px]">
      <span className="grid size-[38px] shrink-0 place-items-center rounded-xl bg-card shadow-glass-1">
        <Crown className="size-[17px] text-warning-foreground" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2.5">
          <span className="truncate text-[14px] font-bold text-foreground">{rankName}</span>
          <span className="shrink-0 text-[12px] font-semibold text-muted-foreground">
            {t('dashboard.focus.rankReceipts', { count: receiptCount })}
          </span>
        </div>
        <div className="mt-2 h-[5px] overflow-hidden rounded-full bg-warning/25 dark:bg-black/25">
          <div className="h-full rounded-full bg-warning" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-card px-[11px] text-[11.5px] font-bold text-warning-foreground shadow-glass-1">
        {isTopTier ? t('dashboard.focus.topTierTag') : t('dashboard.focus.toGoTag', { count: toNextCount })}
      </span>
    </section>
  )
}

/* ============================================================
   DAILY FLOW — calm area sparkline + stat strip
   ============================================================ */
export interface FocusDailyFlowProps {
  series: { date: string; amount: number }[]
  avgPerDay: number
  monthYearLabel: string
  displayCurrency: string
  amountsVisible: boolean
  isCurrentMonth: boolean
  loading: boolean
}

export function FocusDailyFlow({
  series,
  avgPerDay,
  monthYearLabel,
  displayCurrency,
  amountsVisible,
  isCurrentMonth,
  loading,
}: FocusDailyFlowProps) {
  const { t, i18n } = useTranslation()

  const hasData = series.some((d) => d.amount > 0)
  const localeTag = i18n.language === 'sr' ? 'sr-Latn-RS' : 'en-US'
  const shortDate = (iso: string) =>
    new Date(iso + 'T00:00:00').toLocaleDateString(localeTag, { month: 'short', day: 'numeric' })

  const { line, area, lastPoint } = useMemo(() => {
    const W = 600
    const H = 190
    const pad = 14
    const amounts = series.map((d) => d.amount)
    const n = amounts.length
    const max = Math.max(...amounts, 1)
    const step = n > 1 ? W / (n - 1) : W
    const pts = amounts.map((v, i) => [i * step, H - pad - (v / max) * (H - pad * 2.4)] as const)
    const linePath = pts.length ? 'M' + pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L') : ''
    const last = pts[pts.length - 1] ?? [0, H - pad]
    const areaPath = pts.length ? `${linePath} L${last[0].toFixed(1)},${H} L0,${H} Z` : ''
    return { line: linePath, area: areaPath, lastPoint: last }
  }, [series])

  const highestDay = series.reduce((m, d) => Math.max(m, d.amount), 0)
  const activeDays = series.filter((d) => d.amount > 0).length
  const firstLabel = series.length ? shortDate(series[0].date) : ''
  const lastLabel = series.length ? shortDate(series[series.length - 1].date) : ''

  return (
    <FocusCard
      icon={Activity}
      title={t('dashboard.focus.dailyFlow')}
      trailing={<FocusTrailing>{monthYearLabel}</FocusTrailing>}
    >
      {loading ? (
        <Shimmer className="h-[190px] rounded-2xl" />
      ) : !hasData ? (
        <WidgetEmpty tall>{t('dashboard.noDataThisMonth')}</WidgetEmpty>
      ) : (
        <>
          <div className="h-[190px]">
            <svg
              viewBox="0 0 600 190"
              preserveAspectRatio="none"
              className="block h-full w-full"
              role="img"
              aria-label={`${t('dashboard.focus.dailyFlow')} — ${firstLabel} – ${lastLabel}, ${activeDays} ${t('dashboard.focus.activeDays')}`}
            >
              <defs>
                <linearGradient id="focFlowFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="var(--primary)" stopOpacity="0.24" />
                  <stop offset="1" stopColor="var(--primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {area && <path d={area} fill="url(#focFlowFill)" />}
              {line && (
                <path
                  d={line}
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}
              <circle cx={lastPoint[0]} cy={lastPoint[1]} r="4.5" fill="var(--primary)" />
            </svg>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-fg-faint">
            <span>{firstLabel}</span>
            <span>{isCurrentMonth ? `${t('dashboard.focus.today')} · ${lastLabel}` : lastLabel}</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-hairline-soft pt-4">
            <FlowStat label={t('dashboard.focus.avgDay')} value={amountsVisible ? formatMoney(avgPerDay, displayCurrency) : MASK} />
            <FlowStat label={t('dashboard.focus.highestDay')} value={amountsVisible ? formatMoney(highestDay, displayCurrency) : MASK} />
            <FlowStat label={t('dashboard.focus.activeDays')} value={String(activeDays)} />
          </div>
        </>
      )}
    </FocusCard>
  )
}

function FlowStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11.5px] font-semibold text-muted-foreground">{label}</span>
      <span className="text-[17px] font-extrabold tracking-[-0.01em]">{value}</span>
    </div>
  )
}

/* ============================================================
   WHERE IT GOES — ranked categories with share bars
   ============================================================ */
export interface FocusCategory {
  name: string
  value: number
  color: string
  icon?: string
}

export interface FocusCategoriesProps {
  categories: FocusCategory[]
  total: number
  displayCurrency: string
  amountsVisible: boolean
  loading: boolean
}

export function FocusCategories({ categories, total, displayCurrency, amountsVisible, loading }: FocusCategoriesProps) {
  const { t } = useTranslation()
  const rows = categories.slice(0, 6)

  return (
    <FocusCard
      icon={PieChartIcon}
      title={t('dashboard.focus.whereItGoes')}
      trailing={
        <Link to="/receipts" className="text-[12.5px] font-semibold text-primary hover:underline">
          {t('dashboard.focus.viewAll')}
        </Link>
      }
    >
      {loading ? (
        <div className="space-y-3.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Shimmer key={i} className="h-9 rounded-lg" />
          ))}
        </div>
      ) : rows.length === 0 || total <= 0 ? (
        <WidgetEmpty tall>{t('dashboard.noDataThisMonth')}</WidgetEmpty>
      ) : (
        <ul className="flex flex-col gap-3.5">
          {rows.map((c) => {
            const share = Math.round((c.value / total) * 100)
            return (
              <li
                key={c.name}
                className="grid items-center gap-x-2.5 gap-y-1.5"
                style={{
                  gridTemplateColumns: 'auto 1fr auto',
                  gridTemplateAreas: "'dot name pct' 'bar bar amt'",
                }}
              >
                <span style={{ gridArea: 'dot', background: c.color }} className="size-2.5 rounded-full" />
                <span style={{ gridArea: 'name' }} className="truncate text-[13.5px] font-semibold">
                  {c.icon ? `${c.icon} ${c.name}` : c.name}
                </span>
                <span style={{ gridArea: 'pct' }} className="text-[12px] font-semibold text-muted-foreground">
                  {share}%
                </span>
                <div style={{ gridArea: 'bar' }} className="h-[7px] overflow-hidden rounded-full bg-bg-subtle dark:bg-black/25">
                  <div className="h-full rounded-full" style={{ width: `${share}%`, background: c.color }} />
                </div>
                <span style={{ gridArea: 'amt' }} className="whitespace-nowrap text-[12.5px] font-bold text-fg-2">
                  {amountsVisible ? formatMoney(c.value, displayCurrency) : MASK}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </FocusCard>
  )
}

/* ============================================================
   FINANCIAL COACH — conversational nudge + insight chips
   ============================================================ */
export function FocusCoach({ displayCurrency }: { displayCurrency: string }) {
  const { t } = useTranslation()
  const { data: exchangeRates } = useExchangeRates(displayCurrency)
  const { data, isLoading } = useCoach()

  const convert = (breakdown?: { currency: string; amount: number }[]) => {
    if (!breakdown) return 0
    let total = 0
    for (const { currency, amount } of breakdown) {
      if (currency === displayCurrency) total += amount
      else {
        const rate = exchangeRates?.[currency]
        if (rate && rate !== 0) total += amount / rate
      }
    }
    return total
  }

  const summary = data?.summary
  const thisWeek = summary?.byCurrency ? convert(summary.byCurrency) : summary?.totalSpentThisWeek || 0
  const lastWeek = summary?.lastWeekByCurrency ? convert(summary.lastWeekByCurrency) : summary?.totalSpentLastWeek || 0
  const changePercent =
    lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : thisWeek > 0 ? 100 : 0
  const topCat = summary?.topCategory?.name
  const changeUp = changePercent > 0
  const hasChange = changePercent !== 0 && lastWeek > 0

  // Anomaly heads-up: the first genuinely cautionary insight (real coach data).
  const insights = data?.insights ?? []
  const anomaly = insights.find(
    (i: Insight) => i.tone === 'warning' || /increase|exceeded|warning/.test(i.type),
  )
  const tip = data?.tip

  const trailing =
    summary && summary.receiptsThisWeek > 0 ? (
      <FocusTrailing>{t('coach.receiptsThisWeek', { count: summary.receiptsThisWeek })}</FocusTrailing>
    ) : undefined

  const coachKey = hasChange
    ? topCat
      ? 'coachLine'
      : 'coachLineNoCat'
    : topCat
      ? 'coachLineFlat'
      : 'coachLineFlatNoCat'

  return (
    <FocusCard
      icon={Bot}
      iconTone="primary"
      title={t('coach.title')}
      trailing={trailing}
      className="border-primary/25 bg-primary-soft"
    >
      {isLoading ? (
        <div className="space-y-3">
          <Shimmer className="h-4 w-3/4" />
          <Shimmer className="h-14 rounded-xl" />
          <Shimmer className="h-14 rounded-xl" />
        </div>
      ) : !summary && !anomaly && !tip ? (
        <WidgetEmpty>{t('coach.noInsights')}</WidgetEmpty>
      ) : (
        <>
          {summary && (
            <p className="text-[14px] leading-relaxed text-foreground">
              <Trans
                i18nKey={`dashboard.focus.${coachKey}`}
                values={{
                  amount: formatMoney(thisWeek, displayCurrency),
                  change: t(changeUp ? 'dashboard.focus.coachChangeMore' : 'dashboard.focus.coachChangeLess', {
                    percent: Math.abs(changePercent),
                  }),
                  category: topCat,
                }}
                components={[
                  <b className="font-bold" />,
                  <span className={cn('font-bold', changeUp ? 'text-warning-foreground' : 'text-success-foreground')} />,
                  <b className="font-bold" />,
                ]}
              />
            </p>
          )}

          {(anomaly || tip) && (
            <div className="mt-3.5 flex flex-col gap-2.5">
              {anomaly && <CoachChip icon={TrendingUp} title={anomaly.title} desc={anomaly.message} />}
              {tip && <CoachChip icon={Lightbulb} title={tip.title} desc={tip.message} />}
            </div>
          )}
        </>
      )}
    </FocusCard>
  )
}

function CoachChip({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof TrendingUp
  title: string
  desc: string
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-card px-3.5 py-3">
      <Icon className="mt-0.5 size-[15px] shrink-0 text-warning-foreground" />
      <div className="min-w-0">
        <p className="text-[13px] font-bold text-foreground">{title}</p>
        <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{desc}</p>
      </div>
    </div>
  )
}

/* ============================================================
   UPCOMING BILLS — compact recurring expense rows
   ============================================================ */
const BILL_DOT = {
  overdue: 'bg-destructive',
  soon: 'bg-warning',
  up: 'bg-info',
} as const

export function FocusBills({
  displayCurrency,
  exchangeRates,
}: {
  displayCurrency: string
  exchangeRates?: Record<string, number> | null
}) {
  const { t, i18n } = useTranslation()
  const { data: upcoming, isLoading } = useUpcomingExpenses(30)

  const convert = (amount: number, currency: string) => {
    const num = Number(amount)
    if (currency === displayCurrency || !exchangeRates) return num
    const rate = exchangeRates[currency]
    if (!rate || rate === 0) return num
    return num / rate
  }

  const formatDue = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    const locale = i18n.language === 'sr' ? 'sr-Latn-RS' : undefined
    return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
  }

  const overdue = upcoming?.overdue ?? []
  const dueSoon = upcoming?.dueSoon ?? []
  const later = upcoming?.upcoming ?? []
  const total = overdue.length + dueSoon.length + later.length
  const dueThisWeek = overdue.length + dueSoon.length

  const rows: { item: UpcomingExpense; tone: keyof typeof BILL_DOT }[] = [
    ...overdue.map((item) => ({ item, tone: 'overdue' as const })),
    ...dueSoon.map((item) => ({ item, tone: 'soon' as const })),
    ...later.map((item) => ({ item, tone: 'up' as const })),
  ].slice(0, 5)

  const allItems = [...overdue, ...dueSoon, ...later]
  const totalAmount = allItems.reduce((sum, i) => sum + convert(i.amount, i.currency), 0)

  return (
    <FocusCard
      icon={CalendarClock}
      title={t('dashboard.focus.upcomingBills')}
      trailing={
        total > 0 ? (
          <span className="text-[13px] font-bold text-foreground">{formatMoney(totalAmount, displayCurrency)}</span>
        ) : undefined
      }
    >
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Shimmer key={i} className="h-7 rounded-lg" />
          ))}
        </div>
      ) : total === 0 ? (
        <WidgetEmpty>{t('recurring.dashboard.allCaughtUp')}</WidgetEmpty>
      ) : (
        <>
          <div className="-mt-1.5 mb-3 text-[12px] text-muted-foreground">
            {t('dashboard.focus.dueThisWeek', { count: dueThisWeek })}
          </div>
          <div className="flex flex-col gap-3.5">
            {rows.map(({ item, tone }) => (
              <Link
                key={`${item.id}-${item.dueDate}`}
                to="/recurring"
                className="-mx-1.5 flex items-center gap-2.5 rounded-lg px-1.5 transition-colors hover:bg-bg-subtle"
              >
                <span className={cn('size-2 shrink-0 rounded-full', BILL_DOT[tone])} />
                <div className="min-w-0 grow">
                  <div className="truncate text-[13.5px] font-semibold leading-tight">{item.name}</div>
                  <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                    {tone === 'overdue' ? `${t('dashboard.focus.overduePrefix')} · ` : ''}
                    {formatDue(item.dueDate)}
                  </div>
                </div>
                <span className="shrink-0 text-[13px] font-bold text-fg-2">
                  {formatMoney(convert(item.amount, item.currency), displayCurrency)}
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </FocusCard>
  )
}

/* ============================================================
   RECENT — compact receipts
   ============================================================ */
export function FocusRecent({ receipts }: { receipts: Receipt[] }) {
  const { t } = useTranslation()
  const rows = (receipts ?? []).slice(0, 3)

  return (
    <FocusCard
      icon={ReceiptIcon}
      title={t('dashboard.focus.recent')}
      trailing={
        <Link to="/receipts" className="text-[12.5px] font-semibold text-primary hover:underline">
          {t('dashboard.focus.allExpenses')}
        </Link>
      }
    >
      {rows.length === 0 ? (
        <WidgetEmpty>{t('dashboard.noRecentActivity')}</WidgetEmpty>
      ) : (
        <div className="flex flex-col gap-3.5">
          {rows.map((r) => (
            <Link
              key={r.id}
              to="/receipts"
              className="-mx-1.5 flex items-center gap-2.5 rounded-lg px-1.5 transition-colors hover:bg-bg-subtle"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-bg-subtle text-fg-2">
                <ReceiptIcon className="size-4" />
              </span>
              <div className="min-w-0 grow">
                <div className="truncate text-[13.5px] font-semibold leading-tight">
                  {r.storeName || t('dashboard.unknownStore')}
                </div>
                <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                  {formatDate(r.receiptDate || r.createdAt)}
                </div>
              </div>
              <span className="shrink-0 text-[13px] font-bold text-fg-2">
                {formatMoney(Number(r.totalAmount) || 0, r.currency)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </FocusCard>
  )
}
