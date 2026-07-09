import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/api'
import { AppLayout } from '@/components/layout/app-layout'
import { PageContent } from '@/components/layout/page-content'
import { PageToolbar } from '@/components/layout/page-toolbar'
import { PageTransition } from '@/components/ui/animated'
import { ThemeSegmented } from '@/components/layout/theme-segmented'
import {
  SettingsCard,
  SettingRow,
  AccentRetired,
  NotifList,
  NotifRow,
  RankChip,
  SaveBar,
  ProfileAvatar,
  SettingsNavRail,
  SettingsTabStrip,
} from '@/components/settings/primitives'
import { GlassDialog } from '@/components/glass/glass-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CurrencySelect } from '@/components/ui/currency-select'
import { Progress } from '@/components/ui/progress'
import {
  Mail,
  Trash2,
  Wallet,
  Palette,
  Languages,
  Bell,
  Globe,
  AlertTriangle,
  User,
  LogOut,
  type LucideIcon,
} from 'lucide-react'
import { useSettingsStore, type Language } from '@/store/settings'
import { useAuthStore } from '@/store/auth'
import { useMe, useUpdateMe, useUploadProfileImage, useDeleteMyAccount } from '@/hooks/users/use-me'
import { useLogout } from '@/hooks/auth/use-logout'
import { useIsMobile } from '@/hooks/use-mobile'
import { normalizeRank, getNextRank, type ReceiptRank } from '@/lib/rank'

const languages: { value: Language; labelKey: string }[] = [
  { value: 'en', labelKey: 'settings.language.en' },
  { value: 'sr', labelKey: 'settings.language.sr' },
]

// Shared label style — matches the form-modal labels used app-wide.
const fieldLabel = 'field-label'

// Desktop section-nav items (one visible section at a time) + the mobile tab strip.
type SectionId = 'profile' | 'appearance' | 'region' | 'notifications' | 'danger'
const NAV: { id: SectionId; labelKey: string; icon: LucideIcon; danger?: boolean }[] = [
  { id: 'profile', labelKey: 'settings.nav.profile', icon: User },
  { id: 'appearance', labelKey: 'settings.nav.appearance', icon: Palette },
  { id: 'region', labelKey: 'settings.nav.region', icon: Globe },
  { id: 'notifications', labelKey: 'settings.nav.notifications', icon: Bell },
  { id: 'danger', labelKey: 'settings.nav.danger', icon: AlertTriangle, danger: true },
]
type TabId = 'profile' | 'app' | 'account'
const TABS: { id: TabId; labelKey: string }[] = [
  { id: 'profile', labelKey: 'settings.tabs.profile' },
  { id: 'app', labelKey: 'settings.tabs.application' },
  { id: 'account', labelKey: 'settings.tabs.account' },
]

