import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/app-layout'
import { PageToolbar } from '@/components/layout/page-toolbar'
import { PageTransition, AnimatedNumber } from '@/components/ui/animated'
import { CurrencySelect } from '@/components/ui/currency-select'
import { Button } from '@/components/ui/button'
import { CategoryBudgetProgress } from '@/components/dashboard/category-budget-progress'
import { MonthlyForecast } from '@/components/dashboard/monthly-forecast'
import { WidgetRenderer } from '@/components/dashboard/widget-renderer'
import { CoachCard } from '@/components/coach/coach-card'
import { UpcomingRecurring } from '@/components/dashboard/upcoming-recurring'
import {
  WidgetCard,
  WidgetHead,
  WidgetEmpty,
  StatTile,
  HiddenDots,
  Shimmer,
} from '@/components/dashboard/primitives'
import { EmptyState } from '@/components/glass/empty-state'
import { AnnouncementBanner } from '@/components/announcements/announcement-banner'
import { useMe } from '@/hooks/users/use-me'
import { useReceiptScanner } from '@/hooks/receipts/use-receipt-scanner'
import {
  useAggregatedStats,
  useAggregatedCategoryStats,
  useAggregatedDailyStats,
  useAggregatedMonthlyStats,
  type CurrencyBreakdown,
} from '@/hooks/dashboard/use-dashboard'
import { useExchangeRates } from '@/hooks/currencies/use-currency-converter'
import { useFeatureFlags } from '@/hooks/settings/use-feature-flags'
import { useSettingsStore } from '@/store/settings'
import { useDashboardStore } from '@/store/dashboard'
import { cn, formatMoney } from '@/lib/utils'
import { formatDate } from '@/lib/date-utils'
import {
  Receipt,
  QrCode,
  Clock,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  Coins,
  Compass,
  Sparkles,
  Crown,
  RotateCcw,
  Eye,
  EyeOff,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts'
import { format, getDaysInMonth } from 'date-fns'
import { getNextRank, getProgressToNextRank, normalizeRank, type ReceiptRank } from '@/lib/rank'

const FALLBACK_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

// The chart series color is the brand --primary (emerald), which is locked app-wide since the
// accent picker was retired. Hex equivalents of oklch(0.55 0.16 165) / oklch(0.78 0.15 165) —
// passed to recharts as a fill/stroke value (recharts can't resolve the CSS var via attribute).
const PRIMARY_HEX = { light: '#008d59', dark: '#37d59f' }

function usePrimaryColor() {
  const isDark = document.documentElement.classList.contains('dark')
  return isDark ? PRIMARY_HEX.dark : PRIMARY_HEX.light
}

/** Currency selector + month stepper — shared by the desktop toolbar and the mobile header. */
function DashboardControls({
  displayCurrency,
  onCurrencyChange,
  monthLabel,
  onPrev,
  onNext,
}: {
  displayCurrency: string
  onCurrencyChange: (c: string) => void
  monthLabel: string
  onPrev: () => void
  onNext: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex h-9 items-center gap-1 rounded-full border border-border bg-card pl-2.5 pr-1">
        <Coins className="size-4 shrink-0 text-muted-foreground" />
        <CurrencySelect
          value={displayCurrency}
          onValueChange={onCurrencyChange}
          placeholder={t('dashboard.currency')}
          triggerClassName="h-7 border-0 bg-transparent px-1 text-[13px] font-medium shadow-none focus:ring-0 focus:ring-offset-0"
        />
      </div>
      <div className="inline-flex h-9 items-center rounded-full border border-border bg-card px-1">
        <button
          type="button"
          onClick={onPrev}
          aria-label={t('common.previous')}
          className="grid size-7 place-items-center rounded-full text-fg-2 transition-colors hover:bg-bg-subtle"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="min-w-[92px] text-center text-[13px] font-semibold">{monthLabel}</span>
        <button
          type="button"
          onClick={onNext}
          aria-label={t('common.next')}
          className="grid size-7 place-items-center rounded-full text-fg-2 transition-colors hover:bg-bg-subtle"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { t } = useTranslation()
  const { currency: preferredCurrency, amountsVisible, toggleAmountsVisible } = useSettingsStore()
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [displayCurrency, setDisplayCurrency] = useState<string>(preferredCurrency || 'RSD')
  const navigate = useNavigate()
  const primaryColor = usePrimaryColor()
  const { openQrScanner, scannerModals } = useReceiptScanner({ navigateOnSuccess: true })

  const { isEditMode, setEditMode, resetToDefault } = useDashboardStore()

  const { data: me } = useMe(true)
  const { data: featureFlags } = useFeatureFlags()

  const { data: exchangeRates, isLoading: ratesLoading } = useExchangeRates(displayCurrency)

  const { data: aggStats, isLoading: aggStatsLoading } = useAggregatedStats()
  const { data: aggCategoryStats, isLoading: aggCategoryLoading } = useAggregatedCategoryStats(
    selectedYear, selectedMonth
  )
  const { data: aggDailyStats, isLoading: aggDailyLoading } = useAggregatedDailyStats(
    selectedYear, selectedMonth
  )
  const { data: aggMonthlyStats, isLoading: aggMonthlyLoading } = useAggregatedMonthlyStats(selectedYear)

  const convertBreakdownToTotal = (breakdown: CurrencyBreakdown[] | undefined): number => {
    if (!breakdown || !exchangeRates) return 0
    return breakdown.reduce((sum, item) => {
      if (item.currency === displayCurrency) {
        return sum + item.totalAmount
      }
      const rate = exchangeRates[item.currency]
      if (!rate || rate === 0) return sum + item.totalAmount
      return sum + (item.totalAmount / rate)
    }, 0)
  }

  const monthName = format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy')

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12)
      setSelectedYear(selectedYear - 1)
    } else {
      setSelectedMonth(selectedMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1)
      setSelectedYear(selectedYear + 1)
    } else {
      setSelectedMonth(selectedMonth + 1)
    }
  }

  const isLoading = aggStatsLoading || ratesLoading

  const totalReceipts = aggStats?.totalReceipts ?? 0
  const totalAmount = convertBreakdownToTotal(aggStats?.byCurrency)
  const recentReceipts = aggStats?.recentReceipts ?? []
  const isEmpty = !isLoading && totalReceipts === 0
  const rankReceiptCount = me?.receiptCount ?? totalReceipts
  const rankCode = normalizeRank(me?.receiptRank as ReceiptRank | undefined, rankReceiptCount)
  const nextRank = getNextRank(rankCode)
  const rankProgress = getProgressToNextRank(rankCode, rankReceiptCount)

  const rankName = rankCode === 'status_a'
    ? t('settings.profile.rank.names.statusA')
    : rankCode === 'status_b'
      ? t('settings.profile.rank.names.statusB')
      : rankCode === 'status_c'
        ? t('settings.profile.rank.names.statusC')
        : t('settings.profile.rank.names.noStatus')

  const rankVisual = rankCode === 'status_a'
    ? { icon: Crown, iconClass: 'text-warning-foreground', card: 'border-warning-soft bg-warning-soft/40', bar: 'bg-warning' }
    : rankCode === 'status_b'
      ? { icon: Sparkles, iconClass: 'text-info-foreground', card: 'border-info-soft bg-info-soft/40', bar: 'bg-info' }
      : rankCode === 'status_c'
        ? { icon: Compass, iconClass: 'text-success-foreground', card: 'border-success-soft bg-success-soft/40', bar: 'bg-success' }
        : { icon: Compass, iconClass: 'text-muted-foreground', card: 'border-border bg-card', bar: 'bg-muted-foreground' }
  const RankIcon = rankVisual.icon

  const rankDescription = rankCode === 'status_a'
    ? t('dashboard.rank.details.statusA')
    : rankCode === 'status_b'
      ? t('dashboard.rank.details.statusB')
      : rankCode === 'status_c'
        ? t('dashboard.rank.details.statusC')
        : t('dashboard.rank.details.noStatus')

  const dailyChartData = useMemo(() => {
    const daysInMonth = getDaysInMonth(new Date(selectedYear, selectedMonth - 1))
    const data = []

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const found = aggDailyStats?.find((d) => d.date === dateStr)
      data.push({
        day,
        date: dateStr,
        totalAmount: found ? convertBreakdownToTotal(found.byCurrency) : 0,
        receiptCount: found ? found.byCurrency.reduce((sum, c) => sum + c.receiptCount, 0) : 0,
      })
    }
    return data
  }, [aggDailyStats, selectedYear, selectedMonth, exchangeRates])

  const monthlyChartData = useMemo(() => {
    const months = []

    for (let m = 1; m <= 12; m++) {
      const monthStr = `${selectedYear}-${String(m).padStart(2, '0')}`
      const found = aggMonthlyStats?.find((d) => d.month === monthStr)
      months.push({
        month: format(new Date(selectedYear, m - 1), 'MMM'),
        totalAmount: found ? convertBreakdownToTotal(found.byCurrency) : 0,
        receiptCount: found ? found.byCurrency.reduce((sum, c) => sum + c.receiptCount, 0) : 0,
      })
    }
    return months
  }, [aggMonthlyStats, selectedYear, exchangeRates])

  const categoryChartData = useMemo(() => {
    if (!aggCategoryStats || aggCategoryStats.length === 0) return []
    return aggCategoryStats.map((c, index) => ({
      name: c.categoryName,
      value: convertBreakdownToTotal(c.byCurrency),
      icon: c.categoryIcon,
      color: c.categoryColor || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
      count: c.byCurrency.reduce((sum, b) => sum + b.receiptCount, 0),
    }))
  }, [aggCategoryStats, exchangeRates])

  const totalMonthAmount = categoryChartData.reduce((sum, c) => sum + c.value, 0)
  const dailyHasData = dailyChartData.some((d) => d.totalAmount > 0)
  const monthlyHasData = monthlyChartData.some((m) => m.totalAmount > 0)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload
      const isPieChart = data?.icon !== undefined && data?.color !== undefined

      if (isPieChart) {
        return (
          <div className="rounded-xl border border-border bg-popover p-3 shadow-glass-2">
            <div className="mb-1 flex items-center gap-2">
              <div className="size-3 shrink-0 rounded-full" style={{ backgroundColor: data.color }} />
              <span className="text-sm font-semibold">{data.icon} {data.name}</span>
            </div>
            <p className="text-sm font-medium">{formatMoney(data.value, displayCurrency)}</p>
          </div>
        )
      }

      const displayLabel = data?.date ? format(new Date(data.date), 'd MMM yyyy') : label

      return (
        <div className="rounded-xl border border-border bg-popover p-3 shadow-glass-2">
          <p className="mb-1 text-sm font-semibold">{displayLabel}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm font-medium">
              {formatMoney(entry.value, displayCurrency)}
            </p>
          ))}
          {data?.date && (
            <p className="mt-1 text-xs text-muted-foreground">{t('dashboard.clickToViewReceipts')}</p>
          )}
        </div>
      )
    }
    return null
  }

  const formatAmountRaw = useCallback(
    (amount: number) => formatMoney(amount, displayCurrency),
    [displayCurrency],
  )

  const maskedValue = (value: number) =>
    amountsVisible ? <AnimatedNumber value={value} formatFn={formatAmountRaw} /> : <HiddenDots />

  // Build widget content map — each entry matches a widget ID from the registry
  const widgetContent: Record<string, React.ReactNode> = {
    'stats-cards': (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatTile
          className="col-span-2 sm:col-span-1"
          label={monthName}
          primary
          big
          eye
          hidden={!amountsVisible}
          onToggleHidden={toggleAmountsVisible}
          value={maskedValue(totalMonthAmount)}
        />
        <StatTile
          label={t('dashboard.totalSpent')}
          primary
          eye
          hidden={!amountsVisible}
          onToggleHidden={toggleAmountsVisible}
          value={maskedValue(totalAmount)}
        />
        <Link to="/receipts" className="block">
          <StatTile
            className="h-full transition-colors hover:bg-bg-subtle"
            label={t('dashboard.totalReceipts')}
            icon={Receipt}
            value={<AnimatedNumber value={totalReceipts} />}
          />
        </Link>
      </div>
    ),

    'category-pie-chart': (
      <WidgetCard>
        <WidgetHead icon={PieChartIcon} title={t('dashboard.spendingByCategory')} />
        {aggCategoryLoading ? (
          <Shimmer className="h-[200px] rounded-xl" />
        ) : categoryChartData.length === 0 ? (
          <WidgetEmpty tall>{t('dashboard.noDataThisMonth')}</WidgetEmpty>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    cornerRadius={10}
                    strokeLinecap="round"
                    dataKey="value"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="t-xs text-fg-faint">{t('dashboard.total')}</span>
                <span className="text-[17px] font-extrabold">{formatMoney(totalMonthAmount, displayCurrency)}</span>
              </div>
            </div>
            <ul className="flex w-full flex-col gap-1.5 text-[13px]">
              {categoryChartData.slice(0, 5).map((c) => (
                <li key={c.name} className="flex items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="truncate">{c.icon} {c.name}</span>
                  <span className="ml-auto text-muted-foreground">{formatMoney(c.value, displayCurrency)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </WidgetCard>
    ),

    'daily-bar-chart': (
      <WidgetCard>
        <WidgetHead
          icon={BarChart3}
          title={t('dashboard.dailySpending')}
          trailing={<span className="t-sm text-muted-foreground">{monthName}</span>}
        />
        {aggDailyLoading ? (
          <Shimmer className="h-[200px] flex-1 rounded-xl" />
        ) : !dailyHasData ? (
          <WidgetEmpty tall>{t('dashboard.noDataThisMonth')}</WidgetEmpty>
        ) : (
          <div className="min-h-0 flex-1">
            <ResponsiveContainer width="100%" height="100%" minHeight={200}>
              <BarChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-hairline-soft" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-subtle)' }} />
                <Bar
                  dataKey="totalAmount"
                  name="Amount"
                  fill={primaryColor}
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                  onClick={(data: any) => {
                    const date = data?.payload?.date || data?.date
                    if (date) navigate(`/receipts?startDate=${date}&endDate=${date}`)
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </WidgetCard>
    ),

    'budget-tracker': (
      <CategoryBudgetProgress
        aggCategoryStats={aggCategoryStats}
        exchangeRates={exchangeRates}
        displayCurrency={displayCurrency}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
      />
    ),

    'monthly-trend': (
      <WidgetCard>
        <WidgetHead icon={TrendingUp} title={t('dashboard.monthlyTrend', { year: selectedYear })} />
        {aggMonthlyLoading ? (
          <Shimmer className="h-[200px] rounded-xl" />
        ) : !monthlyHasData ? (
          <WidgetEmpty tall>{t('dashboard.noDataThisMonth')}</WidgetEmpty>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyChartData}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={primaryColor} stopOpacity={0.26} />
                  <stop offset="100%" stopColor={primaryColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-hairline-soft" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--hairline)' }} />
              <Area
                type="monotone"
                dataKey="totalAmount"
                name="Amount"
                stroke={primaryColor}
                strokeWidth={2.5}
                fill="url(#trendFill)"
                dot={{ fill: primaryColor, r: 2.6, strokeWidth: 0 }}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </WidgetCard>
    ),

    'monthly-forecast': (
      <MonthlyForecast
        dailyStats={aggDailyStats}
        monthlyStats={aggMonthlyStats}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        displayCurrency={displayCurrency}
        exchangeRates={exchangeRates}
      />
    ),

    'coach-card': <CoachCard displayCurrency={displayCurrency} />,

    'rank-card': (
      // Plain surface (not WidgetCard) so the per-tier tint is the only background utility.
      <section className={cn('flex h-full flex-col rounded-2xl border p-5 shadow-glass-1', rankVisual.card)}>
        <WidgetHead
          icon={RankIcon}
          iconTone="muted"
          title={t('dashboard.rank.title')}
          trailing={
            <span className={cn('inline-flex items-center gap-1.5 text-[13.5px] font-semibold', rankVisual.iconClass)}>
              <RankIcon className="size-4" />
              {rankName}
            </span>
          }
        />
        <div className="space-y-3">
          <p className="text-[13px] text-muted-foreground">
            {t('dashboard.rank.receiptsTracked', { count: rankReceiptCount })}
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[12px] text-muted-foreground">
              <span>{t('dashboard.rank.progress')}</span>
              <span>{Math.round(rankProgress)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-bg-subtle">
              <div
                className={cn('h-full rounded-full transition-all', rankVisual.bar)}
                style={{ width: `${rankProgress}%` }}
              />
            </div>
            <p className="text-[13px] text-muted-foreground">
              {nextRank
                ? t('dashboard.rank.nextTarget', {
                    count: Math.max(nextRank.minReceipts - rankReceiptCount, 0),
                    rank: t(nextRank.nameKey),
                  })
                : t('dashboard.rank.topTier')}
            </p>
          </div>
          <p className="text-[13px]">{rankDescription}</p>
        </div>
      </section>
    ),

    'recent-activity': (
      <WidgetCard>
        <WidgetHead icon={Clock} title={t('dashboard.recentActivity')} />
        {recentReceipts && recentReceipts.length > 0 ? (
          <div className="divide-y divide-hairline-soft">
            {recentReceipts.slice(0, 5).map((receipt) => (
              <Link
                key={receipt.id}
                to="/receipts"
                className="-mx-1.5 flex items-center justify-between rounded-lg px-1.5 py-2.5 transition-colors first:pt-0 last:pb-0 hover:bg-bg-subtle"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-medium">{receipt.storeName || t('dashboard.unknownStore')}</p>
                  <p className="text-[12px] text-muted-foreground">{formatDate(receipt.receiptDate || receipt.createdAt)}</p>
                </div>
                <span className="ml-4 shrink-0 text-[13.5px] font-medium">
                  {formatMoney(Number(receipt.totalAmount) || 0, receipt.currency)}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <WidgetEmpty>{t('dashboard.noRecentActivity')}</WidgetEmpty>
        )}
      </WidgetCard>
    ),
  }

  // Conditionally add recurring expenses widget
  if (featureFlags?.recurringExpenses ?? true) {
    widgetContent['upcoming-recurring'] = (
      <UpcomingRecurring displayCurrency={displayCurrency} exchangeRates={exchangeRates} />
    )
  }

  const controls = (
    <DashboardControls
      displayCurrency={displayCurrency}
      onCurrencyChange={setDisplayCurrency}
      monthLabel={monthName}
      onPrev={handlePrevMonth}
      onNext={handleNextMonth}
    />
  )

  // Greeting (emoji-free per the Glass system; the shared i18n value still carries 👋).
  const greeting = (() => {
    const hour = new Date().getHours()
    const key = hour < 12 ? 'greetingMorning' : hour < 18 ? 'greetingAfternoon' : 'greetingEvening'
    return t(`dashboard.${key}`, { name: me?.firstName }).replace('👋', '').trim()
  })()
  const greetingSub = isEmpty
    ? t('dashboard.greetingSubtitleEmpty')
    : t('dashboard.greetingSubtitle', { month: monthName })

  const amountsPill = (
    <Button
      type="button"
      variant="glass"
      size="pill"
      onClick={toggleAmountsVisible}
      className="text-[13px] font-medium"
    >
      {amountsVisible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
      {amountsVisible ? t('dashboard.hideAmounts') : t('dashboard.showAmounts')}
    </Button>
  )

  const emptyHero = isEmpty && (
    <EmptyState
      className="mb-4"
      icon={QrCode}
      title={t('dashboard.empty.title')}
      description={t('dashboard.empty.description')}
      action={
        <Button
          type="button"
          variant="brand"
          onClick={openQrScanner}
          className="h-10 shrink-0 rounded-full px-4 text-[15px] font-semibold [&_svg]:size-[18px]"
        >
          <QrCode />
          {t('receipts.scanReceipt')}
        </Button>
      }
    />
  )

  return (
    <AppLayout>
      <PageTransition>
        {/* Desktop sticky toolbar (breaks out of the page padding to sit flush) */}
        <PageToolbar
          className="md:-mx-8 md:-mt-8 md:mb-6"
          title={t('dashboard.title')}
          subtitle={t('dashboard.subtitle')}
          actions={controls}
        />

        <AnnouncementBanner />

        {/* Mobile page header — greeting + amounts toggle + controls */}
        <div className="mb-5 md:hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-[22px] font-extrabold tracking-[-0.02em]">{greeting}</h1>
              <p className="t-sm mt-0.5 text-muted-foreground">
                {isEmpty ? t('dashboard.mobileGetStarted') : monthName}
              </p>
            </div>
            <button
              type="button"
              onClick={toggleAmountsVisible}
              aria-label={amountsVisible ? t('dashboard.hideAmounts') : t('dashboard.showAmounts')}
              className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-card text-fg-2 transition-colors hover:bg-bg-subtle"
            >
              {amountsVisible ? <Eye className="size-[18px]" /> : <EyeOff className="size-[18px]" />}
            </button>
          </div>
          <div className="mt-3">{controls}</div>
        </div>

        {/* Desktop greeting row */}
        <div className="mb-4 hidden items-center justify-between gap-4 md:flex">
          <div className="min-w-0">
            <h2 className="text-[22px] font-extrabold tracking-[-0.02em]">{greeting}</h2>
            <p className="t-sm mt-0.5 text-muted-foreground">{greetingSub}</p>
          </div>
          {amountsPill}
        </div>

        {/* Edit mode toolbar */}
        {isEditMode && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary-soft/50 p-3">
            <p className="text-[13px] text-muted-foreground">{t('dashboard.widgets.editHint')}</p>
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => resetToDefault()} className="gap-1.5">
                <RotateCcw className="size-3.5" />
                {t('dashboard.widgets.resetToDefault')}
              </Button>
              <Button size="sm" onClick={() => setEditMode(false)}>
                {t('dashboard.widgets.done')}
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {emptyHero}
            <WidgetRenderer widgetContent={widgetContent} />
          </>
        )}
      </PageTransition>

      {scannerModals}
    </AppLayout>
  )
}

/** Shimmer grid that holds the populated layout's shape so it doesn't jump on load. */
function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div className="col-span-full grid grid-cols-2 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Shimmer key={i} className={cn('h-[92px] rounded-2xl', i === 0 && 'col-span-2 sm:col-span-1')} />
        ))}
      </div>
      <Shimmer className="col-span-full h-[280px] rounded-2xl lg:col-span-8" />
      <Shimmer className="col-span-full h-[280px] rounded-2xl lg:col-span-4" />
      <Shimmer className="col-span-full h-[260px] rounded-2xl lg:col-span-8" />
      <Shimmer className="col-span-full h-[260px] rounded-2xl lg:col-span-4" />
      <Shimmer className="col-span-full h-[320px] rounded-2xl lg:col-span-6" />
      <Shimmer className="col-span-full h-[320px] rounded-2xl lg:col-span-6" />
    </div>
  )
}
