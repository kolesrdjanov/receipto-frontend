import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Currency = 'RSD' | 'EUR' | 'USD' | 'BAM'
export type Theme = 'light' | 'dark' | 'system'

interface SettingsState {
  currency: Currency
  theme: Theme
  setCurrency: (currency: Currency) => void
  setTheme: (theme: Theme) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      currency: 'RSD',
      theme: 'system',
      setCurrency: (currency) => set({ currency }),
      setTheme: (theme) => {
        set({ theme })
        applyTheme(theme)
      },
    }),
    {
      name: 'receipto-settings',
      onRehydrateStorage: () => (state) => {
        // Primeni temu kada se store učita iz localStorage
        if (state) {
          applyTheme(state.theme)
        }
      },
    }
  )
)

function applyTheme(theme: Theme) {
  const root = window.document.documentElement

  // Ukloni postojeće klase
  root.classList.remove('light', 'dark')

  if (theme === 'system') {
    // Koristi system preferencu
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
    root.classList.add(systemTheme)
  } else {
    root.classList.add(theme)
  }
}

// Listener za system theme promene
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const currentTheme = useSettingsStore.getState().theme
    if (currentTheme === 'system') {
      const root = window.document.documentElement
      root.classList.remove('light', 'dark')
      root.classList.add(e.matches ? 'dark' : 'light')
    }
  })
}

