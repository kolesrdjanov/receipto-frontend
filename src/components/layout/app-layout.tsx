import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/auth'
import { useSettingsStore } from '@/store/settings'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Avatar } from '@/components/ui/avatar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { MobileTabBar } from '@/components/layout/mobile-tab-bar'
import { FabActionSheet } from '@/components/layout/fab-action-sheet'
import { ContactSupportModal } from '@/components/support/contact-support-modal'
import { AnnouncementDrawer, useAnnouncementIndicator } from '@/components/announcements/announcement-list'
import { OnboardingModal } from '@/components/onboarding/onboarding-modal'
import { RateAppModal } from '@/components/rating/rate-app-modal'
import { LanguageSwitcher } from '@/components/ui/language-switcher'

interface AppLayoutProps {
  children: React.ReactNode
  /** Hide the global mobile <header> (a page provides its own frosted header). */
  hideMobileHeader?: boolean
}

export function AppLayout({ children, hideMobileHeader = false }: AppLayoutProps) {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { sidebarCollapsed, setSidebarCollapsed } = useSettingsStore()

  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false)
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(
    () => !!user && localStorage.getItem('receipto-onboarding-completed') !== 'true'
  )
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false)
  const [isAnnouncementsOpen, setIsAnnouncementsOpen] = useState(false)
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false)
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
        {/* Mobile header — edge-to-edge frosted: language | centered logo | avatar.
            No hamburger; the bottom-bar "More" tab is the single mobile-nav entry. */}
        {!hideMobileHeader && (
          <header
            className="sticky top-0 z-20 border-b border-hairline-soft bg-background/82 [backdrop-filter:blur(18px)_saturate(1.4)] [-webkit-backdrop-filter:blur(18px)_saturate(1.4)] md:hidden"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
          >
            <div className="relative flex h-14 items-center justify-between px-4">
              <LanguageSwitcher pill abbreviated className="h-8" />
              <Link
                to="/dashboard"
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                aria-label={t('common.appName')}
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
        )}

        {/* Main content */}
        <main className="container mx-auto px-4 py-6 pb-28 md:px-8 md:py-8 md:pb-8">
          {children}
        </main>

        {/* Global mobile bottom navigation (hidden on desktop) */}
        <MobileTabBar onOpenAddSheet={() => setIsAddSheetOpen(true)} />
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
      <FabActionSheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen} />
    </SidebarProvider>
  )
}
