import { useState } from 'react'
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
   HERO — one card, two zones (Luma restructure):
   left = spent + budget meter with a red pace marker;
   right = tinted safe-to-spend panel + projected month-end.
   ============================================================ */
export interface FocusHeroProps {
  monthLabel: string
  spent: number
  budget: number
  projected: number
  vsLastMonth: number
  daysLeft: number
  dailyAvg: number
  displayCurrency: string
  amountsVisible: boolean
  onToggleAmounts: () => void
  isCurrentMonth: boolean
  /** Demoted rank chip (Luma: no ribbon; a small chip sits in the hero corner). */
  rankLabel?: string
}

export function FocusHero({
  monthLabel,
  spent,
  budget,
  projected,
  vsLastMonth,
  daysLeft,
  dailyAvg,
  displayCurrency,
  amountsVisible,
  onToggleAmounts,
  isCurrentMonth,
  rankLabel,
}: FocusHeroProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const hasBudget = budget > 0
  const pct = hasBudget ? Math.min((spent / budget) * 100, 100) : 0
  const projPct = hasBudget ? Math.min((projected / budget) * 100, 100) : 0
  const remaining = budget - spent
  const overPace = projected - budget
  const safePerDay = isCurrentMonth && daysLeft > 0 ? Math.max(Math.round(remaining / daysLeft), 0) : 0
  const showSafe = isCurrentMonth && daysLeft > 0

  return (
    <section className="glass-card relative grid overflow-hidden md:grid-cols-[1.6fr_1fr]">
      <div className="absolute right-[18px] top-[18px] z-[2] flex items-center gap-2">
        {rankLabel && (
          <span className="inline-flex items-center gap-1 rounded-full bg-subtle px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
            <Crown className="size-3" aria-hidden="true" />
            {rankLabel}
          </span>
        )}
        <AmountsEyeToggle visible={amountsVisible} onToggle={onToggleAmounts} />
      </div>

      {/* Left zone — spent + budget meter */}
      <div className="flex flex-col px-[26px] pb-[22px] pt-6">
        <div className="text-[12.5px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
          {t('dashboard.focus.spentLabel', { month: monthLabel })}
        </div>

        <div className="mt-2.5 flex flex-wrap items-baseline gap-x-3.5 gap-y-2">
          <span className="font-display text-[42px] font-semibold leading-none tracking-[-0.03em] text-foreground md:text-[52px]">
            {amountsVisible ? formatMoney(spent, displayCurrency) : <HiddenDots />}
          </span>
          <TrendPill value={vsLastMonth} className="h-6 gap-1 px-2.5 text-[12.5px] [&_svg]:size-3.5" />
        </div>

        {hasBudget && (
          <div className="mt-auto pt-6">
            <div className="relative h-2.5 rounded-full bg-bg-subtle/90 dark:bg-black/30">
              <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
              {isCurrentMonth && (
                <div
                  className="absolute -top-[3px] h-4 w-[3px] -translate-x-1/2 rounded-sm bg-destructive shadow-[0_0_0_2px_var(--card)]"
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
                  components={[<b className="font-semibold text-foreground" />]}
                />
              </span>
              <span className="font-semibold text-foreground">
                {t('dashboard.focus.budgetLeft', {
                  amount: amountsVisible ? formatMoney(Math.max(remaining, 0), displayCurrency) : MASK,
                })}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Right zone — tinted safe-to-spend panel */}
      <div className="flex flex-col border-t border-border bg-subtle px-[22px] pb-5 pt-6 md:border-l md:border-t-0">
        <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
          <Wallet className="size-3.5" aria-hidden="true" />
          {t('dashboard.focus.safeToSpend')}
        </span>

        {!hasBudget ? (
          <>
            <h3 className="mt-3 text-[18px] font-semibold tracking-[-0.01em]">
              {t('dashboard.focus.noBudgetTitle')}
            </h3>
            <p className="mt-1.5 text-[13px] text-muted-foreground">{t('dashboard.focus.noBudgetBody')}</p>
            <Button
              type="button"
              variant="default"
              size="pill"
              className="mt-4 self-start md:mt-auto"
              onClick={() => navigate('/categories')}
            >
              <Target className="size-4" />
              {t('dashboard.focus.noBudgetCta')}
            </Button>
          </>
        ) : showSafe ? (
          <>
            <div className="mt-3 flex items-baseline gap-1.5 font-display text-[34px] font-semibold leading-none tracking-[-0.02em] md:text-[38px]">
              {amountsVisible ? formatMoney(safePerDay, displayCurrency) : MASK}
              <span className="text-[15px] font-semibold text-muted-foreground">{t('dashboard.focus.perDay')}</span>
            </div>
            <p className="mt-2 max-w-[30ch] text-[12.5px] leading-snug text-muted-foreground">
              {t('dashboard.focus.safeCaption', { days: daysLeft, month: monthLabel })}
            </p>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3 md:mt-auto">
              <span className="text-[12.5px] font-semibold text-muted-foreground">
                {t('dashboard.focus.projectedMonthEnd')}
              </span>
              <span className="inline-flex items-center gap-2 text-[15px] font-semibold">
                {amountsVisible ? formatMoney(projected, displayCurrency) : MASK}
                {overPace > 0 && (
                  <span className="rounded-full bg-destructive-soft px-2 py-0.5 text-[11.5px] font-semibold text-[color:var(--destructive-foreground-on-soft)]">
                    {t('dashboard.focus.overBy', {
                      amount: amountsVisible ? formatMoney(overPace, displayCurrency) : MASK,
                    })}
                  </span>
                )}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="mt-3 flex items-baseline gap-1.5 font-display text-[34px] font-semibold leading-none tracking-[-0.02em] md:text-[38px]">
              {amountsVisible ? formatMoney(Math.round(dailyAvg), displayCurrency) : MASK}
              <span className="text-[15px] font-semibold text-muted-foreground">{t('dashboard.focus.perDay')}</span>
            </div>
            <p className="mt-2 max-w-[30ch] text-[12.5px] leading-snug text-muted-foreground">
              {t('dashboard.focus.avgPerDayCaption', { month: monthLabel })}
            </p>
          </>
        )}
      </div>
    </section>
  )
}

/* ============================================================
   DAILY FLOW — monochrome shadcn bar chart + stat strip
   ============================================================ */
export interface FocusDailyFlowProps {
  series: { date: string; amount: number }[]
  monthYearLabel: string
  displayCurrency: string
  amountsVisible: boolean
  isCurrentMonth: boolean
  loading: boolean
}

export function FocusDailyFlow({
  series,
  monthYearLabel,
  displayCurrency,
  amountsVisible,
  isCurrentMonth,
  loading,
}: FocusDailyFlowProps) {
  const { t, i18n } = useTranslation()
  const [hover, setHover] = useState<number | null>(null)

  const hasData = series.some((d) => d.amount > 0)
  const localeTag = i18n.language === 'sr' ? 'sr-Latn-RS' : 'en-US'
  const shortDate = (iso: string) =>
    new Date(iso + 'T00:00:00').toLocaleDateString(localeTag, { month: 'short', day: 'numeric' })

  // shadcn-style bar chart geometry: mid-grey bars, near-black peak, faint zero stubs,
  // horizontal gridlines with a compact Y axis.
  const W = 600
  const H = 190
  const padL = 34 // room for Y labels
  const padT = 10
  const padB = 22 // room for day ticks on the X axis
  const chartH = H - padT - padB
  const n = series.length
  const max = Math.max(...series.map((d) => d.amount), 1)
  const peakIdx = series.reduce((best, d, i) => (d.amount > (series[best]?.amount ?? -1) ? i : best), 0)
  const slotW = n > 0 ? (W - padL) / n : W
  const barW = Math.max(2, Math.min(slotW * 0.56, 22))
  const kfmt = (v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(Math.round(v)))
  const ticks = [1, 0.75, 0.5, 0.25, 0]

  const highestDay = series[peakIdx]?.amount ?? 0
  const activeDays = series.filter((d) => d.amount > 0).length
  const firstLabel = series.length ? shortDate(series[0].date) : ''
  const lastLabel = series.length ? shortDate(series[series.length - 1].date) : ''
  const hovered = hover != null ? series[hover] : null
  // Day ticks on the X axis: 1, every 5th, and the last plotted day.
  const showTick = (i: number) => {
    const day = i + 1
    if (i === n - 1) return true
    if (day === 1) return n < 8 || i !== n - 2
    return day % 5 === 0 && i < n - 2
  }

  return (
    <FocusCard
      icon={Activity}
      title={t('dashboard.focus.dailyFlow')}
      trailing={
        <FocusTrailing>
          {hovered
            ? `${shortDate(hovered.date)} · ${amountsVisible ? formatMoney(hovered.amount, displayCurrency) : MASK}`
            : monthYearLabel}
        </FocusTrailing>
      }
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
              className="block h-full w-full"
              role="img"
              aria-label={`${t('dashboard.focus.dailyFlow')} — ${firstLabel} – ${lastLabel}, ${activeDays} ${t('dashboard.focus.activeDays')}`}
              onMouseLeave={() => setHover(null)}
            >
              {/* gridlines + Y axis */}
              {ticks.map((frac) => {
                const y = padT + chartH * (1 - frac)
                return (
                  <g key={frac}>
                    <line x1={padL} y1={y} x2={W} y2={y} stroke="var(--border)" strokeWidth="1" />
                    <text x={padL - 6} y={y + 3} textAnchor="end" fontSize="9" fill="var(--fg-faint)">
                      {kfmt(max * frac)}
                    </text>
                  </g>
                )
              })}
              {/* bars */}
              {series.map((d, i) => {
                const x = padL + i * slotW + (slotW - barW) / 2
                const h = d.amount > 0 ? Math.max((d.amount / max) * chartH, 2) : 2
                const y = padT + chartH - h
                const isPeak = i === peakIdx && d.amount > 0
                const isHover = hover === i
                const fill = d.amount === 0
                  ? 'var(--border-strong)'
                  : isPeak || isHover
                    ? 'var(--foreground)'
                    : 'var(--fg-faint)'
                return (
                  <g key={d.date} onMouseEnter={() => setHover(i)}>
                    {/* invisible hit target spanning the full slot height */}
                    <rect x={padL + i * slotW} y={padT} width={slotW} height={chartH} fill="transparent" />
                    <rect x={x} y={y} width={barW} height={h} rx={Math.min(barW / 2, 3)} fill={fill} />
                    {showTick(i) && (
                      <text
                        x={padL + i * slotW + slotW / 2}
                        y={H - 6}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight={i === n - 1 && isCurrentMonth ? 700 : 400}
                        fill={i === n - 1 && isCurrentMonth ? 'var(--muted-foreground)' : 'var(--fg-faint)'}
                      >
                        {i + 1}
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-hairline-soft pt-4">
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
      <span className="text-[17px] font-semibold tracking-[-0.01em]">{value}</span>
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
                <span style={{ gridArea: 'amt' }} className="whitespace-nowrap text-[12.5px] font-semibold text-fg-2">
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
    <FocusCard icon={Bot} title={t('coach.title')} trailing={trailing}>
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
                  <b className="font-semibold" />,
                  <span className="font-semibold text-foreground" />,
                  <b className="font-semibold" />,
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
    <div className="flex items-start gap-2.5 rounded-xl bg-bg-subtle px-3.5 py-3">
      <Icon className="mt-0.5 size-[15px] shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{desc}</p>
      </div>
    </div>
  )
}

/* ============================================================
   UPCOMING BILLS — compact recurring expense rows
   ============================================================ */
/** Bill urgency dots — red only for overdue; other tiers read via foreground strength. */
const BILL_DOT = {
  overdue: 'bg-destructive',
  soon: 'bg-foreground',
  up: 'bg-fg-faint',
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
          <span className="text-[13px] font-semibold text-foreground">{formatMoney(totalAmount, displayCurrency)}</span>
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
                <span className="shrink-0 text-[13px] font-semibold text-fg-2">
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
              <span className="shrink-0 text-[13px] font-semibold text-fg-2">
                {formatMoney(Number(r.totalAmount) || 0, r.currency)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </FocusCard>
  )
}
