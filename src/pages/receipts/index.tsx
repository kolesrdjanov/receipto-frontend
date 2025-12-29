import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AppLayout } from '@/components/layout/app-layout'

export default function Receipts() {
  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Receipts</h2>
          <p className="text-muted-foreground">View and manage all your receipts</p>
        </div>
        <Button>Upload Receipt</Button>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-muted-foreground">No receipts yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-center text-muted-foreground">
              Upload your first receipt to get started
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
