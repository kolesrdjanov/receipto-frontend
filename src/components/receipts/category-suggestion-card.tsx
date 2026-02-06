import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

  const suggestion = suggestions[0]
  const isAlreadySelected = suggestion.categoryId === currentCategoryId

  return (
    <div className="rounded-lg bg-purple-50/80 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40 px-3 py-2.5 space-y-2">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-purple-600 dark:text-purple-400">
        <Sparkles className="h-3 w-3 shrink-0" />
        {t('categorization.aiSuggestion', 'AI Category Suggestion')}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {suggestion.categoryIcon && (
            <span
              className="text-base leading-none shrink-0 w-7 h-7 flex items-center justify-center rounded-md"
              style={suggestion.categoryColor ? { backgroundColor: suggestion.categoryColor + '20' } : undefined}
            >
              {suggestion.categoryIcon}
            </span>
          )}
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {suggestion.categoryName}
          </span>
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 shrink-0 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-0"
          >
            {suggestion.confidence}%
          </Badge>
        </div>

        {isAlreadySelected ? (
          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 shrink-0">
            <Check className="h-3.5 w-3.5" />
            <span>{t('categorization.selected', 'Selected')}</span>
          </div>
        ) : (
          <Button
            type="button"
            size="sm"
            onClick={() => onAccept(suggestion.categoryId)}
            disabled={disabled}
            className="text-xs h-7 px-3 shrink-0 bg-purple-600 hover:bg-purple-700 text-white"
          >
            {t('categorization.apply', 'Apply')}
          </Button>
        )}
      </div>

      {suggestion.reason && (
        <p className="text-[11px] text-muted-foreground">
          {suggestion.reason}
        </p>
      )}
    </div>
  )
}