export default function Settings() {
  const { t } = useTranslation()
  const isMobile = useIsMobile(900)

  const { currency, language, setCurrency, setLanguage } = useSettingsStore()
  const authUser = useAuthStore((s) => s.user)
  const { data: me } = useMe(true)
  const updateMe = useUpdateMe()
  const uploadProfileImage = useUploadProfileImage()
  const deleteMyAccount = useDeleteMyAccount()
  const handleLogout = useLogout()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const effectiveUser = me ?? authUser
  const receiptCount = me?.receiptCount ?? 0
  const receiptRank = normalizeRank(me?.receiptRank as ReceiptRank | undefined, receiptCount)

  const rank = useMemo(() => {
    const nextRank = getNextRank(receiptRank)
    const receiptsToNextRank = nextRank ? Math.max(nextRank.minReceipts - receiptCount, 0) : 0
    const nextRankName = nextRank ? t(nextRank.nameKey) : t('settings.profile.rank.maxRank')
    const name =
      receiptRank === 'status_a'
        ? t('settings.profile.rank.names.statusA')
        : receiptRank === 'status_b'
          ? t('settings.profile.rank.names.statusB')
          : receiptRank === 'status_c'
            ? t('settings.profile.rank.names.statusC')
            : t('settings.profile.rank.names.noStatus')
    return { name, nextRankName, receiptsToNextRank }
  }, [receiptCount, receiptRank, t])

  const initial = useMemo(
    () => ({
      firstName: effectiveUser?.firstName ?? '',
      lastName: effectiveUser?.lastName ?? '',
      userId: effectiveUser?.id ?? null,
      monthlyIncome: me?.monthlyIncome?.toString() ?? '',
      incomeCurrency: me?.incomeCurrency ?? '',
    }),
    [effectiveUser?.firstName, effectiveUser?.lastName, effectiveUser?.id, me?.monthlyIncome, me?.incomeCurrency],
  )

  const [draft, setDraft] = useState(() => ({
    firstName: initial.firstName,
    lastName: initial.lastName,
    monthlyIncome: initial.monthlyIncome,
    incomeCurrency: initial.incomeCurrency,
  }))

  const profileKey = initial.userId ?? 'no-user'

  useEffect(() => {
    if (me) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft((prev) => ({
        ...prev,
        monthlyIncome: me.monthlyIncome?.toString() ?? '',
        incomeCurrency: me.incomeCurrency ?? '',
      }))
    }
  }, [me?.monthlyIncome, me?.incomeCurrency])

  const isDirty =
    draft.firstName !== initial.firstName ||
    draft.lastName !== initial.lastName ||
    draft.monthlyIncome !== initial.monthlyIncome ||
    draft.incomeCurrency !== initial.incomeCurrency

  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Desktop nav rail switches the visible section (only one shows at a time — the de-clutter).
  const [activeSection, setActiveSection] = useState<SectionId>('profile')
  const [activeTab, setActiveTab] = useState<TabId>('profile')

  const handleSaveProfile = async () => {
    if (!effectiveUser) return
    try {
      await updateMe.mutateAsync({
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        monthlyIncome: draft.monthlyIncome ? Number(draft.monthlyIncome) : null,
        incomeCurrency: draft.incomeCurrency || null,
      })
      toast.success(t('settings.profile.saved'))
    } catch (err) {
      toast.error(t('settings.profile.saveError'), { description: getErrorMessage(err) })
    }
  }

  const handleRemoveProfileImage = async () => {
    if (!effectiveUser) return
    try {
      await updateMe.mutateAsync({ removeProfileImage: true })
      toast.success(t('settings.profile.pictureRemoved'))
    } catch (err) {
      toast.error(t('settings.profile.saveError'), { description: getErrorMessage(err) })
    }
  }

  const openFilePicker = () => fileInputRef.current?.click()

  const uploadFile = async (file: File) => {
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
    } catch (err) {
      toast.error(t('settings.profile.uploadError'), { description: getErrorMessage(err) })
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) await uploadFile(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return
    try {
      await deleteMyAccount.mutateAsync()
      toast.success(t('settings.dangerZone.accountDeleted'))
    } catch (err) {
      toast.error(t('settings.dangerZone.deleteError'), { description: getErrorMessage(err) })
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

  const userName =
    effectiveUser && (effectiveUser.firstName || effectiveUser.lastName)
      ? `${effectiveUser.firstName ?? ''} ${effectiveUser.lastName ?? ''}`.trim()
      : effectiveUser?.email

  const trackedLine =
    rank.receiptsToNextRank > 0
      ? t('settings.profile.rank.trackedMeta', { count: receiptCount, remaining: rank.receiptsToNextRank, rank: rank.nextRankName })
      : t('settings.profile.rank.trackedTop', { count: receiptCount })

  /* ---------------------------------------------------------------- */
  /* Section content blocks (shared by both layouts)                   */
  /* ---------------------------------------------------------------- */
  const profileHero = effectiveUser ? (
    <SettingsCard>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Hero: avatar + identity + rank chip */}
      <div className="flex items-center gap-5">
        <ProfileAvatar
          firstName={effectiveUser.firstName}
          lastName={effectiveUser.lastName}
          imageUrl={effectiveUser.profileImageUrl}
          label={t('settings.profile.picture')}
          onPick={openFilePicker}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[23px] font-semibold tracking-[-0.022em]">{userName}</div>
          <div className="mt-1 flex items-center gap-1.5 text-[13.5px] font-medium text-muted-foreground">
            <Mail className="size-[13px] shrink-0 text-fg-faint" />
            <span className="truncate">{effectiveUser.email}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <RankChip rank={receiptRank} name={rank.name} />
            <span className="text-[12px] font-semibold text-fg-faint">{trackedLine}</span>
          </div>
          {rank.receiptsToNextRank > 0 && (
            <div className="mt-3 max-w-[340px]">
              <Progress
                value={(receiptCount / (receiptCount + rank.receiptsToNextRank)) * 100}
                aria-label={t('settings.profile.rank.progress')}
              />
            </div>
          )}
        </div>
      </div>

      {/* Upload is the avatar camera button; show a Remove action only when a photo exists. */}
      {effectiveUser.profileImageUrl && (
        <div className="mt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={handleRemoveProfileImage}
            disabled={updateMe.isPending}
          >
            <Trash2 className="size-4" />
            {t('settings.profile.remove')}
          </Button>
        </div>
      )}

      <div className="my-[18px] h-px bg-hairline-soft" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className={fieldLabel}>{t('settings.profile.firstName')}</label>
          <Input id="firstName" value={draft.firstName} onChange={(e) => setDraft((p) => ({ ...p, firstName: e.target.value }))} autoComplete="given-name" />
        </div>
        <div>
          <label htmlFor="lastName" className={fieldLabel}>{t('settings.profile.lastName')}</label>
          <Input id="lastName" value={draft.lastName} onChange={(e) => setDraft((p) => ({ ...p, lastName: e.target.value }))} autoComplete="family-name" />
        </div>
      </div>
      <div className="mt-4">
        <label htmlFor="email" className={fieldLabel}>{t('settings.profile.email')}</label>
        <Input id="email" value={effectiveUser.email} disabled />
      </div>
    </SettingsCard>
  ) : (
    <SettingsCard>
      <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
    </SettingsCard>
  )

  const incomeCard = effectiveUser && (
    <SettingsCard icon={Wallet} title={t('settings.profile.income')} desc={t('settings.profile.incomeDescription')}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="monthlyIncome" className={fieldLabel}>{t('settings.profile.incomeAmount')}</label>
          <Input id="monthlyIncome" type="number" min="0" step="0.01" value={draft.monthlyIncome} onChange={(e) => setDraft((p) => ({ ...p, monthlyIncome: e.target.value }))} placeholder="0.00" />
        </div>
        <div className="min-w-0">
          <label htmlFor="incomeCurrency" className={fieldLabel}>{t('settings.profile.incomeCurrency')}</label>
          <CurrencySelect id="incomeCurrency" value={draft.incomeCurrency} onValueChange={(v) => setDraft((p) => ({ ...p, incomeCurrency: v }))} placeholder={t('settings.profile.incomeCurrency')} variant="full" triggerClassName="w-full" />
        </div>
      </div>
    </SettingsCard>
  )

  const profileCards = (
    <>
      {profileHero}
      {incomeCard}
      {effectiveUser && (
        <SaveBar
          dirty={isDirty}
          saving={updateMe.isPending}
          onSave={handleSaveProfile}
          onDiscard={() =>
            setDraft({
              firstName: initial.firstName,
              lastName: initial.lastName,
              monthlyIncome: initial.monthlyIncome,
              incomeCurrency: initial.incomeCurrency,
            })
          }
        />
      )}
    </>
  )

  const appearanceCard = (
    <SettingsCard icon={Palette} title={t('settings.appearance.title')} desc={t('settings.appearance.description')}>
      <SettingRow label={t('settings.appearance.theme')} help={t('settings.appearance.themeHelp')}>
        <ThemeSegmented labeled />
      </SettingRow>
      <div className="my-4 h-px bg-hairline-soft" />
      <AccentRetired />
    </SettingsCard>
  )

  const regionCard = (
    <SettingsCard icon={Languages} title={t('settings.region.title')} desc={t('settings.region.description')}>
      <SettingRow label={t('settings.language.label')} help={t('settings.language.help')} htmlFor="language">
        <div className="inline-flex rounded-[10px] bg-bg-subtle p-[3px]" role="group" aria-label={t('settings.language.label')}>
          {languages.map((lang) => {
            const active = language === lang.value
            return (
              /* eslint-disable-next-line no-restricted-syntax -- raw-button-ok: segmented control option (mirrors ThemeSegmented) */
              <button
                key={lang.value}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setLanguage(lang.value as Language)
                  updateMe.mutate({ preferredLanguage: lang.value })
                }}
                className={
                  'flex h-[30px] items-center gap-1.5 rounded-[7px] px-3.5 text-[13px] font-semibold transition-colors ' +
                  (active ? 'bg-card text-foreground shadow-glass-1' : 'text-muted-foreground hover:text-foreground')
                }
              >
                {t(lang.labelKey)}
              </button>
            )
          })}
        </div>
      </SettingRow>
      <div className="my-4 h-px bg-hairline-soft" />
      <SettingRow label={t('settings.currency.label')} help={t('settings.currency.help')} htmlFor="currency">
        <CurrencySelect id="currency" value={currency} onValueChange={(value: string) => setCurrency(value)} placeholder={t('settings.currency.label')} triggerClassName="w-full sm:w-[224px]" variant="full" />
      </SettingRow>
    </SettingsCard>
  )

  const notificationsCard = (
    <SettingsCard icon={Bell} title={t('settings.notifications.title')} desc={t('settings.notifications.description')}>
      <NotifList>
        <NotifRow title={t('settings.notifications.rankMilestones')} help={t('settings.notifications.rankMilestonesHelp')} checked={effectiveUser?.receiptMilestoneEmailsEnabled ?? true} onCheckedChange={(checked) => updateMe.mutate({ receiptMilestoneEmailsEnabled: checked })} disabled={updateMe.isPending} />
        <NotifRow title={t('settings.notifications.warrantyReminders')} help={t('settings.notifications.warrantyRemindersHelp')} checked={effectiveUser?.warrantyReminderEnabled ?? true} onCheckedChange={(checked) => updateMe.mutate({ warrantyReminderEnabled: checked })} disabled={updateMe.isPending} />
        <NotifRow title={t('settings.notifications.budgetAlerts')} help={t('settings.notifications.budgetAlertsHelp')} checked={effectiveUser?.budgetAlertEnabled ?? true} onCheckedChange={(checked) => updateMe.mutate({ budgetAlertEnabled: checked })} disabled={updateMe.isPending} />
      </NotifList>
    </SettingsCard>
  )

  const signOutCard = (
    <SettingsCard icon={LogOut} title={t('settings.account.signOutTitle')} desc={t('settings.account.signOutDescription')}>
      <Button type="button" variant="outline" onClick={handleLogout}>
        <LogOut className="size-4" />
        {t('nav.logout')}
      </Button>
    </SettingsCard>
  )

  const dangerCard = (
    <SettingsCard danger icon={AlertTriangle} title={t('settings.dangerZone.title')} desc={t('settings.dangerZone.description')}>
      {warningBox}

      {!isMobile && showDeleteConfirm ? (
        <div className="mt-4 space-y-3 rounded-xl border border-destructive/50 p-4">
          <p className="text-sm font-semibold">{t('settings.dangerZone.confirmPrompt')}</p>
          <Input type="text" placeholder="DELETE" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} className="font-mono" />
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={cancelDelete}>
              {t('common.cancel')}
            </Button>
            <Button type="button" variant="destructive" className="!text-white" onClick={handleDeleteAccount} disabled={deleteConfirmText !== 'DELETE' || deleteMyAccount.isPending}>
              {deleteMyAccount.isPending ? t('common.deleting') : t('settings.dangerZone.confirmDelete')}
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="destructive" className="mt-4 !text-white" onClick={() => setShowDeleteConfirm(true)}>
          {t('settings.dangerZone.deleteAccount')}
        </Button>
      )}
    </SettingsCard>
  )

  return (
    <AppLayout>
      <PageTransition>
        {/* Desktop sticky toolbar (md+); mobile uses its own header below. */}
        <PageToolbar className="md:mb-6" title={t('settings.title')} subtitle={t('settings.subtitle')} />

        <PageContent>
        {isMobile ? (
          /* ---------- MOBILE: 3-tab segmented strip ---------- */
          <div className="space-y-5" key={profileKey}>
            <div>
              <h1 className="t-h1 text-[26px] tracking-[-0.022em]">{t('settings.title')}</h1>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">{t('settings.subtitle')}</p>
            </div>

            <SettingsTabStrip
              tabs={TABS.map((tab) => ({ id: tab.id, label: t(tab.labelKey) }))}
              active={activeTab}
              onChange={setActiveTab}
            />

            <div className="space-y-4">
              {activeTab === 'profile' && profileCards}
              {activeTab === 'app' && (
                <>
                  {appearanceCard}
                  {regionCard}
                  {notificationsCard}
                </>
              )}
              {activeTab === 'account' && (
                <>
                  {signOutCard}
                  {dangerCard}
                </>
              )}
            </div>
          </div>
        ) : (
          /* ---------- DESKTOP: nav rail switches the visible section ---------- */
          <div className="mx-auto flex max-w-[1000px] items-start gap-[34px]" key={profileKey}>
            <SettingsNavRail
              items={NAV.map((item) => ({ id: item.id, label: t(item.labelKey), icon: item.icon, danger: item.danger }))}
              active={activeSection}
              onJump={(id) => setActiveSection(id as SectionId)}
            />

            <div className="flex min-w-0 flex-1 flex-col gap-4">
              {activeSection === 'profile' && profileCards}
              {activeSection === 'appearance' && appearanceCard}
              {activeSection === 'region' && regionCard}
              {activeSection === 'notifications' && notificationsCard}
              {activeSection === 'danger' && (
                <>
                  {signOutCard}
                  {dangerCard}
                </>
              )}
            </div>
          </div>
        )}
        </PageContent>
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
            <Button type="button" variant="destructive" className="!text-white" onClick={handleDeleteAccount} disabled={deleteConfirmText !== 'DELETE' || deleteMyAccount.isPending}>
              {deleteMyAccount.isPending ? t('common.deleting') : t('settings.dangerZone.confirmDelete')}
            </Button>
          ),
          secondary: (
            <Button type="button" variant="ghost" onClick={cancelDelete}>
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
