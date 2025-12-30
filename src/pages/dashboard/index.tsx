import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from 'react-router-dom'
import { AppLayout } from '@/components/layout/app-layout'

export default function Dashboard() {
  return (
    <AppLayout>
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl font-bold tracking-tight mb-2 md:text-3xl">Dashboard</h2>
        <p className="text-sm text-muted-foreground md:text-base">Manage your receipts and categories</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        <Link to="/receipts">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Receipts</CardTitle>
              <CardDescription>View and manage all your receipts</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Total receipts</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/categories">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>Organize receipts by category</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Total categories</p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest uploads</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
