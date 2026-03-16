import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/auth'
import { useSettingsStore } from '@/store/settings'
import { Megaphone } from 'lucide-react'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { ContactSupportModal } from '@/components/support/contact-support-modal'
import { AnnouncementDrawer, useAnnouncementIndicator } from '@/components/announcements/announcement-list'
import { OnboardingModal } from '@/components/onboarding/onboarding-modal'
import { RateAppModal } from '@/components/rating/rate-app-modal'

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
        {/* Mobile header */}
        <header className="flex h-[calc(3rem+env(safe-area-inset-top))] items-center gap-2 border-b px-4 pt-[env(safe-area-inset-top)] md:hidden">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1">
            <Link to="/dashboard">
              <h1 className="text-lg font-bold text-primary font-display">{t('common.appName')}</h1>
            </Link>
          </div>
          {hasAnnouncements && (
            <button
              onClick={() => setIsAnnouncementsOpen(true)}
              className="relative p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
              aria-label={t('announcements.title')}
            >
              <Megaphone className="h-4 w-4" />
              <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            </button>
          )}
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
