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
    if (confidence >= 80) return 'default'
    if (confidence >= 60) return 'secondary'
    return 'outline'
  }

  return (
    <Card className="p-3 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
      <div className="flex items-start gap-2">
        <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-md shrink-0">
          <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {t('categorization.aiSuggestion', 'AI Category Suggestion')}
          </p>

          {suggestions.slice(0, 1).map((suggestion) => {
            const isAlreadySelected = suggestion.categoryId === currentCategoryId

            return (
              <div
                key={suggestion.categoryId}
                className={`flex items-center gap-2 p-2 rounded-md border transition-colors ${
                  isAlreadySelected
                    ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                {suggestion.categoryIcon && (
                  <span className="text-base shrink-0">{suggestion.categoryIcon}</span>
                )}
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate flex-1">
                  {suggestion.categoryName}
                </span>
                <Badge
                  variant={getConfidenceBadgeVariant(suggestion.confidence)}
                  className="text-[10px] px-1.5 py-0 shrink-0"
                >
                  {suggestion.confidence}%
                </Badge>

                {isAlreadySelected ? (
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => onAccept(suggestion.categoryId)}
                    disabled={disabled}
                    className="text-xs h-6 px-2 shrink-0"
                  >
                    {t('categorization.apply', 'Apply')}
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
