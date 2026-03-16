import { useTranslation } from 'react-i18next'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { CurrencySelect } from '@/components/ui/currency-select'
import { User as UserIcon, Image as ImageIcon, Trash2, Save, Sparkles, Compass, Crown, MapPin, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import { useMe, useUpdateMe, useUploadProfileImage } from '@/hooks/users/use-me'
import { toast } from 'sonner'
import { useEffect, useMemo, useState, useRef } from 'react'
import { normalizeRank, getNextRank, getProgressToNextRank, type ReceiptRank } from '@/lib/rank'
import { useFeatureFlags } from '@/hooks/settings/use-feature-flags'

export default function ProfileSettings() {
  const { t } = useTranslation()
  const authUser = useAuthStore((s) => s.user)
  const { data: me } = useMe(true)
  const { data: featureFlags } = useFeatureFlags()
  const updateMe = useUpdateMe()
  const uploadProfileImage = useUploadProfileImage()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const effectiveUser = me ?? authUser
  const receiptCount = me?.receiptCount ?? 0
  const receiptRank = normalizeRank(me?.receiptRank as ReceiptRank | undefined, receiptCount)

  const rankConfig = useMemo(() => {
    const nextRank = getNextRank(receiptRank)
    const progress = getProgressToNextRank(receiptRank, receiptCount)

    const common = {
      progress,
      nextRankName: nextRank ? t(nextRank.nameKey) : t('settings.profile.rank.maxRank'),
      receiptsToNextRank: nextRank ? Math.max(nextRank.minReceipts - receiptCount, 0) : 0,
    }

    if (receiptRank === 'status_a') {
      return {
        name: t('settings.profile.rank.names.statusA'),
        description: t('settings.profile.rank.descriptions.statusA'),
        icon: Crown,
        iconClassName: 'text-amber-400',
        cardClassName: 'border-amber-400/30 bg-amber-500/10',
        ...common,
      }
    }

    if (receiptRank === 'status_b') {
      return {
        name: t('settings.profile.rank.names.statusB'),
        description: t('settings.profile.rank.descriptions.statusB', { remaining: common.receiptsToNextRank }),
        icon: Sparkles,
        iconClassName: 'text-blue-400',
        cardClassName: 'border-blue-400/30 bg-blue-500/10',
        ...common,
      }
    }

    if (receiptRank === 'status_c') {
      return {
        name: t('settings.profile.rank.names.statusC'),
        description: t('settings.profile.rank.descriptions.statusC', { remaining: common.receiptsToNextRank }),
        icon: Compass,
        iconClassName: 'text-emerald-400',
        cardClassName: 'border-emerald-400/30 bg-emerald-500/10',
        ...common,
      }
    }

    return {
      name: t('settings.profile.rank.names.noStatus'),
      description: t('settings.profile.rank.descriptions.noStatus', { remaining: common.receiptsToNextRank }),
      icon: Compass,
      iconClassName: 'text-muted-foreground',
      cardClassName: 'border-border bg-muted/20',
      ...common,
    }
  }, [receiptCount, receiptRank, t])

  const initial = useMemo(
    () => ({
      firstName: effectiveUser?.firstName ?? '',
      lastName: effectiveUser?.lastName ?? '',
      profileImageUrl: effectiveUser?.profileImageUrl ?? null,
      userId: effectiveUser?.id ?? null,
      street: me?.street ?? '',
      zipCode: me?.zipCode ?? '',
      city: me?.city ?? '',
      monthlyIncome: me?.monthlyIncome?.toString() ?? '',
      incomeCurrency: me?.incomeCurrency ?? '',
    }),
    [effectiveUser?.firstName, effectiveUser?.lastName, effectiveUser?.profileImageUrl, effectiveUser?.id, me?.street, me?.zipCode, me?.city, me?.monthlyIncome, me?.incomeCurrency]
  )

  const [draft, setDraft] = useState<{ firstName: string; lastName: string; street: string; zipCode: string; city: string; monthlyIncome: string; incomeCurrency: string }>(() => ({
    firstName: initial.firstName,
    lastName: initial.lastName,
    street: initial.street,
    zipCode: initial.zipCode,
    city: initial.city,
    monthlyIncome: initial.monthlyIncome,
    incomeCurrency: initial.incomeCurrency,
  }))

  const profileKey = initial.userId ?? 'no-user'

  useEffect(() => {
    if (me) {
      setDraft((prev) => ({
        ...prev,
        street: me.street ?? '',
        zipCode: me.zipCode ?? '',
        city: me.city ?? '',
        monthlyIncome: me.monthlyIncome?.toString() ?? '',
        incomeCurrency: me.incomeCurrency ?? '',
      }))
    }
  }, [me?.street, me?.zipCode, me?.city, me?.monthlyIncome, me?.incomeCurrency])

  const isDirty = draft.firstName !== initial.firstName || draft.lastName !== initial.lastName || draft.street !== initial.street || draft.zipCode !== initial.zipCode || draft.city !== initial.city || draft.monthlyIncome !== initial.monthlyIncome || draft.incomeCurrency !== initial.incomeCurrency

  const handleSaveProfile = async () => {
    if (!effectiveUser) return

    try {
      await updateMe.mutateAsync({
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        street: draft.street.trim(),
        zipCode: draft.zipCode.trim(),
        city: draft.city.trim(),
        monthlyIncome: draft.monthlyIncome ? Number(draft.monthlyIncome) : null,
        incomeCurrency: draft.incomeCurrency || null,
      })
      toast.success(t('settings.profile.saved'))
    } catch (err) {
      toast.error(t('settings.profile.saveError'), {
        description: err instanceof Error ? err.message : 'An error occurred',
      })
    }
  }

  const handleRemoveProfileImage = async () => {
    if (!effectiveUser) return

    try {
      await updateMe.mutateAsync({ removeProfileImage: true })
      toast.success(t('settings.profile.pictureRemoved'))
    } catch (err) {
      toast.error(t('settings.profile.saveError'), {
        description: err instanceof Error ? err.message : 'An error occurred',
      })
    }
  }

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
    if (!validTypes.includes(file.type)) {
      toast.error(t('settings.profile.invalidFileType'))
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('settings.profile.fileTooLarge'))
      return
    }

    try {
      await uploadProfileImage.mutateAsync(file)
      toast.success(t('settings.profile.pictureUploaded'))
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      toast.error(t('settings.profile.uploadError'), {
        description: err instanceof Error ? err.message : 'An error occurred',
      })
    }
  }

  return (
    <AppLayout>
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl font-bold tracking-tight mb-1 sm:text-3xl sm:mb-2 flex items-center gap-2">
          <UserIcon className="h-6 w-6 sm:h-8 sm:w-8" />
          {t('settings.profile.title')}
        </h2>
        <p className="text-sm text-muted-foreground sm:text-base">
          {t('settings.profile.description')}
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              {t('settings.profile.title')}
            </CardTitle>
            <CardDescription>
              {t('settings.profile.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4" key={profileKey}>
            {!effectiveUser ? (
              <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
            ) : (
              <>
                {/* Profile picture */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('settings.profile.picture')}</Label>
                    <p className="text-sm text-muted-foreground">{t('settings.profile.pictureHelp')}</p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <Avatar
                      firstName={effectiveUser.firstName}
                      lastName={effectiveUser.lastName}
                      imageUrl={effectiveUser.profileImageUrl}
                      size="2xl"
                    />

                    <div className="flex gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="default"
                        onClick={handleFileSelect}
                        disabled={uploadProfileImage.isPending}
                      >
                        <ImageIcon className="h-4 w-4" />
                        {uploadProfileImage.isPending ? t('common.uploading') : t('settings.profile.upload')}
                      </Button>

                      <Button
                        type="button"
                        variant="destructive"
                        size="default"
                        onClick={handleRemoveProfileImage}
                        disabled={!effectiveUser.profileImageUrl || updateMe.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                        {t('settings.profile.remove')}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Names */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t('settings.profile.firstName')}</Label>
                    <Input
                      id="firstName"
                      value={draft.firstName}
                      onChange={(e) => setDraft((p) => ({ ...p, firstName: e.target.value }))}
                      autoComplete="given-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t('settings.profile.lastName')}</Label>
                    <Input
                      id="lastName"
                      value={draft.lastName}
                      onChange={(e) => setDraft((p) => ({ ...p, lastName: e.target.value }))}
                      autoComplete="family-name"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">{t('settings.profile.email')}</Label>
                  <Input id="email" value={effectiveUser.email} disabled />
                </div>

                {/* Address */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-base font-medium">{t('settings.profile.address.title')}</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.profile.address.description')}
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="street">{t('settings.profile.address.street')}</Label>
                    <Input
                      id="street"
                      value={draft.street}
                      onChange={(e) => setDraft((p) => ({ ...p, street: e.target.value }))}
                      autoComplete="street-address"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">{t('settings.profile.address.zipCode')}</Label>
                      <Input
                        id="zipCode"
                        value={draft.zipCode}
                        onChange={(e) => setDraft((p) => ({ ...p, zipCode: e.target.value }))}
                        autoComplete="postal-code"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">{t('settings.profile.address.city')}</Label>
                      <Input
                        id="city"
                        value={draft.city}
                        onChange={(e) => setDraft((p) => ({ ...p, city: e.target.value }))}
                        autoComplete="address-level2"
                      />
                    </div>
                  </div>
                </div>

                {/* Income */}
                {(featureFlags?.savings ?? false) && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-base font-medium">{t('settings.profile.income')}</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.profile.incomeDescription')}
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="monthlyIncome">{t('settings.profile.incomeAmount')}</Label>
                      <Input
                        id="monthlyIncome"
                        type="number"
                        min="0"
                        step="0.01"
                        value={draft.monthlyIncome}
                        onChange={(e) => setDraft((p) => ({ ...p, monthlyIncome: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="incomeCurrency">{t('settings.profile.incomeCurrency')}</Label>
                      <CurrencySelect
                        id="incomeCurrency"
                        value={draft.incomeCurrency}
                        onValueChange={(v) => setDraft((p) => ({ ...p, incomeCurrency: v }))}
                        placeholder={t('settings.profile.incomeCurrency')}
                        variant="full"
                      />
                    </div>
                  </div>
                </div>
                )}

                {/* Rank */}
                <div className={cn('rounded-lg border p-4 space-y-3 mt-10', rankConfig.cardClassName)}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Label>{t('settings.profile.rank.title')}</Label>
                      <p className="text-base font-semibold mt-1">{rankConfig.name}</p>
                    </div>
                    <rankConfig.icon className={cn('h-5 w-5 mt-0.5', rankConfig.iconClassName)} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.profile.rank.receiptsTracked', { count: receiptCount })}
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{t('settings.profile.rank.progress')}</span>
                      <span>{Math.round(rankConfig.progress)}%</span>
                    </div>
                    <Progress value={rankConfig.progress} className="h-2" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {rankConfig.receiptsToNextRank > 0
                      ? t('settings.profile.rank.nextTarget', {
                          count: rankConfig.receiptsToNextRank,
                          rank: rankConfig.nextRankName,
                        })
                      : t('settings.profile.rank.topTier')}
                  </p>
                  <p className="text-sm text-muted-foreground">{rankConfig.description}</p>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={!isDirty || updateMe.isPending}
                  >
                    <Save className="h-4 w-4" />
                    {updateMe.isPending ? t('common.saving') : t('common.save')}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
