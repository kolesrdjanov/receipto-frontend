import { create } from 'zustand'

/**
 * Lets the active page take over the global mobile FAB (the gradient "+" in the tab
 * bar). A page registers its primary create action on mount and clears it on unmount;
 * the tab bar invokes it when present, otherwise falls back to its default route.
 */
interface FabState {
  action: (() => void) | null
  setFab: (action: (() => void) | null) => void
  clearFab: () => void
}

export const useFabStore = create<FabState>((set) => ({
  action: null,
  setFab: (action) => set({ action }),
  clearFab: () => set({ action: null }),
}))
