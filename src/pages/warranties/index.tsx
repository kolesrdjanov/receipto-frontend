import { useState, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  useWarranties,
  useWarrantyStats,
  getWarrantyStatus,
  getRemainingDays,
  type Warranty,
} from '@/hooks/warranties/use-warranties'
const WarrantyModal = lazy(() => import('@/components/warranties/warranty-modal').then(m => ({ default: m.WarrantyModal })))
const WarrantyGalleryModal = lazy(() => import('@/components/warranties/warranty-gallery-modal').then(m => ({ default: m.WarrantyGalleryModal })))

import {
  Plus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Calendar,
  Store,
  Clock,
  FileText,
} from 'lucide-react'
import { formatDate } from '@/lib/date-utils'
import { AppLayout } from '@/components/layout/app-layout'

export default function WarrantiesPage() {
  const { t } = useTranslation()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedWarranty, setSelectedWarranty] = useState<Warranty | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [activeTab, setActiveTab] = useState('all')
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [galleryTitle, setGalleryTitle] = useState('')
  const [galleryIndex, setGalleryIndex] = useState(0)

  const { data: allWarranties = [], isLoading } = useWarranties()
  const { data: activeWarranties = [] } = useWarranties('active')
  const { data: expiredWarranties = [] } = useWarranties('expired')
  const { data: expiringWarranties = [] } = useWarranties('expiring')
  const { data: stats } = useWarrantyStats()

  const handleAddWarranty = () => {
    setSelectedWarranty(null)
    setModalMode('create')
    setModalOpen(true)
  }

  const handleEditWarranty = (warranty: Warranty) => {
    setSelectedWarranty(warranty)
    setModalMode('edit')
    setModalOpen(true)
  }

  const openGallery = (warranty: Warranty, index: number) => {
    const imgs = [warranty.fileUrl, warranty.fileUrl2].filter(Boolean) as string[]
    if (imgs.length === 0) return

    setGalleryImages(imgs)
    setGalleryTitle(warranty.productName)
    setGalleryIndex(Math.min(Math.max(index, 0), imgs.length - 1))
    setGalleryOpen(true)
  }

  const getWarrantiesForTab = () => {
    switch (activeTab) {
      case 'active':
        return activeWarranties
      case 'expiring':
        return expiringWarranties
      case 'expired':
        return expiredWarranties
      default:
        return allWarranties
    }
  }

  const getStatusBadge = (warranty: Warranty) => {
    const status = getWarrantyStatus(warranty)
    const days = getRemainingDays(warranty)

    switch (status) {
      case 'active':
        return (
          <Badge variant="default" className="bg-green-500">
            <ShieldCheck className="h-3 w-3 mr-1" />
            {t('warranties.status.active')}
          </Badge>
        )
      case 'expiring':
        return (
          <Badge variant="default" className="bg-orange-500">
            <ShieldAlert className="h-3 w-3 mr-1" />
            {days} {t('warranties.status.daysLeft')}
          </Badge>
        )
      case 'expired':
        return (
          <Badge variant="default" className="bg-red-500">
            <ShieldX className="h-3 w-3 mr-1" />
            {t('warranties.status.expired')}
          </Badge>
        )
    }
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('warranties.title')}</h1>
            <p className="text-muted-foreground">{t('warranties.subtitle')}</p>
          </div>
          <Button onClick={handleAddWarranty}>
            <Plus className="h-4 w-4" />
            {t('warranties.addWarranty')}
          </Button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('warranties.stats.total')}
                </CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('warranties.stats.active')}
                </CardTitle>
                <ShieldCheck className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{stats.active}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('warranties.stats.expiringSoon')}
                </CardTitle>
                <ShieldAlert className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">{stats.expiringSoon}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('warranties.stats.expired')}
                </CardTitle>
                <ShieldX className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{stats.expired}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Warranties List */}
        <Card>
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="w-full overflow-hidden rounded-md bg-muted p-1">
                <TabsList className="w-full bg-transparent p-0 overflow-x-auto whitespace-nowrap flex flex-nowrap gap-2 justify-start scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <TabsTrigger value="all" className="shrink-0 snap-start">
                    {t('warranties.tabs.all')} ({allWarranties.length})
                  </TabsTrigger>
                  <TabsTrigger value="active" className="shrink-0 snap-start">
                    {t('warranties.tabs.active')} ({activeWarranties.length})
                  </TabsTrigger>
                  <TabsTrigger value="expiring" className="shrink-0 snap-start">
                    {t('warranties.tabs.expiring')} ({expiringWarranties.length})
                  </TabsTrigger>
                  <TabsTrigger value="expired" className="shrink-0 snap-start">
                    {t('warranties.tabs.expired')} ({expiredWarranties.length})
                  </TabsTrigger>
                </TabsList>
              </div>
            </Tabs>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('common.loading')}
              </div>
            ) : getWarrantiesForTab().length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-1">{t('warranties.noWarranties')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('warranties.noWarrantiesText')}
                </p>
                <Button onClick={handleAddWarranty}>
                  <Plus className="h-4 w-4" />
                  {t('warranties.addWarranty')}
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {getWarrantiesForTab().map((warranty) => (
                  <Card
                    key={warranty.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleEditWarranty(warranty)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base line-clamp-1">
                          {warranty.productName}
                        </CardTitle>
                        {getStatusBadge(warranty)}
                      </div>
                      {warranty.storeName && (
                        <CardDescription className="flex items-center gap-1">
                          <Store className="h-3 w-3" />
                          {warranty.storeName}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {(warranty.fileUrl || warranty.fileUrl2) && (
                        <div className="grid grid-cols-2 gap-2">
                          {[warranty.fileUrl, warranty.fileUrl2]
                            .filter(Boolean)
                            .map((fileUrl, i) => {
                              const url = fileUrl as string
                              const isPdf = url.toLowerCase().endsWith('.pdf') || url.toLowerCase().includes('/raw/upload/')
                              return (
                                <button
                                  key={url}
                                  type="button"
                                  className="relative h-32 rounded-md overflow-hidden bg-muted border hover:border-primary transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openGallery(warranty, i)
                                  }}
                                >
                                  {isPdf ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                      <FileText className="h-10 w-10" />
                                      <span className="text-xs font-medium">PDF</span>
                                    </div>
                                  ) : (
                                    <img
                                      src={`${url}${url.includes('?') ? '&' : '?'}f_auto,q_auto`}
                                      alt={warranty.productName}
                                      className="w-full h-full object-contain"
                                    />
                                  )}
                                </button>
                              )
                            })}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(warranty.purchaseDate)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(warranty.warrantyExpires)}
                        </div>
                      </div>
                      {warranty.notes && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {warranty.notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Suspense fallback={null}>
          {galleryOpen && (
            <WarrantyGalleryModal
              open={galleryOpen}
              onOpenChange={setGalleryOpen}
              title={galleryTitle}
              images={galleryImages}
              initialIndex={galleryIndex}
            />
          )}
        </Suspense>

        {/* Modal */}
        <Suspense fallback={null}>
          {modalOpen && (
            <WarrantyModal
              open={modalOpen}
              onOpenChange={setModalOpen}
              warranty={selectedWarranty}
              mode={modalMode}
            />
          )}
        </Suspense>
      </div>
    </AppLayout>
  )
}
