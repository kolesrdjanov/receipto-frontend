import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSettingsStore, type Currency, type Theme, type AccentColor } from '@/store/settings'
import { Settings as SettingsIcon, Palette, DollarSign, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const currencies: { value: Currency; label: string; symbol: string }[] = [
  { value: 'RSD', label: 'Serbian Dinar', symbol: 'РСД' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'USD', label: 'US Dollar', symbol: '$' },
  { value: 'BAM', label: 'Convertible Mark', symbol: 'KM' },
]

const themes: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

const accentColors: { value: AccentColor; label: string; color: string }[] = [
  { value: 'zinc', label: 'Zinc', color: 'bg-zinc-600' },
  { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
  { value: 'green', label: 'Green', color: 'bg-green-500' },
  { value: 'purple', label: 'Purple', color: 'bg-purple-500' },
  { value: 'orange', label: 'Orange', color: 'bg-orange-500' },
  { value: 'rose', label: 'Rose', color: 'bg-rose-500' },
]

export default function Settings() {
  const { currency, theme, accentColor, setCurrency, setTheme, setAccentColor } = useSettingsStore()

  return (
    <AppLayout>
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl font-bold tracking-tight mb-1 sm:text-3xl sm:mb-2 flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 sm:h-8 sm:w-8" />
          Settings
        </h2>
        <p className="text-sm text-muted-foreground sm:text-base">
          Manage your application preferences
        </p>
      </div>

      <div className="grid gap-6">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize how the application looks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <Label htmlFor="theme">Theme</Label>
                <p className="text-sm text-muted-foreground">
                  Select light or dark mode
                </p>
              </div>
              <Select value={theme} onValueChange={(value: Theme) => setTheme(value)}>
                <SelectTrigger id="theme" className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  {themes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="space-y-0.5">
                <Label>Accent Color</Label>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred accent color
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {accentColors.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setAccentColor(c.value)}
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center transition-all',
                      c.color,
                      accentColor === c.value
                        ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110'
                        : 'hover:scale-101'
                    )}
                    title={c.label}
                  >
                    {accentColor === c.value && (
                      <Check className="h-5 w-5 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Currency */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Currency
            </CardTitle>
            <CardDescription>
              Set your preferred currency for displaying amounts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <Label htmlFor="currency">Display Currency</Label>
                <p className="text-sm text-muted-foreground">
                  Choose which currency to use throughout the app
                </p>
              </div>
              <Select value={currency} onValueChange={(value: Currency) => setCurrency(value)}>
                <SelectTrigger id="currency" className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-muted-foreground">{c.symbol}</span>
                        {c.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

