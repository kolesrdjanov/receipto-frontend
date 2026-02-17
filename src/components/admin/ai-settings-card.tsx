import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useAppSettings, useUpdateAppSettings } from '@/hooks/admin/use-app-settings'
import { Bot, Sparkles, Loader2, TrendingUp } from 'lucide-react'

export function AiSettingsCard() {
  const { t } = useTranslation()
  const { data: settings, isLoading } = useAppSettings()
  const updateSettings = useUpdateAppSettings()

  const aiCoachEnabled = settings?.ai_coach_enabled?.value ?? true
  const aiCategorizationEnabled = settings?.ai_categorization_enabled?.value ?? true
  const aiItemsEnabled = settings?.ai_items_enabled?.value ?? true

  const handleToggle = (key: string, value: boolean) => {
    updateSettings.mutate({ [key]: value }, {
      onSuccess: () => {
        toast.success(t('admin.settings.updated'))
      },
      onError: () => {
        toast.error(t('common.error'))
      },
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          {t('admin.settings.aiFeatures')}
        </CardTitle>
        <CardDescription>
          {t('admin.settings.aiDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-amber-500" />
              {t('admin.settings.aiCoach')}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t('admin.settings.aiCoachDescription')}
            </p>
          </div>
          <Switch
            checked={aiCoachEnabled}
            onCheckedChange={(checked) => handleToggle('ai_coach_enabled', checked)}
            disabled={updateSettings.isPending}
          />
        </div>

        <div className="h-px bg-border" />

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Bot className="h-4 w-4 text-blue-500" />
              {t('admin.settings.aiCategorization')}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t('admin.settings.aiCategorizationDescription')}
            </p>
          </div>
          <Switch
            checked={aiCategorizationEnabled}
            onCheckedChange={(checked) => handleToggle('ai_categorization_enabled', checked)}
            disabled={updateSettings.isPending}
          />
        </div>

        <div className="h-px bg-border" />

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4 text-green-500" />
              {t('admin.settings.aiItems')}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t('admin.settings.aiItemsDescription')}
            </p>
          </div>
          <Switch
            checked={aiItemsEnabled}
            onCheckedChange={(checked) => handleToggle('ai_items_enabled', checked)}
            disabled={updateSettings.isPending}
          />
        </div>
      </CardContent>
    </Card>
  )
}
