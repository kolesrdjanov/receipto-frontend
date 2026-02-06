import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, Loader2, Mail, PieChart as PieChartIcon, Receipt, ShieldCheck } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDateTime } from '@/lib/date-utils'
import {
  useUserCategories,
  useUserDetails,
  useUserReceipts,
  useUserSpendingByCategory,
} from '@/hooks/admin/use-admin-users'
import { useExchangeRates } from '@/hooks/currencies/use-currency-converter'
import { useSettingsStore } from '@/store/settings'
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

const FALLBACK_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

export default function AdminUserDetailsPage() {
  const { t } = useTranslation()
  const { id: userId } = useParams<{ id: string }>()

  const [categoriesPage, setCategoriesPage] = useState(1)
  const [receiptsPage, setReceiptsPage] = useState(1)

  const { currency: preferredCurrency } = useSettingsStore()
  const { data: exchangeRates } = useExchangeRates(preferredCurrency)

  const { data: userDetails, isLoading: isLoadingDetails } = useUserDetails(userId || null)
  const { data: categoriesData, isLoading: isLoadingCategories } = useUserCategories(
    userId || null,
    categoriesPage,
    8
  )
  const { data: receiptsData, isLoading: isLoadingReceipts } = useUserReceipts(
    userId || null,
    receiptsPage,
    15
  )
  const { data: spendingByCategory, isLoading: isLoadingAnalytics } = useUserSpendingByCategory(
    userId || null
  )

  const convertAmount = (amount: number, fromCurrency: string) => {
    if (fromCurrency === preferredCurrency) return amount
    const rate = exchangeRates?.[fromCurrency]
    if (!rate || rate === 0) return amount
    return amount / rate
  }

  const analyticsData = useMemo(() => {
    if (!spendingByCategory?.length) return []

    return spendingByCategory
      .map((category, index) => {
        const convertedTotal = category.byCurrency.reduce((sum, item) => {
          return sum + convertAmount(item.totalAmount, item.currency)
        }, 0)

        const receiptCount = category.byCurrency.reduce((sum, item) => sum + item.receiptCount, 0)

        return {
          categoryId: category.categoryId,
          name: category.categoryName,
          icon: category.categoryIcon,
          color: category.categoryColor || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
          value: convertedTotal,
          receipts: receiptCount,
        }
      })
      .sort((a, b) => b.value - a.value)
  }, [spendingByCategory, exchangeRates, preferredCurrency])

  const totalTrackedSpend = analyticsData.reduce((sum, item) => sum + item.value, 0)
  const topCategory = analyticsData[0]

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: preferredCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0]
      const data = point?.payload

      return (
        <div className="rounded-xl border border-border/50 bg-popover/95 p-3 shadow-xl backdrop-blur-sm">
          <p className="mb-1 text-sm font-semibold">
            {data?.icon} {data?.name}
          </p>
          <p className="text-sm font-medium" style={{ color: point?.color }}>
            {formatAmount(Number(point?.value) || 0)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('dashboard.receiptsCount', { count: data?.receipts || 0 })}
          </p>
        </div>
      )
    }

    return null
  }

  if (!userId) {
    return (
      <AppLayout>
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            {t('admin.users.invalidUser')}
          </CardContent>
        </Card>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="mb-6 space-y-3">
        <Button variant="ghost" asChild className="w-fit pl-0">
          <Link to="/admin/users">
            <ArrowLeft className="h-4 w-4" />
            {t('admin.users.backToUsers')}
          </Link>
        </Button>

        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('admin.users.userDetails')}</h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            {t('admin.users.detailsSubtitle')}
          </p>
        </div>
      </div>

      {isLoadingDetails ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : userDetails ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.users.information')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar
                  firstName={userDetails.firstName}
                  lastName={userDetails.lastName}
                  imageUrl={userDetails.profileImageUrl}
                  size="2xl"
                />
                <div>
                  <h3 className="text-xl font-semibold">
                    {userDetails.firstName || userDetails.lastName
                      ? `${userDetails.firstName || ''} ${userDetails.lastName || ''}`.trim()
                      : t('admin.users.noName')}
                  </h3>
                  <p className="text-sm text-muted-foreground">{userDetails.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2">
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('admin.users.emailLabel')}</p>
                    <p className="text-sm font-medium">{userDetails.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('admin.users.roleLabel')}</p>
                    <p className="text-sm font-medium capitalize">{userDetails.role}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('admin.users.table.joined')}</p>
                    <p className="text-sm font-medium">{formatDateTime(userDetails.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('admin.users.table.receipts')}</p>
                    <p className="text-sm font-medium">{userDetails.receiptCount}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-primary" />
                {t('admin.users.analytics.title')}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{t('admin.users.analytics.description')}</p>
            </CardHeader>
            <CardContent>
              {isLoadingAnalytics ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : analyticsData.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-4 lg:flex-row">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={analyticsData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {analyticsData.map((entry, index) => (
                            <Cell key={`cell-${entry.categoryId}-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex flex-col gap-1 text-sm">
                    {analyticsData.slice(0, 5).map((category) => (
                      <div key={category.categoryId} className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="max-w-[160px] truncate">
                          {category.icon} {category.name}
                        </span>
                        <span className="ml-auto text-muted-foreground">
                          {formatAmount(category.value)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border p-4">
                      <p className="text-xs text-muted-foreground">{t('admin.users.analytics.totalTrackedSpend')}</p>
                      <p className="text-2xl font-bold">{formatAmount(totalTrackedSpend)}</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-xs text-muted-foreground">{t('admin.users.analytics.topCategory')}</p>
                      {topCategory ? (
                        <>
                          <p className="mt-1 text-base font-semibold">
                            {topCategory.icon} {topCategory.name}
                          </p>
                          <p className="text-sm text-muted-foreground">{formatAmount(topCategory.value)}</p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">-</p>
                      )}
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-xs text-muted-foreground">
                        {t('admin.users.analytics.convertedTo', { currency: preferredCurrency })}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  {t('admin.users.analytics.noData')}
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="categories" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="categories">{t('admin.users.categories')}</TabsTrigger>
              <TabsTrigger value="receipts">{t('admin.users.receipts')}</TabsTrigger>
            </TabsList>

            <TabsContent value="categories" className="space-y-4">
              {isLoadingCategories ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : categoriesData && categoriesData.data.length > 0 ? (
                <>
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12"></TableHead>
                            <TableHead>{t('categories.table.name')}</TableHead>
                            <TableHead>{t('categories.table.description')}</TableHead>
                            <TableHead>{t('categories.table.monthlyBudget')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {categoriesData.data.map((category) => (
                            <TableRow key={category.id}>
                              <TableCell>
                                <div
                                  className="flex h-8 w-8 items-center justify-center rounded-full text-lg"
                                  style={{ backgroundColor: category.color + '20' }}
                                >
                                  {category.icon}
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">{category.name}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {category.description || '-'}
                              </TableCell>
                              <TableCell>
                                {category.monthlyBudget !== null && category.monthlyBudget !== undefined
                                  ? `${Number(category.monthlyBudget).toFixed(2)}${category.budgetCurrency ? ` ${category.budgetCurrency}` : ''}`
                                  : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                  {categoriesData.meta.totalPages > 1 && (
                    <Pagination
                      page={categoriesData.meta.page}
                      totalPages={categoriesData.meta.totalPages}
                      total={categoriesData.meta.total}
                      limit={categoriesData.meta.limit}
                      onPageChange={setCategoriesPage}
                    />
                  )}
                </>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    {t('admin.users.noCategories')}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="receipts" className="space-y-4">
              {isLoadingReceipts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : receiptsData && receiptsData.data.length > 0 ? (
                <>
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('receipts.table.store')}</TableHead>
                            <TableHead>{t('receipts.table.amount')}</TableHead>
                            <TableHead>{t('receipts.table.category')}</TableHead>
                            <TableHead>{t('receipts.table.date')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {receiptsData.data.map((receipt) => (
                            <TableRow key={receipt.id}>
                              <TableCell className="font-medium">{receipt.storeName || '-'}</TableCell>
                              <TableCell>
                                {receipt.totalAmount
                                  ? `${Number(receipt.totalAmount).toFixed(2)} ${receipt.currency || 'RSD'}`
                                  : '-'}
                              </TableCell>
                              <TableCell>
                                {receipt.category ? (
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="flex h-6 w-6 items-center justify-center rounded-full text-sm"
                                      style={{
                                        backgroundColor: receipt.category.color + '20',
                                      }}
                                    >
                                      {receipt.category.icon}
                                    </div>
                                    <span className="text-sm">{receipt.category.name}</span>
                                  </div>
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                              <TableCell>
                                {receipt.receiptDate ? formatDateTime(receipt.receiptDate) : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                  {receiptsData.meta.totalPages > 1 && (
                    <Pagination
                      page={receiptsData.meta.page}
                      totalPages={receiptsData.meta.totalPages}
                      total={receiptsData.meta.total}
                      limit={receiptsData.meta.limit}
                      onPageChange={setReceiptsPage}
                    />
                  )}
                </>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    {t('admin.users.noReceipts')}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      ) : null}
    </AppLayout>
  )
}
