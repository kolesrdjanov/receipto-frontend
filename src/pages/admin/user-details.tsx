import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, Check, CreditCard, FolderOpen, Loader2, Mail, PieChart as PieChartIcon, Receipt, Repeat2, ShieldCheck } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { PageToolbar } from '@/components/layout/page-toolbar'
import { PageTransition } from '@/components/ui/animated'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/glass/empty-state'
import { Avatar } from '@/components/ui/avatar'
import { AdminCard, AdminCardHead, InfoItem, InsetStat, Pill } from '@/components/admin/primitives'
import {
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
import { formatMoney } from '@/lib/utils'
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

const FALLBACK_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

type PieTooltipProps = {
  active?: boolean
  payload?: Array<{ value?: number; color?: string; payload?: { icon?: string; name?: string; receipts?: number } }>
  formatAmount: (amount: number) => string
  receiptsLabel: (count: number) => string
}

/** Custom recharts tooltip — hoisted to module scope (kept out of render). */
function PieTooltip({ active, payload, formatAmount, receiptsLabel }: PieTooltipProps) {
  if (!active || !payload?.length) return null
  const point = payload[0]
  const data = point?.payload
  return (
    <div className="rounded-lg border border-border bg-popover p-3 shadow-glass-3">
      <p className="mb-1 text-sm font-semibold">{data?.icon} {data?.name}</p>
      <p className="text-sm font-medium" style={{ color: point?.color }}>{formatAmount(Number(point?.value) || 0)}</p>
      <p className="mt-1 text-xs text-muted-foreground">{receiptsLabel(data?.receipts || 0)}</p>
    </div>
  )
}

export default function AdminUserDetailsPage() {
  const { t } = useTranslation()
  const { id: userId } = useParams<{ id: string }>()

  const [categoriesPage, setCategoriesPage] = useState(1)
  const [receiptsPage, setReceiptsPage] = useState(1)

  const { currency: preferredCurrency } = useSettingsStore()
  const { data: exchangeRates } = useExchangeRates(preferredCurrency)

  const { data: userDetails, isLoading: isLoadingDetails } = useUserDetails(userId || null)
  const { data: categoriesData, isLoading: isLoadingCategories } = useUserCategories(userId || null, categoriesPage, 8)
  const { data: receiptsData, isLoading: isLoadingReceipts } = useUserReceipts(userId || null, receiptsPage, 15)
  const { data: spendingByCategory, isLoading: isLoadingAnalytics } = useUserSpendingByCategory(userId || null)

  const convertAmount = useCallback(
    (amount: number, fromCurrency: string) => {
      if (fromCurrency === preferredCurrency) return amount
      const rate = exchangeRates?.[fromCurrency]
      if (!rate || rate === 0) return amount
      return amount / rate
    },
    [preferredCurrency, exchangeRates],
  )

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
  }, [spendingByCategory, convertAmount])

  const totalTrackedSpend = analyticsData.reduce((sum, item) => sum + item.value, 0)
  const topCategory = analyticsData[0]

  const formatAmount = (amount: number) => formatMoney(amount, preferredCurrency)

  const backAction = (
    <Button variant="glass" size="sm" asChild>
      <Link to="/admin/users">
        <ArrowLeft className="size-4" />
        {t('admin.users.backToUsers')}
      </Link>
    </Button>
  )

  if (!userId) {
    return (
      <AppLayout>
        <EmptyState compact icon={Receipt} title={t('admin.users.invalidUser')} />
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <PageTransition>
        <PageToolbar
          className="md:-mx-8 md:-mt-8 md:mb-6"
          title={t('admin.users.userDetails')}
          subtitle={t('admin.users.detailsSubtitle')}
          actions={backAction}
        />

        <div className="mb-5 md:hidden">
          <Link to="/admin/users" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="size-4" />
            {t('admin.users.backToUsers')}
          </Link>
          <h1 className="t-h1 text-[28px]">{t('admin.users.userDetails')}</h1>
          <p className="t-sm mt-1 text-muted-foreground">{t('admin.users.detailsSubtitle')}</p>
        </div>

        {isLoadingDetails ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : userDetails ? (
          <div className="mx-auto max-w-[760px] space-y-[18px]">
            {/* Identity */}
            <AdminCard className="p-5 sm:p-[22px]">
              <div className="flex items-center gap-4">
                <Avatar
                  firstName={userDetails.firstName}
                  lastName={userDetails.lastName}
                  imageUrl={userDetails.profileImageUrl}
                  size="xl"
                />
                <div className="min-w-0">
                  <h3 className="text-[19px] font-bold leading-tight tracking-[-0.01em]">
                    {userDetails.firstName || userDetails.lastName
                      ? `${userDetails.firstName || ''} ${userDetails.lastName || ''}`.trim()
                      : t('admin.users.noName')}
                  </h3>
                  <p className="truncate text-sm text-muted-foreground">{userDetails.email}</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 border-t border-hairline-soft pt-5 sm:grid-cols-2">
                <InfoItem icon={Mail} label={t('admin.users.emailLabel')} value={userDetails.email} />
                <InfoItem icon={ShieldCheck} label={t('admin.users.roleLabel')} value={<span className="capitalize">{userDetails.role}</span>} />
                <InfoItem icon={Calendar} label={t('admin.users.table.joined')} value={formatDateTime(userDetails.createdAt)} />
                <InfoItem icon={Receipt} label={t('admin.users.table.receipts')} value={userDetails.receiptCount} />
              </div>
            </AdminCard>

            {/* Feature usage */}
            <AdminCard className="p-5 sm:p-[22px]">
              <AdminCardHead title={t('admin.users.usage.title')} desc={t('admin.users.usage.description')} className="px-0 pt-0" />
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                <InsetStat label={t('admin.users.table.warranties')} value={userDetails.warrantyCount} />
                <InsetStat label={t('admin.users.table.recurring')} value={userDetails.recurringExpenseCount} />
                <InsetStat label={t('admin.users.usage.recurringPayments')} value={userDetails.recurringPaymentCount} />
                <InsetStat label={t('admin.users.usage.recurringReceipts')} value={userDetails.recurringReceiptCount} />
                <InsetStat label={t('admin.users.usage.loyaltyCards')} value={userDetails.loyaltyCardCount} />
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { icon: ShieldCheck, label: t('admin.users.usage.warrantyAdoption'), used: userDetails.warrantyCount > 0 },
                  { icon: Repeat2, label: t('admin.users.usage.recurringAdoption'), used: userDetails.recurringExpenseCount > 0 },
                  { icon: CreditCard, label: t('admin.users.usage.loyaltyCardAdoption'), used: userDetails.loyaltyCardCount > 0 },
                ].map((a) => (
                  <div key={a.label} className="flex items-center gap-2.5 rounded-xl border border-border bg-bg-subtle/50 p-4">
                    <a.icon className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <div className="t-xs text-muted-foreground">{a.label}</div>
                      <div className="mt-1">
                        {a.used
                          ? <Pill tone="success" icon={Check}>{t('admin.users.usage.used')}</Pill>
                          : <Pill tone="neutral">{t('admin.users.usage.notUsed')}</Pill>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AdminCard>

            {/* Spending analytics */}
            <AdminCard className="p-5 sm:p-[22px]">
              <AdminCardHead icon={PieChartIcon} title={t('admin.users.analytics.title')} desc={t('admin.users.analytics.description')} className="px-0 pt-0" />
              {isLoadingAnalytics ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : analyticsData.length > 0 ? (
                <div className="mt-4 space-y-5">
                  <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-center">
                    <div className="relative h-[200px] w-[200px] shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData}
                            cx="50%"
                            cy="50%"
                            innerRadius={66}
                            outerRadius={88}
                            paddingAngle={4}
                            cornerRadius={10}
                            strokeLinecap="round"
                            dataKey="value"
                          >
                            {analyticsData.map((entry, index) => (
                              <Cell key={`cell-${entry.categoryId}-${index}`} fill={entry.color} stroke="none" />
                            ))}
                          </Pie>
                          <Tooltip content={<PieTooltip formatAmount={formatAmount} receiptsLabel={(count) => t('dashboard.receiptsCount', { count })} />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="t-xs text-muted-foreground">{t('admin.users.analytics.tracked')}</span>
                        <span className="mt-0.5 text-[15px] font-extrabold leading-tight">{formatAmount(totalTrackedSpend)}</span>
                      </div>
                    </div>

                    <div className="flex w-full flex-1 flex-col gap-2.5">
                      {analyticsData.slice(0, 5).map((category) => (
                        <div key={category.categoryId} className="flex items-center gap-2 text-sm">
                          <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
                          <span className="min-w-0 flex-1 truncate">{category.icon} {category.name}</span>
                          <span className="shrink-0 font-medium text-muted-foreground">{formatAmount(category.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 border-t border-hairline-soft pt-5 sm:grid-cols-3">
                    <InsetStat label={t('admin.users.analytics.totalTrackedSpend')} value={formatAmount(totalTrackedSpend)} />
                    <InsetStat label={t('admin.users.analytics.topCategory')}>
                      {topCategory ? (
                        <>
                          <div className="mt-1 text-[15px] font-bold">{topCategory.icon} {topCategory.name}</div>
                          <div className="mt-0.5 text-[13px] text-muted-foreground">{formatAmount(topCategory.value)}</div>
                        </>
                      ) : (
                        <div className="mt-1 text-[15px] font-bold text-muted-foreground">–</div>
                      )}
                    </InsetStat>
                    <InsetStat label={t('admin.users.analytics.convertedTo', { currency: preferredCurrency })} className="bg-bg-subtle/30" />
                  </div>
                </div>
              ) : (
                <EmptyState
                  compact
                  className="mt-4 border-0 bg-transparent shadow-none"
                  icon={PieChartIcon}
                  title={t('admin.users.analytics.noData')}
                />
              )}
            </AdminCard>

            {/* Categories / Expenses */}
            <Tabs defaultValue="categories" className="space-y-4">
              <TabsList className="h-auto w-full rounded-full bg-bg-subtle p-1">
                <TabsTrigger value="categories" className="flex-1 rounded-full py-1.5 data-[state=active]:shadow-glass-1">{t('admin.users.categories')}</TabsTrigger>
                <TabsTrigger value="receipts" className="flex-1 rounded-full py-1.5 data-[state=active]:shadow-glass-1">{t('admin.users.receipts')}</TabsTrigger>
              </TabsList>

              <TabsContent value="categories" className="space-y-4">
                {isLoadingCategories ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : categoriesData && categoriesData.data.length > 0 ? (
                  <>
                    <AdminCard className="overflow-hidden">
                      <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full caption-bottom text-sm">
                          <TableHeader className="bg-transparent">
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="w-[60px] pl-5" />
                              <TableHead>{t('categories.table.name')}</TableHead>
                              <TableHead>{t('categories.table.description')}</TableHead>
                              <TableHead className="pr-5">{t('categories.table.monthlyBudget')}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {categoriesData.data.map((category) => (
                              <TableRow key={category.id}>
                                <TableCell className="pl-5">
                                  <span
                                    className="grid size-9 place-items-center rounded-xl text-lg"
                                    style={{ background: (category.color || '#888') + '1f' }}
                                  >
                                    {category.icon}
                                  </span>
                                </TableCell>
                                <TableCell className="font-semibold">{category.name}</TableCell>
                                <TableCell className="text-muted-foreground">{category.description || '–'}</TableCell>
                                <TableCell className="pr-5">
                                  {category.monthlyBudget !== null && category.monthlyBudget !== undefined
                                    ? `${Number(category.monthlyBudget).toFixed(2)}${category.budgetCurrency ? ` ${category.budgetCurrency}` : ''}`
                                    : '–'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </table>
                      </div>
                    </AdminCard>
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
                  <EmptyState compact icon={FolderOpen} title={t('admin.users.noCategories')} />
                )}
              </TabsContent>

              <TabsContent value="receipts" className="space-y-4">
                {isLoadingReceipts ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : receiptsData && receiptsData.data.length > 0 ? (
                  <>
                    <AdminCard className="overflow-hidden">
                      <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full caption-bottom text-sm">
                          <TableHeader className="bg-transparent">
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="pl-5">{t('receipts.table.store')}</TableHead>
                              <TableHead>{t('receipts.table.amount')}</TableHead>
                              <TableHead>{t('receipts.table.category')}</TableHead>
                              <TableHead className="pr-5">{t('receipts.table.date')}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {receiptsData.data.map((receipt) => (
                              <TableRow key={receipt.id}>
                                <TableCell className="pl-5 font-semibold">{receipt.storeName || '–'}</TableCell>
                                <TableCell>
                                  {receipt.totalAmount
                                    ? `${Number(receipt.totalAmount).toFixed(2)} ${receipt.currency || 'RSD'}`
                                    : '–'}
                                </TableCell>
                                <TableCell>
                                  {receipt.category ? (
                                    <span className="flex items-center gap-2">
                                      <span
                                        className="grid size-6 place-items-center rounded-lg text-sm"
                                        style={{ background: (receipt.category.color || '#888') + '1f' }}
                                      >
                                        {receipt.category.icon}
                                      </span>
                                      <span>{receipt.category.name}</span>
                                    </span>
                                  ) : '–'}
                                </TableCell>
                                <TableCell className="pr-5 text-muted-foreground">
                                  {receipt.receiptDate ? formatDateTime(receipt.receiptDate) : '–'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </table>
                      </div>
                    </AdminCard>
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
                  <EmptyState compact icon={Receipt} title={t('admin.users.noReceipts')} />
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </PageTransition>
    </AppLayout>
  )
}
