import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '@/components/layout/app-layout'
import { PageToolbar } from '@/components/layout/page-toolbar'
import { PageTransition } from '@/components/ui/animated'
import { HeaderCurrencyPill, HeaderStepper } from '@/components/layout/header-actions'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/glass/empty-state'
import { AnnouncementBanner } from '@/components/announcements/announcement-banner'
import { Shimmer } from '@/components/dashboard/primitives'
import {
  FocusHero,
  FocusSafeToSpend,
  FocusDailyFlow,
  FocusCategories,
  FocusCoach,
  FocusBills,
  FocusRecent,
} from '@/components/dashboard/focus'
import { useMe } from '@/hooks/users/use-me'
import { useReceiptScanner } from '@/hooks/receipts/use-receipt-scanner'
import { useCategories } from '@/hooks/categories/use-categories'
import {
  useAggregatedStats,
  useAggregatedCategoryStats,
  useAggregatedDailyStats,
  useAggregatedMonthlyStats,
  type CurrencyBreakdown,
} from '@/hooks/dashboard/use-dashboard'
import { useExchangeRates } from '@/hooks/currencies/use-currency-converter'
import { useSettingsStore } from '@/store/settings'
import { QrCode } from 'lucide-react'
import { getDaysInMonth } from 'date-fns'
import { normalizeRank, type ReceiptRank } from '@/lib/rank'

// Neutral fallbacks for categories with no assigned color (Luma monochrome ramp).
// Categories that DO carry a color still render it (per-category color is retained).
const FALLBACK_COLORS = ['#6b7280', '#9ca3af', '#4b5563', '#a1a1aa', '#71717a', '#52525b', '#818181', '#3f3f46']

/** Currency selector + month stepper — shared by the desktop toolbar and the mobile header. */
function DashboardControls({
  displayCurrency,
  onCurrencyChange,
  monthLabel,
  onPrev,
  onNext,
  nextDisabled,
}: {
  displayCurrency: string
  onCurrencyChange: (c: string) => void
  monthLabel: string
  onPrev: () => void
  onNext: () => void
  nextDisabled: boolean
}) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2">
      <HeaderCurrencyPill
        value={displayCurrency}
        onValueChange={onCurrencyChange}
        placeholder={t('dashboard.currency')}
      />
      <HeaderStepper
        label={monthLabel}
        onPrev={onPrev}
        onNext={onNext}
        nextDisabled={nextDisabled}
        prevLabel={t('common.previous')}
        nextLabel={t('common.next')}
      />
    </div>
  )
}

