import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { AppLayout } from '@/components/layout/app-layout'
import {
  useDashboardStats,
  useCategoryStats,
  useDailyStats,
  useMonthlyStats,
  useTopStores,
} from '@/hooks/dashboard/use-dashboard'
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

const FALLBACK_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

export default function Dashboard() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)

  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: categoryStats, isLoading: categoryLoading } = useCategoryStats(selectedYear, selectedMonth)
  const { data: dailyStats, isLoading: dailyLoading } = useDailyStats(selectedYear, selectedMonth)
  const { data: monthlyStats, isLoading: monthlyLoading } = useMonthlyStats(selectedYear)
  const { data: topStores, isLoading: storesLoading } = useTopStores(5)

  const formatAmount = (amount?: number, currency?: string) => {
    if (amount === undefined || amount === null) return '0'
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: currency || 'RSD',
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

  // Prepare daily data with all days of month
  const dailyChartData = useMemo(() => {
    const daysInMonth = getDaysInMonth(new Date(selectedYear, selectedMonth - 1))
    const data = []
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const found = dailyStats?.find((d) => d.date === dateStr)
      data.push({
        day: day,
        date: dateStr,
        totalAmount: found?.totalAmount || 0,
        receiptCount: found?.receiptCount || 0,
      })
    }
    return data
  }, [dailyStats, selectedYear, selectedMonth])

  // Prepare monthly data with all months
  const monthlyChartData = useMemo(() => {
    const months = []
    for (let m = 1; m <= 12; m++) {
      const monthStr = `${selectedYear}-${String(m).padStart(2, '0')}`
      const found = monthlyStats?.find((d) => d.month === monthStr)
      months.push({
        month: format(new Date(selectedYear, m - 1), 'MMM'),
        totalAmount: found?.totalAmount || 0,
        receiptCount: found?.receiptCount || 0,
      })
    }
    return months
  }, [monthlyStats, selectedYear])

  // Category chart data
  const categoryChartData = useMemo(() => {
    if (!categoryStats || categoryStats.length === 0) return []
    return categoryStats.map((c, index) => ({
      name: c.categoryName,
      value: c.totalAmount,
      icon: c.categoryIcon,
      color: c.categoryColor || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
      count: c.receiptCount,
    }))
  }, [categoryStats])

  const totalMonthAmount = categoryStats?.reduce((sum, c) => sum + c.totalAmount, 0) || 0

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

  return (
    <AppLayout>
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl font-bold tracking-tight mb-2 md:text-3xl">Dashboard</h2>
        <p className="text-sm text-muted-foreground md:text-base">
          Overview of your expenses and spending patterns
        </p>
      </div>

      {/* Stats Cards */}
      {statsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <Link to="/receipts">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stats?.totalReceipts ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">All time</p>
                </CardContent>
              </Card>
            </Link>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatAmount(stats?.totalAmount, stats?.currency)}</p>
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <PieChartIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatAmount(totalMonthAmount, stats?.currency)}</p>
                <p className="text-xs text-muted-foreground mt-1">{monthName}</p>
              </CardContent>
            </Card>

            <Link to="/categories">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Categories</CardTitle>
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stats?.totalCategories ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Available</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Month Selector */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Spending Analysis</h3>
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

          <div className="grid gap-4 lg:grid-cols-2 mb-6">
            {/* Category Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <PieChartIcon className="h-4 w-4" />
                  Spending by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                {categoryLoading ? (
                  <div className="flex items-center justify-center h-[250px]">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : categoryChartData.length === 0 ? (
                  <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                    No data for this month
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
                  Daily Spending
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dailyLoading ? (
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
          </div>

          <div className="grid gap-4 lg:grid-cols-3 mb-6">
            {/* Monthly Trend */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4" />
                  Monthly Trend ({selectedYear})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyLoading ? (
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
                  Top Stores
                </CardTitle>
              </CardHeader>
              <CardContent>
                {storesLoading ? (
                  <div className="flex items-center justify-center h-[200px]">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : topStores && topStores.length > 0 ? (
                  <div className="space-y-3">
                    {topStores.map((store, index) => (
                      <div key={store.storeName} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-muted-foreground w-4">{index + 1}.</span>
                          <span className="text-sm truncate max-w-[120px]">{store.storeName}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatAmount(store.totalAmount)}</p>
                          <p className="text-xs text-muted-foreground">{store.receiptCount} receipts</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                    No store data
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.recentReceipts && stats.recentReceipts.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  {stats.recentReceipts.slice(0, 5).map((receipt) => (
                    <Link
                      key={receipt.id}
                      to="/receipts"
                      className="flex flex-col p-3 hover:bg-accent rounded-lg transition-colors border"
                    >
                      <span className="font-medium truncate">{receipt.storeName || 'Unknown Store'}</span>
                      <span className="text-lg font-bold">{formatAmount(receipt.totalAmount, receipt.currency)}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(receipt.receiptDate || receipt.createdAt)}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </AppLayout>
  )
}

