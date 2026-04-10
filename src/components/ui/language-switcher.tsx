import { Globe } from 'lucide-react'
import { useSettingsStore, type Language } from '@/store/settings'
import { useUpdateMe } from '@/hooks/users/use-me'
import { cn } from '@/lib/utils'

interface LanguageSwitcherProps {
  compact?: boolean
  syncBackend?: boolean
  className?: string
}

const languages: { value: Language; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'sr', label: 'SR' },
]

export function LanguageSwitcher({ compact, syncBackend = true, className }: LanguageSwitcherProps) {
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
