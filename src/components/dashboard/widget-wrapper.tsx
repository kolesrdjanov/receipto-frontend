import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getWidgetDefinition, WIDGET_SIZE_OPTIONS } from './widget-registry'
import { useDashboardStore } from '@/store/dashboard'

interface WidgetWrapperProps {
  id: string
  children: ReactNode
  isEditMode: boolean
}

export function WidgetWrapper({ id, children, isEditMode }: WidgetWrapperProps) {
  const { t } = useTranslation()
  const { widgetVisibility, widgetSizes, setWidgetVisible, setWidgetSize } = useDashboardStore()
  const definition = getWidgetDefinition(id)
  const isVisible = widgetVisibility[id] !== false
  const colSpan = widgetSizes[id] ?? definition?.defaultSize ?? 12

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditMode })

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    '--widget-span': colSpan,
  } as React.CSSProperties

  if (!isEditMode && !isVisible) return null

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        // Mobile: full width. Desktop: use custom property for span
        'col-span-full lg:[grid-column:span_var(--widget-span)]',
        isDragging && 'z-50 opacity-90',
        isEditMode && !isVisible && 'opacity-40',
        'relative',
      )}
      {...attributes}
    >
      {isEditMode && (
        <div className="absolute inset-0 border-2 border-dashed border-primary/30 rounded-xl z-10 pointer-events-none" />
      )}

      {isEditMode && (
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
          <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded">
            {t(definition?.nameKey || id)}
          </span>
          <button
            type="button"
            onClick={() => setWidgetVisible(id, !isVisible)}
            className="p-1.5 rounded-md bg-background border border-border hover:bg-muted transition-colors"
          >
            {isVisible ? (
              <Eye className="h-3.5 w-3.5 text-primary" />
            ) : (
              <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        </div>
      )}

      {isEditMode && (
        <div
          className="absolute top-1/2 left-2 -translate-y-1/2 z-20 p-1 rounded-md bg-background border border-border cursor-grab active:cursor-grabbing hover:bg-muted transition-colors"
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {/* Size selector — bottom center in edit mode */}
      {isEditMode && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-0.5 p-0.5 rounded-md bg-background border border-border">
          {WIDGET_SIZE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setWidgetSize(id, opt.value)}
              className={cn(
                'px-2 py-0.5 rounded text-xs font-medium transition-colors',
                colSpan === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      <div className="h-full [&>*]:h-full">
        {children}
      </div>
    </div>
  )
}
