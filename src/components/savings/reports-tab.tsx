import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Target,
  Sparkles,
  Lightbulb,
  Calendar,
} from 'lucide-react'
import { useReportList, useReport } from '@/hooks/savings/use-reports'
import { formatAmount } from '@/lib/utils'

function getMonthName(month: number, language: string): string {
  const date = new Date(2000, month - 1, 1)
  return date.toLocaleString(language === 'sr' ? 'sr-Latn' : 'en-US', { month: 'long' })
}

export function ReportsTab() {
  const { t, i18n } = useTranslation()
  const now = new Date()

  const { isLoading: listLoading } = useReportList()

  // Build last 12 months as selectable options
  const availableMonths = (() => {
    const months: { year: number; month: number }[] = []
    const current = new Date(now.getFullYear(), now.getMonth(), 1)
    for (let i = 0; i < 12; i++) {
      months.push({ year: current.getFullYear(), month: current.getMonth() + 1 })
      current.setMonth(current.getMonth() - 1)
    }
    return months
  })()

  const [selectedYear, setSelectedYear] = useState(availableMonths[0].year)
  const [selectedMonth, setSelectedMonth] = useState(availableMonths[0].month)

  const { data: report, isLoading: reportLoading } = useReport(selectedYear, selectedMonth)

  const data = report?.data

  if (listLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t('common.loading', 'Loading...')}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Month selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {availableMonths.map((item) => {
          const isSelected = item.year === selectedYear && item.month === selectedMonth
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
              {getMonthName(item.month, i18n.language)} {item.year}
            </Button>
          )
        })}
      </div>

      {/* Loading state for selected report */}
      {reportLoading && (
        <div className="text-center py-12 text-muted-foreground">
          {t('savings.reports.generating', 'Generating...')}
        </div>
      )}

      {/* No report for this month yet */}
      {!reportLoading && !data && (
        <div className="text-center py-12 space-y-3">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {t('savings.reports.noReport', 'No report for this month yet')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('savings.reports.autoGenerate', 'Reports are generated automatically when you select a month. Try refreshing.')}
          </p>
        </div>
      )}

      {data && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase mb-1">
                  {t('savings.reports.income', 'Income')}
                </p>
                <p className="text-lg font-bold">
                  {data.income
                    ? `${formatAmount(Math.round(data.income.amount))} ${data.income.currency}`
                    : t('savings.reports.noIncome', 'Not set')}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase mb-1">
                  {t('savings.reports.spent', 'Spent')}
                </p>
                <p className="text-lg font-bold">
                  {data.totalSpent.length > 0
                    ? data.totalSpent
                        .map((s) => `${formatAmount(Math.round(s.amount))} ${s.currency}`)
                        .join(' + ')
                    : '0'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase mb-1">
                  {t('savings.reports.saved', 'Saved')}
                </p>
                <p
                  className={`text-lg font-bold ${(data.savedAmount ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}
                >
                  {data.savedAmount !== null
                    ? `${formatAmount(Math.round(data.savedAmount))} ${data.income?.currency || ''}`
                    : '-'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase mb-1">
                  {t('savings.reports.rate', 'Savings Rate')}
                </p>
                <p
                  className={`text-lg font-bold ${(data.savingsRate ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}
                >
                  {data.savingsRate !== null ? `${data.savingsRate}%` : '-'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Comparison chip */}
          {data.comparison?.spendingChange !== null &&
            data.comparison?.spendingChange !== undefined && (
              <div className="flex justify-center">
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                    data.comparison.spendingChange > 0
                      ? 'bg-red-500/10 text-red-500'
                      : 'bg-green-500/10 text-green-500'
                  }`}
                >
                  {data.comparison.spendingChange > 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  {data.comparison.spendingChange > 0 ? '+' : ''}
                  {data.comparison.spendingChange}% {t('savings.reports.vsLastMonth', 'vs last month')}
                </div>
              </div>
            )}

          {/* Top categories */}
          {data.topCategories.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase">
                  {t('savings.reports.topCategories', 'Top Categories')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.topCategories.map((cat, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate">{cat.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {formatAmount(Math.round(cat.amount))} {cat.currency}
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">
                      {cat.percentage}%
                    </span>
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
                  {t('savings.reports.goalsProgress', 'Savings Goals')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.goals.map((goal, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{goal.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatAmount(Math.round(goal.currentAmount))}/
                        {formatAmount(Math.round(goal.targetAmount))} {goal.currency}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          goal.isCompleted
                            ? 'bg-green-500'
                            : goal.progressPercent >= 75
                              ? 'bg-blue-500'
                              : 'bg-muted-foreground'
                        }`}
                        style={{ width: `${Math.min(goal.progressPercent, 100)}%` }}
                      />
                    </div>
                    {goal.contributionsThisMonth > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        +{formatAmount(Math.round(goal.contributionsThisMonth))} {goal.currency}{' '}
                        {t('savings.reports.thisMonth', 'this month')}
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
                  {t('savings.reports.aiSummary', 'AI Summary')}
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
                  {t('savings.reports.aiTips', 'Tips')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.aiTips.map((tip, i) => (
                    <li
                      key={i}
                      className="text-sm text-muted-foreground flex items-center gap-2"
                    >
                      <span className="text-primary mb-1">·</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
