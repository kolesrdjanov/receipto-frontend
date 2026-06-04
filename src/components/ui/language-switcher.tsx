import { Globe, ChevronDown } from 'lucide-react'
import { useSettingsStore, type Language } from '@/store/settings'
import { useUpdateMe } from '@/hooks/users/use-me'
import { cn } from '@/lib/utils'

interface LanguageSwitcherProps {
  /** Globe-only icon button (collapsed sidebar rail). */
  compact?: boolean
  /** Single toggle pill: globe + current language + chevron. */
  pill?: boolean
  /** Full-width "chip" matching the sidebar footChip (border + card bg) — for the More drawer. */
  chip?: boolean
  /** Stretch the pill to fill its container (sidebar header). */
  fullWidth?: boolean
  /** Show the short code (EN/SR) instead of the full name (tight mobile header). */
  abbreviated?: boolean
  syncBackend?: boolean
  className?: string
}

const languages: { value: Language; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'sr', label: 'SR' },
]

export function LanguageSwitcher({
  compact,
  pill,
  chip,
  fullWidth,
  abbreviated,
  syncBackend = true,
  className,
}: LanguageSwitcherProps) {
  const language = useSettingsStore((s) => s.language)
  const setLanguage = useSettingsStore((s) => s.setLanguage)
  const updateMe = useUpdateMe()

  const handleSwitch = (lang: Language) => {
    if (lang === language) return
    setLanguage(lang)
    if (syncBackend) {
      updateMe.mutate({ preferredLanguage: lang })
    }
  }

  const handleToggle = () => {
    handleSwitch(language === 'en' ? 'sr' : 'en')
  }

  if (compact) {
    return (
      <button
        onClick={handleToggle}
        className={cn(
          'flex items-center justify-center size-8 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors',
          className
        )}
        aria-label="Switch language"
        title={language === 'en' ? 'Prebaci na srpski' : 'Switch to English'}
      >
        <Globe className="size-4" />
      </button>
    )
  }

  if (chip) {
    const label = language === 'en' ? 'English' : 'Srpski'
    return (
      <button
        onClick={handleToggle}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-xl border border-hairline-soft bg-card px-3 py-2.5 text-[13.5px] font-semibold text-fg-2 transition-colors hover:bg-bg-subtle',
          className,
        )}
        aria-label={language === 'en' ? 'Prebaci na srpski' : 'Switch to English'}
      >
        <Globe className="size-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate text-left">{label}</span>
        <ChevronDown className="size-3.5 shrink-0 text-fg-faint" />
      </button>
    )
  }

  if (pill) {
    const label = abbreviated
      ? language === 'en' ? 'EN' : 'SR'
      : language === 'en' ? 'English' : 'Srpski'
    return (
      <button
        onClick={handleToggle}
        className={cn(
          'flex h-[34px] items-center gap-1.5 rounded-full border border-hairline-soft bg-bg-subtle px-3 text-[13px] font-semibold text-fg-2 transition-colors hover:bg-hairline-soft',
          fullWidth && 'w-full',
          className,
        )}
        aria-label={language === 'en' ? 'Prebaci na srpski' : 'Switch to English'}
      >
        <Globe className="size-3.5 shrink-0" />
        <span className={cn('truncate', fullWidth && 'flex-1 text-left')}>{label}</span>
        <ChevronDown className="size-3.5 shrink-0 text-fg-faint" />
      </button>
    )
  }

  return (
    <div className={cn('flex items-center gap-1 text-xs font-medium', className)}>
      {languages.map((lang, index) => (
        <span key={lang.value} className="flex items-center gap-1">
          {index > 0 && <span className="text-muted-foreground/50">/</span>}
          <button
            onClick={() => handleSwitch(lang.value)}
            className={cn(
              'px-1.5 py-0.5 rounded transition-colors',
              language === lang.value
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground'
            )}
            aria-label={lang.value === 'en' ? 'Switch to English' : 'Prebaci na srpski'}
          >
            {lang.label}
          </button>
        </span>
      ))}
    </div>
  )
}
