import {useState, useMemo, useCallback} from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { CurrencySelect } from '@/components/ui/currency-select'
import {Link, useNavigate} from 'react-router-dom'
import { AppLayout } from '@/components/layout/app-layout'
import { CategoryBudgetProgress } from '@/components/dashboard/category-budget-progress'
import { MonthlyForecast } from '@/components/dashboard/monthly-forecast'
import { WidgetRenderer } from '@/components/dashboard/widget-renderer'
import { CoachCard } from '@/components/coach/coach-card'
import { UpcomingRecurring } from '@/components/dashboard/upcoming-recurring'
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
import { cn } from '@/lib/utils'
import { PageTransition, AnimatedNumber } from '@/components/ui/animated'
import {
  Loader2,
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
  LineChart,
  Line,
} from 'recharts'
import { format, getDaysInMonth } from 'date-fns'
import { getNextRank, getProgressToNextRank, normalizeRank, type ReceiptRank } from '@/lib/rank'


const FALLBACK_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

// Static color map — avoids DOM thrashing from getComputedStyle + temp elements
const ACCENT_HEX_MAP: Record<string, { light: string; dark: string }> = {
  zinc:   { light: '#3f3f46', dark: '#e4e4e7' },
  blue:   { light: '#3b82f6', dark: '#60a5fa' },
  green:  { light: '#22c55e', dark: '#4ade80' },
  purple: { light: '#8b5cf6', dark: '#a78bfa' },
  orange: { light: '#f59e0b', dark: '#fbbf24' },
  rose:   { light: '#f43f5e', dark: '#fb7185' },
}

