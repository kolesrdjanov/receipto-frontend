import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Currency is now a runtime string to support dynamic currencies from the backend
// Default/fallback currencies: 'RSD' | 'EUR' | 'USD' | 'BAM'
export type Currency = string
export type Theme = 'light' | 'dark' | 'system'
export type AccentColor = 'zinc' | 'blue' | 'green' | 'purple' | 'orange' | 'rose'

interface SettingsState {
  currency: Currency
  theme: Theme
  accentColor: AccentColor
  setCurrency: (currency: Currency) => void
  setTheme: (theme: Theme) => void
  setAccentColor: (color: AccentColor) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      currency: 'RSD',
      theme: 'system',
      accentColor: 'zinc',
      setCurrency: (currency) => set({ currency }),
      setTheme: (theme) => {
        set({ theme })
        applyTheme(theme)
      },
      setAccentColor: (accentColor) => {
        set({ accentColor })
        applyAccentColor(accentColor)
      },
    }),
    {
      name: 'receipto-settings',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.theme)
          applyAccentColor(state.accentColor)
        }
      },
    }
  )
)

function applyTheme(theme: Theme) {
  const root = window.document.documentElement

  root.classList.remove('light', 'dark')

  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
    root.classList.add(systemTheme)
  } else {
    root.classList.add(theme)
  }
}

function applyAccentColor(color: AccentColor) {
  const root = window.document.documentElement

  root.classList.remove('accent-zinc', 'accent-blue', 'accent-green', 'accent-purple', 'accent-orange', 'accent-rose')

  root.classList.add(`accent-${color}`)
}

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

