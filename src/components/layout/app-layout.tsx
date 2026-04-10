import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/auth'
import { useSettingsStore } from '@/store/settings'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Avatar } from '@/components/ui/avatar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { ContactSupportModal } from '@/components/support/contact-support-modal'
import { AnnouncementDrawer, useAnnouncementIndicator } from '@/components/announcements/announcement-list'
import { OnboardingModal } from '@/components/onboarding/onboarding-modal'
import { RateAppModal } from '@/components/rating/rate-app-modal'
import { LanguageSwitcher } from '@/components/ui/language-switcher'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { sidebarCollapsed, setSidebarCollapsed } = useSettingsStore()

  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false)
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(
    () => !!user && localStorage.getItem('receipto-onboarding-completed') !== 'true'
  )
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false)
  const [isAnnouncementsOpen, setIsAnnouncementsOpen] = useState(false)
  const { hasAnnouncements } = useAnnouncementIndicator()

  return (
    <SidebarProvider
      open={!sidebarCollapsed}
      onOpenChange={(open) => setSidebarCollapsed(!open)}
    >
      <AppSidebar
        onOpenSupportModal={() => setIsSupportModalOpen(true)}
        onOpenRatingModal={() => setIsRatingModalOpen(true)}
        onOpenAnnouncements={() => setIsAnnouncementsOpen(true)}
        hasAnnouncements={hasAnnouncements}
      />
      <SidebarInset>
        {/* Mobile header: hamburger | centered logo | user avatar */}
        <header className="flex flex-col border-b md:hidden" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="relative flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <LanguageSwitcher />
            </div>
            <Link
              to="/dashboard"
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <img src="/logo-text.svg" alt={t('common.appName')} className="h-5 w-auto" />
            </Link>
            <Link to="/settings/profile" className="shrink-0">
              <Avatar
                firstName={user?.firstName}
                lastName={user?.lastName}
                imageUrl={user?.profileImageUrl}
                size="sm"
              />
            </Link>
          </div>
        </header>

        {/* Main content */}
        <main className="container mx-auto px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </SidebarInset>

      {/* Modals */}
      <RateAppModal
        open={isRatingModalOpen}
        onOpenChange={setIsRatingModalOpen}
      />
      <ContactSupportModal
        open={isSupportModalOpen}
        onOpenChange={setIsSupportModalOpen}
      />
      <OnboardingModal
        open={isOnboardingOpen}
        onOpenChange={(open) => {
          setIsOnboardingOpen(open)
          if (!open) localStorage.setItem('receipto-onboarding-completed', 'true')
        }}
      />
      <AnnouncementDrawer
        open={isAnnouncementsOpen}
        onOpenChange={setIsAnnouncementsOpen}
      />
    </SidebarProvider>
  )
}
