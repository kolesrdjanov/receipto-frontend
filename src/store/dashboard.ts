import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  DEFAULT_WIDGET_ORDER,
  DEFAULT_WIDGET_VISIBILITY,
  DEFAULT_WIDGET_SIZES,
  WIDGET_DEFINITIONS,
} from '@/components/dashboard/widget-registry'

interface DashboardState {
  widgetOrder: string[]
  widgetVisibility: Record<string, boolean>
  widgetSizes: Record<string, number>
  isEditMode: boolean

  setWidgetOrder: (order: string[]) => void
  setWidgetVisible: (id: string, visible: boolean) => void
  setWidgetSize: (id: string, size: number) => void
  toggleEditMode: () => void
  setEditMode: (editing: boolean) => void
  resetToDefault: () => void
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      widgetOrder: DEFAULT_WIDGET_ORDER,
      widgetVisibility: DEFAULT_WIDGET_VISIBILITY,
      widgetSizes: DEFAULT_WIDGET_SIZES,
      isEditMode: false,

      setWidgetOrder: (order) => set({ widgetOrder: order }),

      setWidgetVisible: (id, visible) =>
        set((state) => ({
          widgetVisibility: { ...state.widgetVisibility, [id]: visible },
        })),

      setWidgetSize: (id, size) =>
        set((state) => ({
          widgetSizes: { ...state.widgetSizes, [id]: size },
        })),

      toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),

      setEditMode: (editing) => set({ isEditMode: editing }),

      resetToDefault: () =>
        set({
          widgetOrder: DEFAULT_WIDGET_ORDER,
          widgetVisibility: DEFAULT_WIDGET_VISIBILITY,
          widgetSizes: DEFAULT_WIDGET_SIZES,
        }),
    }),
    {
      name: 'receipto-dashboard-v2',
      partialize: (state) => ({
        widgetOrder: state.widgetOrder,
        widgetVisibility: state.widgetVisibility,
        widgetSizes: state.widgetSizes,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return

        const knownIds = new Set(WIDGET_DEFINITIONS.map(w => w.id))
        const storedIds = new Set(state.widgetOrder)

        // Remove IDs that no longer exist in definitions
        const cleanedOrder = state.widgetOrder.filter(id => knownIds.has(id))

        // Append new widgets not yet in stored order
        for (const def of WIDGET_DEFINITIONS) {
          if (!storedIds.has(def.id)) {
            cleanedOrder.push(def.id)
          }
        }

        // Ensure visibility entries exist for all widgets
        const cleanedVisibility = { ...state.widgetVisibility }
        for (const def of WIDGET_DEFINITIONS) {
          if (cleanedVisibility[def.id] === undefined) {
            cleanedVisibility[def.id] = def.defaultVisible
          }
        }
        for (const id of Object.keys(cleanedVisibility)) {
          if (!knownIds.has(id)) {
            delete cleanedVisibility[id]
          }
        }

        // Ensure size entries exist for all widgets
        const cleanedSizes = { ...(state.widgetSizes || {}) }
        for (const def of WIDGET_DEFINITIONS) {
          if (cleanedSizes[def.id] === undefined) {
            cleanedSizes[def.id] = def.defaultSize
          }
        }
        for (const id of Object.keys(cleanedSizes)) {
          if (!knownIds.has(id)) {
            delete cleanedSizes[id]
          }
        }

        state.widgetOrder = cleanedOrder
        state.widgetVisibility = cleanedVisibility
        state.widgetSizes = cleanedSizes
      },
    }
  )
)
