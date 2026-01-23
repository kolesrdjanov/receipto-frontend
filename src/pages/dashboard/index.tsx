import {useState, useMemo, lazy, Suspense} from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PfrData } from '@/components/receipts/pfr-entry-modal'

import { Button } from '@/components/ui/button'
import { Tooltip as ButtonTooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {Link, useNavigate} from 'react-router-dom'
import { AppLayout } from '@/components/layout/app-layout'
import { CategoryBudgetProgress } from '@/components/dashboard/category-budget-progress'
import { CategoryInsights } from '@/components/dashboard/category-insights'
import {
  useDashboardStats,
  useCategoryStats,
  useDailyStats,
  useMonthlyStats,
  useTopStores,
  useAggregatedStats,
  useAggregatedCategoryStats,
  useAggregatedDailyStats,
  useAggregatedMonthlyStats,
  useAggregatedTopStores,
  type CurrencyBreakdown,
} from '@/hooks/dashboard/use-dashboard'
import {getCurrencyFlag, useCurrencies} from '@/hooks/currencies/use-currencies'
import { useExchangeRates } from '@/hooks/currencies/use-currency-converter'
import { useSettingsStore } from '@/store/settings'
import {
  Loader2,
  Receipt,
  FolderOpen,
  Clock,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Store,
  PieChart as PieChartIcon,
  BarChart3,
  Coins,
  RefreshCw,
  QrCode
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
import {toast} from "sonner";
import { useCreateReceipt } from '@/hooks/receipts/use-receipts'
const QrScanner = lazy(() => import('@/components/receipts/qr-scanner').then(m => ({ default: m.QrScanner })))
const PfrEntryModal = lazy(() => import('@/components/receipts/pfr-entry-modal').then(m => ({ default: m.PfrEntryModal })))

const FALLBACK_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

const ALL_CONVERTED = 'ALL'

export default function Dashboard() {
  const { t } = useTranslation()
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [currencyMode, setCurrencyMode] = useState<string>('RSD')
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isPfrEntryOpen, setIsPfrEntryOpen] = useState(false)
  const createReceipt = useCreateReceipt()
  const navigate = useNavigate()

  const { currency: preferredCurrency } = useSettingsStore()
  const { data: currencies = [] } = useCurrencies()

  const isConvertedMode = currencyMode === ALL_CONVERTED
  const displayCurrency = isConvertedMode ? preferredCurrency : currencyMode

  const { data: exchangeRates, isLoading: ratesLoading } = useExchangeRates(preferredCurrency)

  const { data: stats, isLoading: statsLoading } = useDashboardStats(
    isConvertedMode ? undefined : currencyMode
  )
  const { data: categoryStats, isLoading: categoryLoading } = useCategoryStats(
    selectedYear, selectedMonth, isConvertedMode ? undefined : currencyMode
  )
  const { data: dailyStats, isLoading: dailyLoading } = useDailyStats(
    selectedYear, selectedMonth, isConvertedMode ? undefined : currencyMode
  )
  const { data: monthlyStats, isLoading: monthlyLoading } = useMonthlyStats(
    selectedYear, isConvertedMode ? undefined : currencyMode
  )
  const { data: topStores, isLoading: storesLoading } = useTopStores(
    5, isConvertedMode ? undefined : currencyMode
  )

  const { data: aggStats, isLoading: aggStatsLoading } = useAggregatedStats()
  const { data: aggCategoryStats, isLoading: aggCategoryLoading } = useAggregatedCategoryStats(
    selectedYear, selectedMonth
  )
  const { data: aggDailyStats, isLoading: aggDailyLoading } = useAggregatedDailyStats(
    selectedYear, selectedMonth
  )
  const { data: aggMonthlyStats, isLoading: aggMonthlyLoading } = useAggregatedMonthlyStats(selectedYear)
  const { data: aggTopStores, isLoading: aggStoresLoading } = useAggregatedTopStores(5)

  const convertBreakdownToTotal = (breakdown: CurrencyBreakdown[] | undefined): number => {
    if (!breakdown || !exchangeRates) return 0
    return breakdown.reduce((sum, item) => {
      if (item.currency === preferredCurrency) {
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

  const isLoading = isConvertedMode
    ? (aggStatsLoading || ratesLoading)
    : statsLoading

  const totalReceipts = isConvertedMode
    ? (aggStats?.totalReceipts ?? 0)
    : (stats?.totalReceipts ?? 0)

  const totalCategories = isConvertedMode
    ? (aggStats?.totalCategories ?? 0)
    : (stats?.totalCategories ?? 0)

  const totalAmount = isConvertedMode
    ? convertBreakdownToTotal(aggStats?.byCurrency)
    : (stats?.totalAmount ?? 0)

  const recentReceipts = isConvertedMode
    ? (aggStats?.recentReceipts ?? [])
    : (stats?.recentReceipts ?? [])

  const dailyChartData = useMemo(() => {
    const daysInMonth = getDaysInMonth(new Date(selectedYear, selectedMonth - 1))
    const data = []

    if (isConvertedMode && aggDailyStats) {
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const found = aggDailyStats.find((d) => d.date === dateStr)
        data.push({
          day,
          date: dateStr,
          totalAmount: found ? convertBreakdownToTotal(found.byCurrency) : 0,
          receiptCount: found ? found.byCurrency.reduce((sum, c) => sum + c.receiptCount, 0) : 0,
        })
      }
    } else {
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const found = dailyStats?.find((d) => d.date === dateStr)
        data.push({
          day,
          date: dateStr,
          totalAmount: found?.totalAmount || 0,
          receiptCount: found?.receiptCount || 0,
        })
      }
    }
    return data
  }, [dailyStats, aggDailyStats, selectedYear, selectedMonth, isConvertedMode, exchangeRates])

  const monthlyChartData = useMemo(() => {
    const months = []

    if (isConvertedMode && aggMonthlyStats) {
      for (let m = 1; m <= 12; m++) {
        const monthStr = `${selectedYear}-${String(m).padStart(2, '0')}`
        const found = aggMonthlyStats.find((d) => d.month === monthStr)
        months.push({
          month: format(new Date(selectedYear, m - 1), 'MMM'),
          totalAmount: found ? convertBreakdownToTotal(found.byCurrency) : 0,
          receiptCount: found ? found.byCurrency.reduce((sum, c) => sum + c.receiptCount, 0) : 0,
        })
      }
    } else {
      for (let m = 1; m <= 12; m++) {
        const monthStr = `${selectedYear}-${String(m).padStart(2, '0')}`
        const found = monthlyStats?.find((d) => d.month === monthStr)
        months.push({
          month: format(new Date(selectedYear, m - 1), 'MMM'),
          totalAmount: found?.totalAmount || 0,
          receiptCount: found?.receiptCount || 0,
        })
      }
    }
    return months
  }, [monthlyStats, aggMonthlyStats, selectedYear, isConvertedMode, exchangeRates])

  const categoryChartData = useMemo(() => {
    if (isConvertedMode && aggCategoryStats) {
      return aggCategoryStats.map((c, index) => ({
        name: c.categoryName,
        value: convertBreakdownToTotal(c.byCurrency),
        icon: c.categoryIcon,
        color: c.categoryColor || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
        count: c.byCurrency.reduce((sum, b) => sum + b.receiptCount, 0),
      }))
    }

    if (!categoryStats || categoryStats.length === 0) return []
    return categoryStats.map((c, index) => ({
      name: c.categoryName,
      value: c.totalAmount,
      icon: c.categoryIcon,
      color: c.categoryColor || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
      count: c.receiptCount,
    }))
  }, [categoryStats, aggCategoryStats, isConvertedMode, exchangeRates])

  const totalMonthAmount = categoryChartData.reduce((sum, c) => sum + c.value, 0)

  const topStoresData = useMemo(() => {
    if (isConvertedMode && aggTopStores) {
      return aggTopStores.map((s) => ({
        storeName: s.storeName,
        totalAmount: convertBreakdownToTotal(s.byCurrency),
        receiptCount: s.byCurrency.reduce((sum, b) => sum + b.receiptCount, 0),
      })).sort((a, b) => b.totalAmount - a.totalAmount)
    }
    return topStores || []
  }, [topStores, aggTopStores, isConvertedMode, exchangeRates])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border rounded-lg shadow-lg p-3">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatAmount(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const handleScanQr = () => {
    setIsScannerOpen(true)
  }

  const handleQrScan = async (url: string) => {
    try {
      await createReceipt.mutateAsync({ qrCodeUrl: url })
      toast.success(t('receipts.qrScanner.scanSuccess'), {
        description: t('receipts.qrScanner.scanSuccessDescription'),
      })
      setIsScannerOpen(false)
      // Navigate to receipts page if not already there
      if (location.pathname !== '/receipts') {
        navigate('/receipts')
      }
    } catch (error) {
      const errorMessage =
          error instanceof Error ? error.message : 'An error occurred'
      toast.error(t('receipts.qrScanner.scanError'), {
        description: errorMessage,
      })
    }
  }

  const handleOcrScan = async (pfrData: PfrData) => {
    // Call API with PFR data to fetch full receipt from fiscal system
    try {
      await createReceipt.mutateAsync({
        pfrData: {
          InvoiceNumberSe: pfrData.InvoiceNumberSe,
          InvoiceCounter: pfrData.InvoiceCounter,
          InvoiceCounterExtension: pfrData.InvoiceCounterExtension,
          TotalAmount: pfrData.TotalAmount,
          SdcDateTime: pfrData.SdcDateTime,
        },
      })
      toast.success(t('receipts.qrScanner.scanSuccess'), {
        description: t('receipts.qrScanner.scanSuccessDescription'),
      })
      setIsPfrEntryOpen(false)
      // Navigate to receipts page
      if (location.pathname !== '/receipts') {
        navigate('/receipts')
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred'
      toast.error(t('receipts.qrScanner.scanError'), {
        description: errorMessage,
      })
    }
  }

  return (
    <AppLayout>
      <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className={'flex items-start gap-4'}>
          <div className={'flex gap-0 flex-col'}>
            <h2 className="text-2xl font-bold tracking-tight mb-2 md:text-3xl">{t('dashboard.title')}</h2>
            <p className="text-sm text-muted-foreground md:text-base">
              {t('dashboard.subtitle')}
            </p>
          </div>
          <ButtonTooltip>
            <TooltipTrigger asChild>
              <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleScanQr}
                  aria-label="Scan QR Code"
                  className="[&_svg]:!size-7 ml-auto md:ml-0"
              >
                <QrCode />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('dashboard.scan_now')}</p>
            </TooltipContent>
          </ButtonTooltip>

        </div>
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-muted-foreground" />
          <Select value={currencyMode} onValueChange={setCurrencyMode}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t('dashboard.currency')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CONVERTED}>
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-3 w-3" />
                  {t('dashboard.allTo', { currency: preferredCurrency })}
                </span>
              </SelectItem>
              {currencies.map((c) => (
                <SelectItem key={c.id} value={c.code}>
                  <div className="flex items-center gap-2">
                    <span>{getCurrencyFlag(c.icon)}</span>
                    <span>{c.code}</span>
                    <span>({c.symbol})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isConvertedMode && (
        <div className="mb-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          {t('dashboard.convertedAmounts', { currency: preferredCurrency })}
        </div>
      )}

      {/* Stats Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <Link to="/receipts">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{t('dashboard.totalReceipts')}</CardTitle>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{totalReceipts}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isConvertedMode ? t('dashboard.inCurrency', { currency: preferredCurrency }) : t('dashboard.inCurrency', { currency: currencyMode })}
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t('dashboard.totalSpent')}</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatAmount(totalAmount)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isConvertedMode ? t('dashboard.approxInCurrency', { currency: preferredCurrency }) : t('dashboard.inCurrency', { currency: currencyMode })}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t('dashboard.thisMonth')}</CardTitle>
                <PieChartIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatAmount(totalMonthAmount)}</p>
                <p className="text-xs text-muted-foreground mt-1">{monthName}</p>
              </CardContent>
            </Card>

            <Link to="/categories">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{t('dashboard.categories')}</CardTitle>
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{totalCategories}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('dashboard.available')}</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Month Selector */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{t('dashboard.spendingAnalysis')}</h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">{monthName}</span>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
            {/* Category Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <PieChartIcon className="h-4 w-4" />
                  {t('dashboard.spendingByCategory')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(isConvertedMode ? aggCategoryLoading : categoryLoading) ? (
                  <div className="flex items-center justify-center h-[250px]">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : categoryChartData.length === 0 ? (
                  <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                    {t('dashboard.noDataThisMonth')}
                  </div>
                ) : (
                  <div className="flex flex-col lg:flex-row items-center gap-4">
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
                    <div className="flex flex-col gap-1 text-sm w-full lg:w-auto">
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

            {/* Daily Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-4 w-4" />
                  {t('dashboard.dailySpending')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(isConvertedMode ? aggDailyLoading : dailyLoading) ? (
                  <div className="flex items-center justify-center h-[250px]">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
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
                      <Bar dataKey="totalAmount" name="Amount" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Budget Progress */}
            <CategoryBudgetProgress
              aggCategoryStats={aggCategoryStats}
              exchangeRates={exchangeRates}
              preferredCurrency={preferredCurrency}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3 mb-6">
            {/* Monthly Trend */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4" />
                  {t('dashboard.monthlyTrend', { year: selectedYear })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(isConvertedMode ? aggMonthlyLoading : monthlyLoading) ? (
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
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Top Stores */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Store className="h-4 w-4" />
                  {t('dashboard.topStores')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(isConvertedMode ? aggStoresLoading : storesLoading) ? (
                  <div className="flex items-center justify-center h-[200px]">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : topStoresData && topStoresData.length > 0 ? (
                  <div className="space-y-3">
                    {topStoresData.slice(0, 5).map((store, index) => (
                      <div key={store.storeName} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-muted-foreground w-4">{index + 1}.</span>
                          <span className="text-sm truncate max-w-[120px]">{store.storeName}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatAmount(store.totalAmount)}</p>
                          <p className="text-xs text-muted-foreground">{t('dashboard.receiptsCount', { count: store.receiptCount })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                    {t('dashboard.noStoreData')}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* AI Categorization Insights */}
          <div className="mb-6">
            <CategoryInsights />
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                {t('dashboard.recentActivity')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentReceipts && recentReceipts.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  {recentReceipts.slice(0, 5).map((receipt) => (
                    <Link
                      key={receipt.id}
                      to="/receipts"
                      className="flex flex-col p-3 hover:bg-accent rounded-lg transition-colors border truncate"
                    >
                      <span className="font-medium truncate">{receipt.storeName || t('dashboard.unknownStore')}</span>
                      <span className="text-lg font-bold">
                        {new Intl.NumberFormat('sr-RS', {
                          style: 'currency',
                          currency: receipt.currency || 'RSD',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(Number(receipt.totalAmount) || 0)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(receipt.receiptDate || receipt.createdAt)}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t('dashboard.noRecentActivity')}</p>
              )}
            </CardContent>
          </Card>

          <Suspense fallback={null}>
            <QrScanner
                open={isScannerOpen}
                onOpenChange={setIsScannerOpen}
                onScan={handleQrScan}
            />
          </Suspense>

          <Suspense fallback={null}>
            <PfrEntryModal
                open={isPfrEntryOpen}
                onOpenChange={setIsPfrEntryOpen}
                onSubmit={handleOcrScan}
            />
          </Suspense>
        </>
      )}
    </AppLayout>
  )
}
