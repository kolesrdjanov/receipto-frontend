import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AppLayout } from '@/components/layout/app-layout'
import { ReceiptModal } from '@/components/receipts/receipt-modal'
import { QrScanner } from '@/components/receipts/qr-scanner'
import {
  useReceipts,
  useCreateReceipt,
  type Receipt,
} from '@/hooks/receipts/use-receipts'
import { Camera, Plus, Pencil, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function Receipts() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')

  const { data: receipts = [], isLoading } = useReceipts()
  const createReceipt = useCreateReceipt()

  const handleAddManually = () => {
    setSelectedReceipt(null)
    setModalMode('create')
    setIsModalOpen(true)
  }

  const handleEditReceipt = (receipt: Receipt) => {
    setSelectedReceipt(receipt)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleScanQr = () => {
    setIsScannerOpen(true)
  }

  const handleQrScan = async (url: string) => {
    try {
      await createReceipt.mutateAsync({ qrCodeUrl: url })
      toast.success('Receipt scanned successfully', {
        description: 'The receipt data will be extracted shortly.',
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred'
      toast.error('Failed to create receipt from QR code', {
        description: errorMessage,
      })
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString()
  }

  const formatAmount = (amount?: number) => {
    if (amount === undefined || amount === null) return '-'
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'RSD',
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scraped':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            Completed
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            Pending
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            Failed
          </span>
        )
      default:
        return null
    }
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Receipts</h2>
          <p className="text-muted-foreground">View and manage all your receipts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAddManually}>
            <Plus className="h-4 w-4 mr-2" />
            Add Manually
          </Button>
          <Button onClick={handleScanQr} disabled={createReceipt.isPending}>
            {createReceipt.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Camera className="h-4 w-4 mr-2" />
            )}
            Scan QR Code
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : receipts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-muted-foreground">No receipts yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-center text-muted-foreground">
              Scan a QR code or add a receipt manually to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipts.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell className="font-medium">
                    {receipt.storeName || 'Unknown Store'}
                  </TableCell>
                  <TableCell>{formatAmount(receipt.totalAmount)}</TableCell>
                  <TableCell>{formatDate(receipt.receiptDate)}</TableCell>
                  <TableCell>
                    {receipt.category ? (
                      <span className="inline-flex items-center gap-1">
                        {receipt.category.icon && (
                          <span>{receipt.category.icon}</span>
                        )}
                        <span
                          style={{
                            color: receipt.category.color || 'inherit',
                          }}
                        >
                          {receipt.category.name}
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(receipt.status)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditReceipt(receipt)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <ReceiptModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        receipt={selectedReceipt}
        mode={modalMode}
      />

      <QrScanner
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onScan={handleQrScan}
      />
    </AppLayout>
  )
}
