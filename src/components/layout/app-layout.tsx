import { useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { useSettingsStore } from '@/store/settings'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { MobileTabBar } from '@/components/layout/mobile-tab-bar'
import { FabActionSheet } from '@/components/layout/fab-action-sheet'
import { ContactSupportModal } from '@/components/support/contact-support-modal'
import { AnnouncementDrawer, useAnnouncementIndicator } from '@/components/announcements/announcement-list'
import { OnboardingModal } from '@/components/onboarding/onboarding-modal'
import { RateAppModal } from '@/components/rating/rate-app-modal'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
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
        {/* No global mobile top bar — the bottom-bar "More" tab (language · profile ·
            theme · support) is the single mobile-nav entry; each page supplies its own
            header. Top safe-area padding lives on <main> so content clears the notch. */}
        <main className="w-full max-w-[1180px] mx-auto px-4 pb-28 pt-[calc(env(safe-area-inset-top)_+_1.5rem)] md:px-8 md:pb-8 md:pt-8">
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
