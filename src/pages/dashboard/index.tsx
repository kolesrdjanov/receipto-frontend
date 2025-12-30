import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from 'react-router-dom'
import { AppLayout } from '@/components/layout/app-layout'
import { useDashboardStats } from '@/hooks/dashboard/use-dashboard'
import { Loader2, Receipt, FolderOpen, Clock } from 'lucide-react'

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats()

  const formatAmount = (amount?: number, currency?: string) => {
    if (amount === undefined || amount === null) return '0'
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: currency || 'RSD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('sr-RS', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <AppLayout>
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl font-bold tracking-tight mb-2 md:text-3xl">Dashboard</h2>
        <p className="text-sm text-muted-foreground md:text-base">Manage your receipts and categories</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          <Link to="/receipts">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats?.totalReceipts ?? 0}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatAmount(stats?.totalAmount, stats?.currency)} total
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/categories">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Categories</CardTitle>
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats?.totalCategories ?? 0}</p>
                <p className="text-sm text-muted-foreground mt-1">Available categories</p>
              </CardContent>
            </Card>
          </Link>

          <Card className="sm:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {stats?.recentReceipts && stats.recentReceipts.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentReceipts.slice(0, 5).map((receipt) => (
                    <Link
                      key={receipt.id}
                      to="/receipts"
                      className="flex items-center justify-between text-sm hover:bg-accent rounded-md p-2 -mx-2 transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium truncate max-w-[150px]">
                          {receipt.storeName || 'Unknown Store'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(receipt.receiptDate || receipt.createdAt)}
                        </span>
                      </div>
                      <span className="font-medium">
                        {formatAmount(receipt.totalAmount, receipt.currency)}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </AppLayout>
  )
}