function usePrimaryColor() {
  const { accentColor } = useSettingsStore()
  const isDark = document.documentElement.classList.contains('dark')
  const colors = ACCENT_HEX_MAP[accentColor] || ACCENT_HEX_MAP.zinc
  return isDark ? colors.dark : colors.light
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

  const formatAmount = (amount?: number) => {
    if (amount === undefined || amount === null) return '0'
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: displayCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    return format(new Date(dateString), 'd MMM yyyy')
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
    ? { icon: Crown, iconClassName: 'text-amber-400', cardClassName: 'border-amber-400/30 bg-amber-500/10' }
    : rankCode === 'status_b'
      ? { icon: Sparkles, iconClassName: 'text-blue-400', cardClassName: 'border-blue-400/30 bg-blue-500/10' }
      : rankCode === 'status_c'
        ? { icon: Compass, iconClassName: 'text-emerald-400', cardClassName: 'border-emerald-400/30 bg-emerald-500/10' }
        : { icon: Compass, iconClassName: 'text-muted-foreground', cardClassName: 'border-border bg-muted/20' }

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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload
      const isPieChart = data?.icon !== undefined && data?.color !== undefined

      if (isPieChart) {
        return (
          <div className="bg-popover border border-border rounded-lg shadow-md p-3">
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: data.color }}
              />
              <span className="font-semibold text-sm">{data.icon} {data.name}</span>
            </div>
            <p className="text-sm font-medium">{formatAmount(data.value)}</p>
          </div>
        )
      }

      const displayLabel = data?.date
        ? format(new Date(data.date), 'd MMM yyyy')
        : label

      return (
        <div className="bg-popover border border-border rounded-lg shadow-md p-3">
          <p className="font-semibold text-sm mb-1">{displayLabel}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm font-medium">
              {formatAmount(entry.value)}
            </p>
          ))}
          {data?.date && (
            <p className="text-xs text-muted-foreground mt-1">{t('dashboard.clickToViewReceipts')}</p>
          )}
        </div>
      )
    }
    return null
  }

  const formatAmountRaw = useCallback((amount: number) => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: displayCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }, [displayCurrency])

  // Build widget content map — each entry matches a widget ID from the registry
  const widgetContent: Record<string, React.ReactNode> = {
    'stats-cards': (
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{monthName}</CardTitle>
            <button
              type="button"
              onClick={toggleAmountsVisible}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label={amountsVisible ? t('dashboard.hideAmounts') : t('dashboard.showAmounts')}
            >
              {amountsVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </button>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold font-display tabular-nums">
              {amountsVisible
                ? <AnimatedNumber value={totalMonthAmount} formatFn={formatAmountRaw} />
                : <span className="tracking-wider">••••••</span>
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('dashboard.totalSpent')}</CardTitle>
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold font-display tabular-nums">
              {amountsVisible
                ? <AnimatedNumber value={totalAmount} formatFn={formatAmountRaw} />
                : <span className="tracking-wider">••••••</span>
              }
            </p>
          </CardContent>
        </Card>

        <Link to="/receipts" className="block">
          <Card className="h-full hover:bg-muted/30 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('dashboard.totalReceipts')}</CardTitle>
              <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold font-display tabular-nums">
                <AnimatedNumber value={totalReceipts} />
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/receipts" className="block">
          <Card className="h-full hover:bg-muted/30 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('dashboard.recentActivity')}</CardTitle>
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium truncate">
                {recentReceipts?.[0]?.storeName || '-'}
              </p>
              <p className="text-xs text-muted-foreground">
                {recentReceipts?.[0] ? formatDate(recentReceipts[0].receiptDate || recentReceipts[0].createdAt) : ''}
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    ),

    'category-pie-chart': (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
            {t('dashboard.spendingByCategory')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {aggCategoryLoading ? (
            <div className="flex items-center justify-center h-[250px]">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : categoryChartData.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground">
              {t('dashboard.noDataThisMonth')}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1 text-sm w-full">
                {categoryChartData.slice(0, 5).map((c) => (
                  <div key={c.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="truncate max-w-[100px]">
                      {c.icon} {c.name}
                    </span>
                    <span className="text-muted-foreground ml-auto">{formatAmount(c.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    ),

    'daily-bar-chart': (
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            {t('dashboard.dailySpending')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0">
          {aggDailyLoading ? (
            <div className="flex items-center justify-center h-full min-h-[200px]">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minHeight={200}>
              <BarChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="totalAmount"
                  name="Amount"
                  fill={primaryColor}
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                  onClick={(data: any) => {
                    const date = data?.payload?.date || data?.date
                    if (date) {
                      navigate(`/receipts?startDate=${date}&endDate=${date}`)
                    }
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            {t('dashboard.monthlyTrend', { year: selectedYear })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {aggMonthlyLoading ? (
            <div className="flex items-center justify-center h-[200px]">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="totalAmount"
                  name="Amount"
                  stroke={primaryColor}
                  strokeWidth={2}
                  dot={{ fill: primaryColor }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
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

    'coach-card': (
      <CoachCard displayCurrency={displayCurrency} />
    ),

    'rank-card': (
      <Card className={cn(rankVisual.cardClassName)}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between gap-3 text-base">
            <span>{t('dashboard.rank.title')}</span>
            <span className="inline-flex items-center gap-2">
              <rankVisual.icon className={cn('h-4 w-4', rankVisual.iconClassName)} />
              <span className="font-semibold">{rankName}</span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t('dashboard.rank.receiptsTracked', { count: rankReceiptCount })}
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{t('dashboard.rank.progress')}</span>
              <span>{Math.round(rankProgress)}%</span>
            </div>
            <Progress value={rankProgress} className="h-2" />
          </div>
          <p className="text-sm text-muted-foreground">
            {nextRank
              ? t('dashboard.rank.nextTarget', {
                  count: Math.max(nextRank.minReceipts - rankReceiptCount, 0),
                  rank: t(nextRank.nameKey),
                })
              : t('dashboard.rank.topTier')}
          </p>
          <p className="text-sm">{rankDescription}</p>
        </CardContent>
      </Card>
    ),

    'recent-activity': (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-muted-foreground" />
            {t('dashboard.recentActivity')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentReceipts && recentReceipts.length > 0 ? (
            <div className="divide-y divide-border">
              {recentReceipts.slice(0, 5).map((receipt) => (
                <Link
                  key={receipt.id}
                  to="/receipts"
                  className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 hover:bg-muted/30 -mx-1 px-1 rounded transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{receipt.storeName || t('dashboard.unknownStore')}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(receipt.receiptDate || receipt.createdAt)}</p>
                  </div>
                  <span className="text-sm font-medium tabular-nums shrink-0 ml-4">
                    {new Intl.NumberFormat('sr-RS', {
                      style: 'currency',
                      currency: receipt.currency || 'RSD',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(Number(receipt.totalAmount) || 0)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('dashboard.noRecentActivity')}</p>
          )}
        </CardContent>
      </Card>
    ),
  }

  // Conditionally add recurring expenses widget
  if (featureFlags?.recurringExpenses ?? true) {
    widgetContent['upcoming-recurring'] = (
      <UpcomingRecurring displayCurrency={displayCurrency} exchangeRates={exchangeRates} />
    )
  }

  return (
    <AppLayout>
      <PageTransition>
      <div>
      <AnnouncementBanner />
      <div className="mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-1 md:text-3xl font-display">{t('dashboard.title')}</h2>
            <p className="text-sm text-muted-foreground md:text-base">
              {t('dashboard.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Mode Toolbar */}
      {isEditMode && (
        <div className="mb-4 flex items-center justify-between gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5">
          <p className="text-sm text-muted-foreground">
            {t('dashboard.widgets.editHint')}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { resetToDefault() }}
              className="gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t('dashboard.widgets.resetToDefault')}
            </Button>
            <Button
              size="sm"
              onClick={() => setEditMode(false)}
            >
              {t('dashboard.widgets.done')}
            </Button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Section Title + Controls */}
          <h3 className="text-lg font-semibold mb-3">{t('dashboard.spendingAnalysis')}</h3>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="flex items-center gap-2 p-1 rounded-lg bg-muted/50">
              <Coins className="h-4 w-4 text-muted-foreground ml-2 shrink-0" />
              <CurrencySelect
                value={displayCurrency}
                onValueChange={setDisplayCurrency}
                placeholder={t('dashboard.currency')}
                triggerClassName="w-full border-0 bg-transparent focus:ring-0 focus:ring-offset-0"
              />
            </div>
            <div className="flex items-center justify-center gap-1 p-1 rounded-lg bg-muted/50">
              <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8 hover:bg-background">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[80px] text-center">{monthName}</span>
              <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8 hover:bg-background">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <WidgetRenderer widgetContent={widgetContent} />
        </>
      )}

      {/* Safe area for floating QR button on mobile */}
      <div className="h-20 md:hidden" />
      </div>
      </PageTransition>

      {/* Floating QR Scanner button - mobile only */}
      <button
        className="md:hidden !fixed bottom-6 right-6 z-10 bg-primary text-primary-foreground rounded-full h-14 w-14 shadow-lg flex items-center justify-center active:scale-[0.97] transition-transform"
        onClick={openQrScanner}
      >
        <QrCode className="h-6 w-6" />
      </button>

      {scannerModals}
    </AppLayout>
  )
}
