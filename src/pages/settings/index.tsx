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
import { useSettingsStore, type Currency, type Theme } from '@/store/settings'
import { Settings as SettingsIcon, Palette, DollarSign } from 'lucide-react'

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

export default function Settings() {
  const { currency, theme, setCurrency, setTheme } = useSettingsStore()

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
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <Label htmlFor="theme">Theme</Label>
                <p className="text-sm text-muted-foreground">
                  Select your preferred color theme
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

