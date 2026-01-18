import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useProduct, useFrequentItems, useDeleteProduct } from '@/hooks/items/use-items'
import { useSettingsStore } from '@/store/settings'
import { PriceHistoryChart } from '@/components/items/price-history-chart'
import { StoreComparison } from '@/components/items/store-comparison'
import { Loader2, ArrowLeft, Package, ShoppingCart, Calendar, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: product, isLoading: productLoading } = useProduct(id || '')
  const { data: frequentItemsResponse } = useFrequentItems({ limit: 100 })
  const frequentItems = frequentItemsResponse?.data
  const { currency } = useSettingsStore()
  const deleteProduct = useDeleteProduct()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleDelete = async () => {
    if (!id) return

    try {
      await deleteProduct.mutateAsync(id)
      toast.success(t('items.deleteSuccess'))
      navigate('/items')
    } catch {
      toast.error(t('items.deleteError'))
    }
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: currency || 'RSD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Find item stats from frequent items
  const itemStats = frequentItems?.find((item) => item.id === id)

  if (productLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  if (!product) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 mb-4 text-muted-foreground" />
          <p className="text-lg text-muted-foreground">Product not found</p>
          <Link to="/items">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4" />
              {t('items.viewAll')}
            </Button>
          </Link>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Link to="/items">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              {t('items.title')}
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
            {t('common.delete')}
          </Button>
        </div>

        <h2 className="text-2xl font-bold tracking-tight mb-2 md:text-3xl">
          {product.displayName}
        </h2>
        {product.category && (
          <p className="text-sm text-muted-foreground">{product.category}</p>
        )}
      </div>

      {/* Quick Stats */}
      {itemStats && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                {t('items.avgPrice')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-lg sm:text-2xl font-bold">{formatPrice(itemStats.avgPrice)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                {t('items.priceRange')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-lg sm:text-2xl font-bold">
                <span className="block sm:inline">{formatPrice(itemStats.minPrice)}</span>
                <span className="hidden sm:inline"> - </span>
                <span className="block sm:inline text-muted-foreground sm:text-foreground">
                  {formatPrice(itemStats.maxPrice)}
                </span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
                {t('items.purchases')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-lg sm:text-2xl font-bold">{itemStats.purchaseCount}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {itemStats.stores.length} {t('items.stores')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                {t('items.lastPurchase')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-lg sm:text-2xl font-bold">{formatPrice(itemStats.lastPrice)}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {format(new Date(itemStats.lastPurchaseDate), 'MMM d, yyyy')}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <PriceHistoryChart productId={id!} />
        <StoreComparison productId={id!} />
      </div>

      {/* Aliases */}
      {product.aliases && product.aliases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Product Name Variations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {product.aliases.map((alias) => (
                <span
                  key={alias.id}
                  className="px-3 py-1 bg-muted rounded-full text-sm"
                >
                  {alias.aliasName}
                  {alias.storeName && (
                    <span className="text-muted-foreground ml-1">({alias.storeName})</span>
                  )}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('items.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('items.deleteConfirmDescription', { name: product.displayName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={deleteProduct.isPending}
            >
              {deleteProduct.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  )
}
