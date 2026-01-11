import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Sparkles, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface CategorySuggestion {
  categoryId: string
  categoryName: string
  categoryIcon?: string
  categoryColor?: string
  confidence: number
  reason?: string
}

interface CategorySuggestionCardProps {
  suggestions: CategorySuggestion[]
  currentCategoryId?: string
  onAccept: (categoryId: string) => void
  disabled?: boolean
}

export function CategorySuggestionCard({
  suggestions,
  currentCategoryId,
  onAccept,
  disabled = false,
}: CategorySuggestionCardProps) {
  const { t } = useTranslation()

  if (suggestions.length === 0) return null

  const getConfidenceBadgeVariant = (confidence: number) => {
    if (confidence >= 80) return 'default' // High confidence - green
    if (confidence >= 60) return 'secondary' // Medium confidence - blue
    return 'outline' // Low confidence - gray
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return t('categorization.highConfidence', 'High')
    if (confidence >= 60) return t('categorization.mediumConfidence', 'Medium')
    return t('categorization.lowConfidence', 'Low')
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
          <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {t('categorization.aiSuggestion', 'AI Category Suggestion')}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              {t('categorization.basedOnPurchases', 'Based on your previous purchases and merchant data')}
            </p>
          </div>

          <div className="space-y-2">
            {suggestions.slice(0, 3).map((suggestion, index) => {
              const isAlreadySelected = suggestion.categoryId === currentCategoryId

              return (
                <div
                  key={suggestion.categoryId}
                  className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                    isAlreadySelected
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1">
                    {suggestion.categoryIcon && (
                      <span className="text-lg">{suggestion.categoryIcon}</span>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {suggestion.categoryName}
                        </span>
                        {index === 0 && (
                          <Badge
                            variant={getConfidenceBadgeVariant(suggestion.confidence)}
                            className="text-xs"
                          >
                            {getConfidenceLabel(suggestion.confidence)} {suggestion.confidence}%
                          </Badge>
                        )}
                      </div>
                      {suggestion.reason && index === 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {suggestion.reason}
                        </p>
                      )}
                    </div>
                  </div>

                  {isAlreadySelected ? (
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <Check className="h-4 w-4" />
                      <span className="text-xs font-medium">
                        {t('categorization.selected', 'Selected')}
                      </span>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => onAccept(suggestion.categoryId)}
                      disabled={disabled}
                      className="text-xs h-7"
                    >
                      {t('categorization.apply', 'Apply')}
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Card>
  )
}

