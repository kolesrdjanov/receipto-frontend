import { useTranslation } from 'react-i18next'
import { AppLayout } from '@/components/layout/app-layout'
import { PageToolbar } from '@/components/layout/page-toolbar'
import { PageTransition } from '@/components/ui/animated'
import { SettingsCard, RankCard, SaveBar } from '@/components/settings/primitives'
import { Field } from '@/components/glass/glass'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { CurrencySelect } from '@/components/ui/currency-select'
import { Image as ImageIcon, Trash2, MapPin, Wallet, Mail } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useMe, useUpdateMe, useUploadProfileImage } from '@/hooks/users/use-me'
import { toast } from 'sonner'
import { useEffect, useMemo, useState, useRef } from 'react'
import { normalizeRank, getNextRank, getProgressToNextRank, type ReceiptRank } from '@/lib/rank'

export default function ProfileSettings() {
  const { t } = useTranslation()
  const authUser = useAuthStore((s) => s.user)
  const { data: me } = useMe(true)
  const updateMe = useUpdateMe()
  const uploadProfileImage = useUploadProfileImage()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const effectiveUser = me ?? authUser
  const receiptCount = me?.receiptCount ?? 0
  const receiptRank = normalizeRank(me?.receiptRank as ReceiptRank | undefined, receiptCount)

  const rankConfig = useMemo(() => {
    const nextRank = getNextRank(receiptRank)
    const progress = getProgressToNextRank(receiptRank, receiptCount)
    const receiptsToNextRank = nextRank ? Math.max(nextRank.minReceipts - receiptCount, 0) : 0
    const nextRankName = nextRank ? t(nextRank.nameKey) : t('settings.profile.rank.maxRank')
    const common = { progress, nextRankName, receiptsToNextRank }

    if (receiptRank === 'status_a') {
      return { name: t('settings.profile.rank.names.statusA'), description: t('settings.profile.rank.descriptions.statusA'), ...common }
    }
    if (receiptRank === 'status_b') {
      return { name: t('settings.profile.rank.names.statusB'), description: t('settings.profile.rank.descriptions.statusB', { remaining: receiptsToNextRank }), ...common }
    }
    if (receiptRank === 'status_c') {
      return { name: t('settings.profile.rank.names.statusC'), description: t('settings.profile.rank.descriptions.statusC', { remaining: receiptsToNextRank }), ...common }
    }
    return { name: t('settings.profile.rank.names.noStatus'), description: t('settings.profile.rank.descriptions.noStatus', { remaining: receiptsToNextRank }), ...common }
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
      // Sync server-loaded profile fields (street/zip/income — not present on the
      // cached authUser) into the editable draft once the /users/me query resolves.
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
      <PageTransition>
        <PageToolbar
          className="md:-mx-8 md:-mt-8 md:mb-6"
          title={t('settings.profile.title')}
          subtitle={t('settings.profile.description')}
        />

        {/* Mobile header */}
        <div className="mb-5 md:hidden">
          <h1 className="t-h1 text-[28px]">{t('settings.profile.title')}</h1>
          <p className="t-sm mt-1 text-muted-foreground">{t('settings.profile.description')}</p>
        </div>

        <div className="mx-auto max-w-3xl space-y-5" key={profileKey}>
          {!effectiveUser ? (
            <SettingsCard>
              <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
            </SettingsCard>
          ) : (
            <>
              {/* Identity */}
              <SettingsCard>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Avatar
                    firstName={effectiveUser.firstName}
                    lastName={effectiveUser.lastName}
                    imageUrl={effectiveUser.profileImageUrl}
                    size="2xl"
                  />
                  <div className="min-w-0">
                    <div className="space-y-0.5">
                      <span className="text-sm font-semibold">{t('settings.profile.picture')}</span>
                      <p className="text-[13px] text-muted-foreground">{t('settings.profile.pictureHelp')}</p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
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
                        size="sm"
                        className="h-10"
                        onClick={handleFileSelect}
                        disabled={uploadProfileImage.isPending}
                      >
                        <ImageIcon className="size-4" />
                        {uploadProfileImage.isPending ? t('common.uploading') : t('settings.profile.upload')}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-10 text-destructive hover:text-destructive"
                        onClick={handleRemoveProfileImage}
                        disabled={!effectiveUser.profileImageUrl || updateMe.isPending}
                      >
                        <Trash2 className="size-4" />
                        {t('settings.profile.remove')}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="my-5 h-px bg-hairline-soft" />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label={t('settings.profile.firstName')}
                    id="firstName"
                    value={draft.firstName}
                    onChange={(e) => setDraft((p) => ({ ...p, firstName: e.target.value }))}
                    autoComplete="given-name"
                  />
                  <Field
                    label={t('settings.profile.lastName')}
                    id="lastName"
                    value={draft.lastName}
                    onChange={(e) => setDraft((p) => ({ ...p, lastName: e.target.value }))}
                    autoComplete="family-name"
                  />
                </div>
                <div className="mt-4">
                  <Field
                    label={t('settings.profile.email')}
                    id="email"
                    icon={Mail}
                    value={effectiveUser.email}
                    disabled
                    containerClassName="opacity-70"
                  />
                </div>
              </SettingsCard>

              {/* Address */}
              <SettingsCard icon={MapPin} title={t('settings.profile.address.title')} desc={t('settings.profile.address.description')}>
                <Field
                  label={t('settings.profile.address.street')}
                  id="street"
                  value={draft.street}
                  onChange={(e) => setDraft((p) => ({ ...p, street: e.target.value }))}
                  autoComplete="street-address"
                />
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field
                    label={t('settings.profile.address.zipCode')}
                    id="zipCode"
                    value={draft.zipCode}
                    onChange={(e) => setDraft((p) => ({ ...p, zipCode: e.target.value }))}
                    autoComplete="postal-code"
                  />
                  <Field
                    label={t('settings.profile.address.city')}
                    id="city"
                    value={draft.city}
                    onChange={(e) => setDraft((p) => ({ ...p, city: e.target.value }))}
                    autoComplete="address-level2"
                  />
                </div>
              </SettingsCard>

              {/* Monthly income */}
              <SettingsCard icon={Wallet} title={t('settings.profile.income')} desc={t('settings.profile.incomeDescription')}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label={t('settings.profile.incomeAmount')}
                    id="monthlyIncome"
                    type="number"
                    min="0"
                    step="0.01"
                    value={draft.monthlyIncome}
                    onChange={(e) => setDraft((p) => ({ ...p, monthlyIncome: e.target.value }))}
                    placeholder="0.00"
                  />
                  <div className="min-w-0 flex-1">
                    <label htmlFor="incomeCurrency" className="mb-1.5 ml-0.5 block text-xs font-semibold text-muted-foreground">
                      {t('settings.profile.incomeCurrency')}
                    </label>
                    <CurrencySelect
                      id="incomeCurrency"
                      value={draft.incomeCurrency}
                      onValueChange={(v) => setDraft((p) => ({ ...p, incomeCurrency: v }))}
                      placeholder={t('settings.profile.incomeCurrency')}
                      variant="full"
                      triggerClassName="h-[50px] w-full rounded-[14px]"
                    />
                  </div>
                </div>
              </SettingsCard>

              {/* Rank */}
              <RankCard
                count={receiptCount}
                rank={receiptRank}
                name={rankConfig.name}
                description={rankConfig.description}
                progress={rankConfig.progress}
                nextRankName={rankConfig.nextRankName}
                receiptsToNextRank={rankConfig.receiptsToNextRank}
              />

              {/* Save */}
              <SaveBar dirty={isDirty} saving={updateMe.isPending} onSave={handleSaveProfile} />
            </>
          )}
        </div>
      </PageTransition>
    </AppLayout>
  )
}