export default function Dashboard() {
  const { t, i18n } = useTranslation()
  const { currency: preferredCurrency, amountsVisible, toggleAmountsVisible } = useSettingsStore()
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [displayCurrency, setDisplayCurrency] = useState<string>(preferredCurrency || 'RSD')

  const { openQrScanner, scannerModals } = useReceiptScanner({ navigateOnSuccess: true })

  const { data: me } = useMe(true)
  const { data: categories = [] } = useCategories()
  const { data: exchangeRates, isLoading: ratesLoading } = useExchangeRates(displayCurrency)

  const { data: aggStats, isLoading: aggStatsLoading } = useAggregatedStats()
  const { data: aggCategoryStats, isLoading: aggCategoryLoading } = useAggregatedCategoryStats(selectedYear, selectedMonth)
  const { data: aggDailyStats, isLoading: aggDailyLoading } = useAggregatedDailyStats(selectedYear, selectedMonth)
  const { data: aggMonthlyStats } = useAggregatedMonthlyStats(selectedYear)

  const convertBreakdownToTotal = (breakdown: CurrencyBreakdown[] | undefined): number => {
    if (!breakdown || !exchangeRates) return 0
    return breakdown.reduce((sum, item) => {
      if (item.currency === displayCurrency) return sum + item.totalAmount
      const rate = exchangeRates[item.currency]
      if (!rate || rate === 0) return sum + item.totalAmount
      return sum + item.totalAmount / rate
    }, 0)
  }

  // Locale-aware month labels (the rest of the app falls back to English date-fns months;
  // here we localize so SR reads naturally).
  const localeTag = i18n.language === 'sr' ? 'sr-Latn-RS' : 'en-US'
  const baseDate = new Date(selectedYear, selectedMonth - 1, 1)
  const monthLong = baseDate.toLocaleDateString(localeTag, { month: 'long' })
  const monthYear = baseDate.toLocaleDateString(localeTag, { month: 'long', year: 'numeric' })

  const isCurrentMonth = now.getFullYear() === selectedYear && now.getMonth() + 1 === selectedMonth
  const nextDisabled = isCurrentMonth

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12)
      setSelectedYear(selectedYear - 1)
    } else {
      setSelectedMonth(selectedMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (nextDisabled) return
    if (selectedMonth === 12) {
      setSelectedMonth(1)
      setSelectedYear(selectedYear + 1)
    } else {
      setSelectedMonth(selectedMonth + 1)
    }
  }

  // ── Forecast (mirrors the retired MonthlyForecast math) ──────────────────
  const forecast = useMemo(() => {
    const totalDaysInMonth = getDaysInMonth(baseDate)
    const daysSoFar = isCurrentMonth ? now.getDate() : totalDaysInMonth

    let spentSoFar = 0
    if (aggDailyStats) {
      for (const day of aggDailyStats) spentSoFar += convertBreakdownToTotal(day.byCurrency)
    }

    const dailyAvg = daysSoFar > 0 ? spentSoFar / daysSoFar : 0
    const projected = isCurrentMonth ? dailyAvg * totalDaysInMonth : spentSoFar

    let lastMonthTotal = 0
    if (aggMonthlyStats) {
      const lastMonth = selectedMonth === 1 ? 12 : selectedMonth - 1
      const lastYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear
      const found = aggMonthlyStats.find((m) => m.month === `${lastYear}-${String(lastMonth).padStart(2, '0')}`)
      if (found) lastMonthTotal = convertBreakdownToTotal(found.byCurrency)
    }
    const vsLastMonth = lastMonthTotal > 0 ? Math.round(((projected - lastMonthTotal) / lastMonthTotal) * 100) : 0

    return { spentSoFar, projected, dailyAvg, daysSoFar, totalDaysInMonth, vsLastMonth }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aggDailyStats, aggMonthlyStats, selectedYear, selectedMonth, exchangeRates, displayCurrency, isCurrentMonth])

  // ── Monthly budget = sum of per-category budgets (converted to display currency) ──
  const budget = useMemo(() => {
    return categories.reduce((sum, c) => {
      if (!c.monthlyBudget || c.monthlyBudget <= 0 || !c.budgetCurrency) return sum
      if (c.budgetCurrency === displayCurrency) return sum + c.monthlyBudget
      const rate = exchangeRates?.[c.budgetCurrency]
      if (!rate || rate === 0) return sum + c.monthlyBudget
      return sum + c.monthlyBudget / rate
    }, 0)
  }, [categories, exchangeRates, displayCurrency])

  // ── Categories (Where it goes) ──
  const categoryData = useMemo(() => {
    if (!aggCategoryStats) return []
    return aggCategoryStats
      .map((c, index) => ({
        name: c.categoryName,
        value: convertBreakdownToTotal(c.byCurrency),
        icon: c.categoryIcon,
        color: c.categoryColor || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
      }))
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aggCategoryStats, exchangeRates, displayCurrency])
  const categoryTotal = categoryData.reduce((sum, c) => sum + c.value, 0)

  // ── Daily flow series (elapsed days only) ──
  const flowSeries = useMemo(() => {
    const days = isCurrentMonth ? now.getDate() : getDaysInMonth(baseDate)
    const series: { date: string; amount: number }[] = []
    for (let day = 1; day <= days; day++) {
      const date = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const found = aggDailyStats?.find((d) => d.date === date)
      series.push({ date, amount: found ? convertBreakdownToTotal(found.byCurrency) : 0 })
    }
    return series
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aggDailyStats, selectedYear, selectedMonth, exchangeRates, displayCurrency, isCurrentMonth])

  const isLoading = aggStatsLoading || ratesLoading
  const totalReceipts = aggStats?.totalReceipts ?? 0
  const isEmpty = !isLoading && totalReceipts === 0
  const recentReceipts = aggStats?.recentReceipts ?? []

  // ── Rank ──
  const rankReceiptCount = me?.receiptCount ?? totalReceipts
  const rankCode = normalizeRank(me?.receiptRank as ReceiptRank | undefined, rankReceiptCount)
  const rankName =
    rankCode === 'status_a'
      ? t('settings.profile.rank.names.statusA')
      : rankCode === 'status_b'
        ? t('settings.profile.rank.names.statusB')
        : rankCode === 'status_c'
          ? t('settings.profile.rank.names.statusC')
          : t('settings.profile.rank.names.noStatus')

  const daysLeft = forecast.totalDaysInMonth - forecast.daysSoFar

  const controls = (
    <DashboardControls
      displayCurrency={displayCurrency}
      onCurrencyChange={setDisplayCurrency}
      monthLabel={monthYear}
      onPrev={handlePrevMonth}
      onNext={handleNextMonth}
      nextDisabled={nextDisabled}
    />
  )

  // Greeting (emoji-free per the Glass system; the shared i18n value still carries 👋).
  const greeting = (() => {
    const hour = now.getHours()
    const key = hour < 12 ? 'greetingMorning' : hour < 18 ? 'greetingAfternoon' : 'greetingEvening'
    return t(`dashboard.${key}`, { name: me?.firstName }).replace('👋', '').trim()
  })()

  return (
    <AppLayout>
      <PageTransition>
        <PageToolbar
          className="md:-mx-8 md:-mt-8 md:mb-6"
          title={t('dashboard.title')}
          subtitle={t('dashboard.focus.subtitle')}
          actions={controls}
        />

        <AnnouncementBanner />

        {/* Mobile page header — greeting + month/currency controls */}
        <div className="mb-4 md:hidden">
          <h1 className="text-[22px] font-extrabold tracking-[-0.02em]">{greeting}</h1>
          <p className="t-sm mt-0.5 text-muted-foreground">
            {isEmpty ? t('dashboard.mobileGetStarted') : t('dashboard.greetingSubtitle', { month: monthLong })}
          </p>
          <div className="mt-3">{controls}</div>
        </div>

        {isLoading ? (
          <FocusSkeleton />
        ) : isEmpty ? (
          <div className="mx-auto max-w-[1180px]">
            <EmptyState
              icon={QrCode}
              title={t('dashboard.empty.title')}
              description={t('dashboard.empty.description')}
              action={
                <Button
                  type="button"
                  variant="default"
                  onClick={openQrScanner}
                  className="h-9 shrink-0 rounded-lg px-4 text-[14px] font-medium [&_svg]:size-4"
                >
                  <QrCode />
                  {t('receipts.scanReceipt')}
                </Button>
              }
            />
          </div>
        ) : (
          <div className="mx-auto flex max-w-[1180px] flex-col gap-4">
            {/* Top band — hero + safe-to-spend (equal height on desktop) */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.5fr_1fr] md:items-stretch">
              <FocusHero
                monthLabel={monthLong}
                spent={forecast.spentSoFar}
                budget={budget}
                projected={forecast.projected}
                vsLastMonth={forecast.vsLastMonth}
                daysElapsed={forecast.daysSoFar}
                daysTotal={forecast.totalDaysInMonth}
                displayCurrency={displayCurrency}
                amountsVisible={amountsVisible}
                onToggleAmounts={toggleAmountsVisible}
                isCurrentMonth={isCurrentMonth}
                rankLabel={rankName}
              />
              <FocusSafeToSpend
                budget={budget}
                spent={forecast.spentSoFar}
                projected={forecast.projected}
                dailyAvg={forecast.dailyAvg}
                vsLastMonth={forecast.vsLastMonth}
                daysLeft={daysLeft}
                monthLabel={monthLong}
                displayCurrency={displayCurrency}
                amountsVisible={amountsVisible}
                isCurrentMonth={isCurrentMonth}
              />
            </div>

            {/* Body — two independent columns (stack on mobile) */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.5fr_1fr] md:items-start">
              <div className="flex min-w-0 flex-col gap-4">
                <FocusDailyFlow
                  series={flowSeries}
                  avgPerDay={forecast.dailyAvg}
                  monthYearLabel={monthYear}
                  displayCurrency={displayCurrency}
                  amountsVisible={amountsVisible}
                  isCurrentMonth={isCurrentMonth}
                  loading={aggDailyLoading}
                />
                <FocusCoach displayCurrency={displayCurrency} />
                <FocusRecent receipts={recentReceipts} />
              </div>
              <div className="flex min-w-0 flex-col gap-4">
                <FocusCategories
                  categories={categoryData}
                  total={categoryTotal}
                  displayCurrency={displayCurrency}
                  amountsVisible={amountsVisible}
                  loading={aggCategoryLoading}
                />
                <FocusBills displayCurrency={displayCurrency} exchangeRates={exchangeRates} />
              </div>
            </div>
          </div>
        )}
      </PageTransition>

      {scannerModals}
    </AppLayout>
  )
}

/** Skeleton mirroring the Focus layout so it doesn't jump on load. */
function FocusSkeleton() {
  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.5fr_1fr]">
        <Shimmer className="h-[230px] rounded-2xl" />
        <Shimmer className="h-[230px] rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-4">
          <Shimmer className="h-[320px] rounded-3xl" />
          <Shimmer className="h-[180px] rounded-3xl" />
        </div>
        <div className="flex flex-col gap-4">
          <Shimmer className="h-[260px] rounded-3xl" />
          <Shimmer className="h-[200px] rounded-3xl" />
        </div>
      </div>
    </div>
  )
}
