import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AppLayout } from '@/components/layout/app-layout'
import { PageToolbar } from '@/components/layout/page-toolbar'
import { PageTransition } from '@/components/ui/animated'
import { ThemeSegmented } from '@/components/layout/theme-segmented'
import {
  SettingsCard,
  SettingRow,
  AccentRetired,
  NotifList,
  NotifRow,
  RankCard,
  SaveBar,
} from '@/components/settings/primitives'
import { Field } from '@/components/glass/glass'
import { GlassDialog } from '@/components/glass/glass-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { CurrencySelect } from '@/components/ui/currency-select'
import {
  Image as ImageIcon,
  Trash2,
  MapPin,
  Wallet,
  Mail,
  Palette,
  DollarSign,
  Languages,
  Bell,
  Globe,
  AlertTriangle,
} from 'lucide-react'
import { useSettingsStore, type Language } from '@/store/settings'
import { useAuthStore } from '@/store/auth'
import { useMe, useUpdateMe, useUploadProfileImage, useDeleteMyAccount } from '@/hooks/users/use-me'
import { useIsMobile } from '@/hooks/use-mobile'
import { normalizeRank, getNextRank, getProgressToNextRank, type ReceiptRank } from '@/lib/rank'

const languages: { value: Language; labelKey: string }[] = [
  { value: 'en', labelKey: 'settings.language.en' },
  { value: 'sr', labelKey: 'settings.language.sr' },
]

function SectionLabel({ children }: { children: ReactNode }) {
  return <h2 className="px-1 pt-1 text-[12px] font-bold uppercase tracking-[0.08em] text-fg-faint">{children}</h2>
}

