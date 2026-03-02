import type { ReactNode } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { useDashboardStore } from '@/store/dashboard'
import { WidgetWrapper } from './widget-wrapper'

interface WidgetRendererProps {
  widgetContent: Record<string, ReactNode>
}

export function WidgetRenderer({ widgetContent }: WidgetRendererProps) {
  const { widgetOrder, setWidgetOrder, isEditMode } = useDashboardStore()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = widgetOrder.indexOf(active.id as string)
    const newIndex = widgetOrder.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return

    setWidgetOrder(arrayMove(widgetOrder, oldIndex, newIndex))
  }

  // Only render widgets that have content
  const renderableWidgets = widgetOrder.filter(id => widgetContent[id] !== undefined)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={renderableWidgets} strategy={verticalListSortingStrategy}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {renderableWidgets.map(id => (
            <WidgetWrapper key={id} id={id} isEditMode={isEditMode}>
              {widgetContent[id]}
            </WidgetWrapper>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
