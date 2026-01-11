import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, TrendingUp, Check, Target } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Progress } from '@/components/ui/progress'

interface CategorizationAccuracy {
  totalSuggestions: number
  acceptedSuggestions: number
  acceptanceRate: number
  averageConfidence: number
  topPerformingCategories: Array<{
    categoryId: string
    categoryName: string
    acceptanceRate: number
    totalSuggestions: number
  }>
}

export function CategoryInsights() {
  const { t } = useTranslation()

  const { data, isLoading, isError } = useQuery<CategorizationAccuracy>({
    queryKey: ['categorization-accuracy'],
    queryFn: async () => {
      try {
        // api.get already returns response.data, not the full AxiosResponse
        return await api.get<CategorizationAccuracy>('/dashboard/categorization-accuracy')
      } catch (error) {
        console.error('Failed to fetch categorization accuracy:', error)
        // Return default empty data instead of throwing
        return {
          totalSuggestions: 0,
          acceptedSuggestions: 0,
          acceptanceRate: 0,
          averageConfidence: 0,
          topPerformingCategories: []
        }
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry on error
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            {t('categorization.insights.title', 'AI Categorization Insights')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-16 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
            <div className="h-16 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isError || !data || data.totalSuggestions === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            {t('categorization.insights.title', 'AI Categorization Insights')}
          </CardTitle>
          <CardDescription>
            {t(
              'categorization.insights.noData',
              'No categorization data yet. Scan some receipts to see AI suggestions!'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-4">
            <Sparkles className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            {t(
              'categorization.insights.helpText',
              'The AI learns from your categorization choices and will start suggesting categories automatically.'
            )}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          {t('categorization.insights.title', 'AI Categorization Insights')}
        </CardTitle>
        <CardDescription>
          {t(
            'categorization.insights.description',
            'See how well the AI is learning your categorization patterns'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Acceptance Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">
                {t('categorization.insights.acceptanceRate', 'Acceptance Rate')}
              </span>
            </div>
            <Badge variant={data.acceptanceRate >= 70 ? 'default' : 'secondary'} className="ml-2">
              {data.acceptanceRate}%
            </Badge>
          </div>
          <Progress value={data.acceptanceRate} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {t(
              'categorization.insights.acceptanceRateDesc',
              '{{accepted}} out of {{total}} suggestions accepted',
              {
                accepted: data.acceptedSuggestions,
                total: data.totalSuggestions,
              }
            )}
          </p>
        </div>

        {/* Average Confidence */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">
                {t('categorization.insights.avgConfidence', 'Average Confidence')}
              </span>
            </div>
            <Badge variant="outline" className="ml-2">
              {data.averageConfidence}%
            </Badge>
          </div>
          <Progress value={data.averageConfidence} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {t(
              'categorization.insights.avgConfidenceDesc',
              'Higher confidence means more accurate predictions'
            )}
          </p>
        </div>

        {/* Top Performing Categories */}
        {data.topPerformingCategories.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">
                {t('categorization.insights.topCategories', 'Top Performing Categories')}
              </span>
            </div>
            <div className="space-y-2">
              {data.topPerformingCategories.map((category: {
                categoryId: string
                categoryName: string
                acceptanceRate: number
                totalSuggestions: number
              }) => (
                <div
                  key={category.categoryId}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {category.categoryName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {category.totalSuggestions}{' '}
                      {t('categorization.insights.suggestions', 'suggestions')}
                    </p>
                  </div>
                  <Badge
                    variant={category.acceptanceRate >= 70 ? 'default' : 'secondary'}
                    className="ml-2"
                  >
                    {category.acceptanceRate}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