export default function Settings() {
  const { t } = useTranslation()
  const isMobile = useIsMobile(768)

  const { currency, language, setCurrency, setLanguage } = useSettingsStore()
  const authUser = useAuthStore((s) => s.user)
  const { data: me } = useMe(true)
  const updateMe = useUpdateMe()
  const uploadProfileImage = useUploadProfileImage()
  const deleteMyAccount = useDeleteMyAccount()
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
    [effectiveUser?.firstName, effectiveUser?.lastName, effectiveUser?.profileImageUrl, effectiveUser?.id, me?.street, me?.zipCode, me?.city, me?.monthlyIncome, me?.incomeCurrency],
  )

  const [draft, setDraft] = useState(() => ({
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

  const isDirty =
    draft.firstName !== initial.firstName ||
    draft.lastName !== initial.lastName ||
    draft.street !== initial.street ||
    draft.zipCode !== initial.zipCode ||
    draft.city !== initial.city ||
    draft.monthlyIncome !== initial.monthlyIncome ||
    draft.incomeCurrency !== initial.incomeCurrency

  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

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
      toast.error(t('settings.profile.saveError'), { description: err instanceof Error ? err.message : 'An error occurred' })
    }
  }

  const handleRemoveProfileImage = async () => {
    if (!effectiveUser) return
    try {
      await updateMe.mutateAsync({ removeProfileImage: true })
      toast.success(t('settings.profile.pictureRemoved'))
    } catch (err) {
      toast.error(t('settings.profile.saveError'), { description: err instanceof Error ? err.message : 'An error occurred' })
    }
  }

  const handleFileSelect = () => fileInputRef.current?.click()

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
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      toast.error(t('settings.profile.uploadError'), { description: err instanceof Error ? err.message : 'An error occurred' })
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return
    try {
      await deleteMyAccount.mutateAsync()
      toast.success(t('settings.dangerZone.accountDeleted'))
    } catch (err) {
      toast.error(t('settings.dangerZone.deleteError'), { description: err instanceof Error ? err.message : 'An error occurred' })
    }
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(false)
    setDeleteConfirmText('')
  }

  const deleteItems = [
    t('settings.dangerZone.deleteItem1'),
    t('settings.dangerZone.deleteItem2'),
    t('settings.dangerZone.deleteItem3'),
    t('settings.dangerZone.deleteItem4'),
  ]

  const warningBox = (
    <div className="rounded-xl bg-destructive-soft p-4">
      <p className="text-sm font-semibold text-[color:var(--destructive-foreground-on-soft)]">
        {t('settings.dangerZone.deleteAccountWarning')}
      </p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-[13px] text-[color:var(--destructive-foreground-on-soft)]/85">
        {deleteItems.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  )

  return (
    <AppLayout>
      <PageTransition>
        <PageToolbar className="md:-mx-8 md:-mt-8 md:mb-6" title={t('settings.title')} subtitle={t('settings.subtitle')} />

        {/* Mobile header */}
        <div className="mb-5 md:hidden">
          <h1 className="t-h1 text-[28px]">{t('settings.title')}</h1>
          <p className="t-sm mt-1 text-muted-foreground">{t('settings.subtitle')}</p>
        </div>

        <div className="mx-auto max-w-3xl space-y-5" key={profileKey}>
          {/* ===================== PROFILE ===================== */}
          <SectionLabel>{t('settings.sections.profile')}</SectionLabel>

          {!effectiveUser ? (
            <SettingsCard>
              <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
            </SettingsCard>
          ) : (
            <>
              {/* Identity */}
              <SettingsCard>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Avatar firstName={effectiveUser.firstName} lastName={effectiveUser.lastName} imageUrl={effectiveUser.profileImageUrl} size="2xl" />
                  <div className="min-w-0">
                    <div className="space-y-0.5">
                      <span className="text-sm font-semibold">{t('settings.profile.picture')}</span>
                      <p className="text-[13px] text-muted-foreground">{t('settings.profile.pictureHelp')}</p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/heic" onChange={handleFileChange} className="hidden" />
                      <Button type="button" variant="outline" size="sm" className="h-10" onClick={handleFileSelect} disabled={uploadProfileImage.isPending}>
                        <ImageIcon className="size-4" />
                        {uploadProfileImage.isPending ? t('common.uploading') : t('settings.profile.upload')}
                      </Button>
                      <Button type="button" variant="ghost" size="sm" className="h-10 text-destructive hover:text-destructive" onClick={handleRemoveProfileImage} disabled={!effectiveUser.profileImageUrl || updateMe.isPending}>
                        <Trash2 className="size-4" />
                        {t('settings.profile.remove')}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="my-5 h-px bg-hairline-soft" />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t('settings.profile.firstName')} id="firstName" value={draft.firstName} onChange={(e) => setDraft((p) => ({ ...p, firstName: e.target.value }))} autoComplete="given-name" />
                  <Field label={t('settings.profile.lastName')} id="lastName" value={draft.lastName} onChange={(e) => setDraft((p) => ({ ...p, lastName: e.target.value }))} autoComplete="family-name" />
                </div>
                <div className="mt-4">
                  <Field label={t('settings.profile.email')} id="email" icon={Mail} value={effectiveUser.email} disabled containerClassName="opacity-70" />
                </div>
              </SettingsCard>

              {/* Address */}
              <SettingsCard icon={MapPin} title={t('settings.profile.address.title')} desc={t('settings.profile.address.description')}>
                <Field label={t('settings.profile.address.street')} id="street" value={draft.street} onChange={(e) => setDraft((p) => ({ ...p, street: e.target.value }))} autoComplete="street-address" />
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label={t('settings.profile.address.zipCode')} id="zipCode" value={draft.zipCode} onChange={(e) => setDraft((p) => ({ ...p, zipCode: e.target.value }))} autoComplete="postal-code" />
                  <Field label={t('settings.profile.address.city')} id="city" value={draft.city} onChange={(e) => setDraft((p) => ({ ...p, city: e.target.value }))} autoComplete="address-level2" />
                </div>
              </SettingsCard>

              {/* Monthly income */}
              <SettingsCard icon={Wallet} title={t('settings.profile.income')} desc={t('settings.profile.incomeDescription')}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t('settings.profile.incomeAmount')} id="monthlyIncome" type="number" min="0" step="0.01" value={draft.monthlyIncome} onChange={(e) => setDraft((p) => ({ ...p, monthlyIncome: e.target.value }))} placeholder="0.00" />
                  <div className="min-w-0 flex-1">
                    <label htmlFor="incomeCurrency" className="mb-1.5 ml-0.5 block text-xs font-semibold text-muted-foreground">{t('settings.profile.incomeCurrency')}</label>
                    <CurrencySelect id="incomeCurrency" value={draft.incomeCurrency} onValueChange={(v) => setDraft((p) => ({ ...p, incomeCurrency: v }))} placeholder={t('settings.profile.incomeCurrency')} variant="full" triggerClassName="h-[50px] w-full rounded-[14px]" />
                  </div>
                </div>
              </SettingsCard>

              {/* Rank */}
              <RankCard count={receiptCount} rank={receiptRank} name={rankConfig.name} description={rankConfig.description} progress={rankConfig.progress} nextRankName={rankConfig.nextRankName} receiptsToNextRank={rankConfig.receiptsToNextRank} />

              {/* Save */}
              <SaveBar dirty={isDirty} saving={updateMe.isPending} onSave={handleSaveProfile} />
            </>
          )}

          {/* ===================== APP ===================== */}
          <SectionLabel>{t('settings.sections.app')}</SectionLabel>

          {/* Appearance */}
          <SettingsCard icon={Palette} title={t('settings.appearance.title')} desc={t('settings.appearance.description')}>
            <SettingRow label={t('settings.appearance.theme')} help={t('settings.appearance.themeHelp')}>
              <ThemeSegmented labeled />
            </SettingRow>
            <div className="my-4 h-px bg-hairline-soft" />
            <AccentRetired />
          </SettingsCard>

          {/* Language */}
          <SettingsCard icon={Languages} title={t('settings.language.title')} desc={t('settings.language.description')}>
            <SettingRow label={t('settings.language.label')} help={t('settings.language.help')} htmlFor="language">
              <Select
                value={language}
                onValueChange={(value: Language) => {
                  setLanguage(value)
                  updateMe.mutate({ preferredLanguage: value })
                }}
              >
                <SelectTrigger id="language" className="w-full sm:w-[200px]">
                  <Globe className="size-4 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder={t('settings.language.label')} />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {t(lang.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingRow>
          </SettingsCard>

          {/* Currency */}
          <SettingsCard icon={DollarSign} title={t('settings.currency.title')} desc={t('settings.currency.description')}>
            <SettingRow label={t('settings.currency.label')} help={t('settings.currency.help')} htmlFor="currency">
              <CurrencySelect id="currency" value={currency} onValueChange={(value: string) => setCurrency(value)} placeholder={t('settings.currency.label')} triggerClassName="w-full sm:w-[248px]" variant="full" />
            </SettingRow>
          </SettingsCard>

          {/* Notifications */}
          <SettingsCard icon={Bell} title={t('settings.notifications.title')} desc={t('settings.notifications.description')}>
            <NotifList>
              <NotifRow title={t('settings.notifications.rankMilestones')} help={t('settings.notifications.rankMilestonesHelp')} checked={effectiveUser?.receiptMilestoneEmailsEnabled ?? true} onCheckedChange={(checked) => updateMe.mutate({ receiptMilestoneEmailsEnabled: checked })} disabled={updateMe.isPending} />
              <NotifRow title={t('settings.notifications.warrantyReminders')} help={t('settings.notifications.warrantyRemindersHelp')} checked={effectiveUser?.warrantyReminderEnabled ?? true} onCheckedChange={(checked) => updateMe.mutate({ warrantyReminderEnabled: checked })} disabled={updateMe.isPending} />
              <NotifRow title={t('settings.notifications.budgetAlerts')} help={t('settings.notifications.budgetAlertsHelp')} checked={effectiveUser?.budgetAlertEnabled ?? true} onCheckedChange={(checked) => updateMe.mutate({ budgetAlertEnabled: checked })} disabled={updateMe.isPending} />
            </NotifList>
          </SettingsCard>

          {/* ===================== DANGER ZONE ===================== */}
          <SettingsCard danger icon={AlertTriangle} title={t('settings.dangerZone.title')} desc={t('settings.dangerZone.description')}>
            {warningBox}

            {!isMobile && showDeleteConfirm ? (
              <div className="mt-4 space-y-3 rounded-xl border border-destructive/50 p-4">
                <p className="text-sm font-semibold">{t('settings.dangerZone.confirmPrompt')}</p>
                <Input type="text" placeholder="DELETE" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} className="font-mono" />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="rounded-xl" onClick={cancelDelete}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="button" variant="destructive" className="rounded-xl !text-white" onClick={handleDeleteAccount} disabled={deleteConfirmText !== 'DELETE' || deleteMyAccount.isPending}>
                    {deleteMyAccount.isPending ? t('common.deleting') : t('settings.dangerZone.confirmDelete')}
                  </Button>
                </div>
              </div>
            ) : (
              <Button type="button" variant="destructive" className="mt-4 rounded-xl !text-white" onClick={() => setShowDeleteConfirm(true)}>
                {t('settings.dangerZone.deleteAccount')}
              </Button>
            )}
          </SettingsCard>
        </div>
      </PageTransition>

      {/* Mobile delete confirm — bottom sheet */}
      <GlassDialog
        open={isMobile && showDeleteConfirm}
        onOpenChange={(o) => {
          if (!o) cancelDelete()
        }}
        title={t('settings.dangerZone.deleteAccount')}
        description={t('settings.dangerZone.mobileSubtitle')}
        actions={{
          primary: (
            <Button type="button" variant="destructive" className="rounded-xl !text-white" onClick={handleDeleteAccount} disabled={deleteConfirmText !== 'DELETE' || deleteMyAccount.isPending}>
              {deleteMyAccount.isPending ? t('common.deleting') : t('settings.dangerZone.confirmDelete')}
            </Button>
          ),
          secondary: (
            <Button type="button" variant="ghost" className="rounded-xl" onClick={cancelDelete}>
              {t('common.cancel')}
            </Button>
          ),
        }}
      >
        <div className="space-y-4">
          <div className="grid place-items-center">
            <span className="grid size-[60px] place-items-center rounded-[18px] bg-destructive-soft text-destructive">
              <AlertTriangle className="size-[26px]" />
            </span>
          </div>
          {warningBox}
          <div className="space-y-2">
            <p className="text-sm font-semibold">{t('settings.dangerZone.confirmPrompt')}</p>
            <Input type="text" placeholder="DELETE" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} className="font-mono" />
          </div>
        </div>
      </GlassDialog>
    </AppLayout>
  )
}
