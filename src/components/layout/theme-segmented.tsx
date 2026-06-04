import { Sun, Moon, Monitor, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSettingsStore, type Theme } from '@/store/settings'
import { cn } from '@/lib/utils'

interface ThemeSegmentedProps {
  /**
   * Show the Light / Dark / System text label beside each icon (settings row).
   * Default false = compact icon-only pill (sidebar / popover).
   */
  labeled?: boolean
  className?: string
}

/** Light / Dark / System segmented control — wired to the settings store. */
export function ThemeSegmented({ labeled = false, className }: ThemeSegmentedProps) {
  const { t } = useTranslation()
  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const opts: { value: Theme; icon: LucideIcon; label: string }[] = [
    { value: 'light', icon: Sun, label: t('settings.appearance.light') },
    { value: 'dark', icon: Moon, label: t('settings.appearance.dark') },
    { value: 'system', icon: Monitor, label: t('settings.appearance.system') },
  ]
  return (
    <span
      role="group"
      aria-label={t('settings.appearance.theme')}
      className={cn(
        'inline-flex shrink-0 gap-0.5 rounded-full border border-hairline-soft bg-bg-subtle p-[3px]',
        className,
      )}
    >
      {opts.map(({ value, icon: Icon, label }) => {
        const active = theme === value
        return (
          <button
            key={value}
            type="button"
            title={label}
            aria-pressed={active}
            onClick={() => setTheme(value)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-full transition-colors',
              labeled ? 'h-9 px-3.5 text-[13px] font-semibold' : 'h-[26px] w-7',
              active
                ? 'bg-card text-foreground shadow-glass-1'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-3.5" />
            {labeled && <span>{label}</span>}
          </button>
        )
      })}
    </span>
  )
}
