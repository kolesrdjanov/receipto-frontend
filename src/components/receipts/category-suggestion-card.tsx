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
    <div className="rounded-[14px] border border-brand-violet-foreground/10 bg-brand-violet-soft/70 px-3.5 py-3 space-y-2.5">
      <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-brand-violet-foreground">
        <Sparkles className="h-3.5 w-3.5 shrink-0" />
        {t('categorization.aiSuggestion', 'AI Category Suggestion')}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {suggestion.categoryIcon && (
            <span
              className="text-[15px] leading-none shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-bg-subtle"
              style={suggestion.categoryColor ? { backgroundColor: suggestion.categoryColor + '24' } : undefined}
            >
              {suggestion.categoryIcon}
            </span>
          )}
          <span className="text-[14.5px] font-semibold text-foreground truncate">
            {suggestion.categoryName}
          </span>
          <Badge
            variant="secondary"
            className="text-[10.5px] font-semibold px-2 py-0.5 shrink-0 rounded-full bg-brand-violet/15 text-brand-violet-foreground border-0"
          >
            {suggestion.confidence}%
          </Badge>
        </div>

        {isAlreadySelected ? (
          <div className="flex items-center gap-1 text-[12.5px] font-semibold text-success-foreground shrink-0">
            <Check className="h-[15px] w-[15px]" />
            <span>{t('categorization.selected', 'Selected')}</span>
          </div>
        ) : (
          <Button
            type="button"
            variant="brand-violet"
            onClick={() => onAccept(suggestion.categoryId)}
            disabled={disabled}
            className="text-[12.5px] font-semibold h-[31px] px-4 shrink-0 rounded-full"
          >
            {t('categorization.apply', 'Apply')}
          </Button>
        )}
      </div>

      {suggestion.reason && (
        <p className="text-[11.5px] leading-relaxed text-muted-foreground">
          {suggestion.reason}
        </p>
      )}
    </div>
  )
}
