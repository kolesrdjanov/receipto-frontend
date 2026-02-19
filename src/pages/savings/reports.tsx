import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  FileText,
  TrendingUp,
  TrendingDown,
  Target,
  Sparkles,
  Lightbulb,
  Calendar,
  RefreshCw,
} from 'lucide-react'
import { useReportList, useReport, useGenerateReportNow } from '@/hooks/savings/use-reports'
import { SavingsCopilot } from '@/components/savings/savings-copilot'

const MONTH_NAMES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MONTH_NAMES_SR = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun', 'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar']

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount))
}

export default function Reports() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const monthNames = i18n.language === 'sr' ? MONTH_NAMES_SR : MONTH_NAMES_EN
  const now = new Date()

  const { data: reportList, isLoading: listLoading } = useReportList()
  const generateReport = useGenerateReportNow()

  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)

  // Auto-select first available report
  const effectiveYear = selectedYear ?? reportList?.[0]?.year ?? null
  const effectiveMonth = selectedMonth ?? reportList?.[0]?.month ?? null
  const copilotYear = effectiveYear ?? now.getFullYear()
  const copilotMonth = effectiveMonth ?? now.getMonth() + 1

  const { data: report, isLoading: reportLoading } = useReport(effectiveYear, effectiveMonth)

  const data = report?.data

  const handleGenerateNow = () => {
    generateReport.mutate(
      { year: copilotYear, month: copilotMonth },
      {
        onSuccess: () => {
          setSelectedYear(copilotYear)
          setSelectedMonth(copilotMonth)
          toast.success(t('savings.reports.generated'))
        },
        onError: () => {
          toast.error(t('common.error'))
        },
      },
    )
  }

  return (
    <AppLayout>
      <div className="mb-6 sm:mb-8">
        <Button
          variant="ghost"
          size="sm"
          className="mb-2 -ml-2"
          onClick={() => navigate('/savings')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t('savings.title')}
        </Button>
        <h2 className="text-2xl font-bold tracking-tight mb-1 sm:text-3xl sm:mb-2 flex items-center gap-2">
          <FileText className="h-6 w-6 sm:h-8 sm:w-8" />
          {t('savings.reports.title')}
        </h2>
        <p className="text-sm text-muted-foreground sm:text-base">
          {t('savings.reports.subtitle')}
        </p>
        <div className="mt-3">
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerateNow}
            disabled={generateReport.isPending}
          >
            <RefreshCw className={`h-4 w-4 ${generateReport.isPending ? 'animate-spin' : ''}`} />
            {generateReport.isPending
              ? t('savings.reports.generating')
              : t('savings.reports.generateNow')}
          </Button>
        </div>
      </div>

      {/* Month selector */}
      {reportList && reportList.length > 0 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {reportList.map((item) => {
            const isSelected = item.year === effectiveYear && item.month === effectiveMonth
            return (
              <Button
                key={`${item.year}-${item.month}`}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                className="whitespace-nowrap"
                onClick={() => {
                  setSelectedYear(item.year)
                  setSelectedMonth(item.month)
                }}
              >
                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                {monthNames[item.month - 1]} {item.year}
              </Button>
            )
          })}
        </div>
      )}

      {listLoading || reportLoading ? (
        <div className="text-center py-12 text-muted-foreground">{t('common.loading')}</div>
      ) : !reportList?.length && !effectiveYear ? (
        <div className="space-y-4">
          <div className="text-center py-16 space-y-3">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">{t('savings.reports.empty')}</p>
          </div>
          <SavingsCopilot year={copilotYear} month={copilotMonth} />
        </div>
      ) : data ? (
        <div className="space-y-4">
          <SavingsCopilot year={copilotYear} month={copilotMonth} />

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase mb-1">{t('savings.reports.income')}</p>
                <p className="text-lg font-bold">
                  {data.income ? `${formatAmount(data.income.amount)} ${data.income.currency}` : t('savings.reports.noIncome')}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase mb-1">{t('savings.reports.spent')}</p>
                <p className="text-lg font-bold">
                  {data.totalSpent.length > 0
                    ? data.totalSpent.map((s) => `${formatAmount(s.amount)} ${s.currency}`).join(' + ')
                    : '0'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase mb-1">{t('savings.reports.saved')}</p>
                <p className={`text-lg font-bold ${(data.savedAmount ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {data.savedAmount !== null ? `${formatAmount(data.savedAmount)} ${data.income?.currency || ''}` : '-'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase mb-1">{t('savings.reports.rate')}</p>
                <p className={`text-lg font-bold ${(data.savingsRate ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {data.savingsRate !== null ? `${data.savingsRate}%` : '-'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Comparison chip */}
          {data.comparison?.spendingChange !== null && data.comparison?.spendingChange !== undefined && (
            <div className="flex justify-center">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                data.comparison.spendingChange > 0
                  ? 'bg-red-500/10 text-red-500'
                  : 'bg-green-500/10 text-green-500'
              }`}>
                {data.comparison.spendingChange > 0 ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {data.comparison.spendingChange > 0 ? '+' : ''}{data.comparison.spendingChange}% {t('savings.reports.vsLastMonth')}
              </div>
            </div>
          )}

          {/* Top categories */}
          {data.topCategories.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase">
                  {t('savings.reports.topCategories')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.topCategories.map((cat, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate">{cat.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {formatAmount(cat.amount)} {cat.currency}
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{cat.percentage}%</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Goals progress */}
          {data.goals.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase flex items-center gap-1.5">
                  <Target className="h-4 w-4" />
                  {t('savings.reports.goalsProgress')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.goals.map((goal, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{goal.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatAmount(goal.currentAmount)}/{formatAmount(goal.targetAmount)} {goal.currency}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          goal.isCompleted ? 'bg-green-500' : goal.progressPercent >= 75 ? 'bg-blue-500' : 'bg-muted-foreground'
                        }`}
                        style={{ width: `${Math.min(goal.progressPercent, 100)}%` }}
                      />
                    </div>
                    {goal.contributionsThisMonth > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        +{formatAmount(goal.contributionsThisMonth)} {goal.currency} {t('savings.reports.thisMonth')}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* AI narrative */}
          {report?.aiNarrative && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {t('savings.reports.aiSummary')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground italic">{report.aiNarrative}</p>
              </CardContent>
            </Card>
          )}

          {/* AI tips */}
          {report?.aiTips && report.aiTips.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  {t('savings.reports.aiTips')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.aiTips.map((tip, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="text-primary mb-1">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}
    </AppLayout>
  )
}
