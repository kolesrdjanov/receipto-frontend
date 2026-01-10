import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Calendar, Mail, ShieldCheck } from 'lucide-react'
import { Drawer, DrawerHeader, DrawerTitle, DrawerContent } from '@/components/ui/drawer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { Avatar } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDateTime } from '@/lib/date-utils'
import {
  useUserDetails,
  useUserCategories,
  useUserReceipts,
} from '@/hooks/admin/use-admin-users'

interface UserDetailsDrawerProps {
  userId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserDetailsDrawer({ userId, open, onOpenChange }: UserDetailsDrawerProps) {
  const { t } = useTranslation()
  const [categoriesPage, setCategoriesPage] = useState(1)
  const [receiptsPage, setReceiptsPage] = useState(1)

  const { data: userDetails, isLoading: isLoadingDetails } = useUserDetails(userId)
  const { data: categoriesData, isLoading: isLoadingCategories } = useUserCategories(
    userId,
    categoriesPage,
    5
  )
  const { data: receiptsData, isLoading: isLoadingReceipts } = useUserReceipts(
    userId,
    receiptsPage,
    10
  )

  const handleClose = () => {
    onOpenChange(false)
    // Reset pages when closing
    setTimeout(() => {
      setCategoriesPage(1)
      setReceiptsPage(1)
    }, 300)
  }

  if (!userId) return null

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerHeader onClose={handleClose}>
        <DrawerTitle>{t('admin.users.userDetails')}</DrawerTitle>
      </DrawerHeader>
      <DrawerContent>
        {isLoadingDetails ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : userDetails ? (
          <div className="space-y-6">
            {/* User Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.users.information')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar
                    firstName={userDetails.firstName}
                    lastName={userDetails.lastName}
                    imageUrl={userDetails.profileImageUrl}
                    size="2xl"
                  />
                  <div>
                    <h3 className="text-xl font-semibold">
                      {userDetails.firstName || userDetails.lastName
                        ? `${userDetails.firstName || ''} ${userDetails.lastName || ''}`.trim()
                        : t('admin.users.noName')}
                    </h3>
                    <p className="text-sm text-muted-foreground">{userDetails.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t('admin.users.emailLabel')}</p>
                      <p className="text-sm font-medium">{userDetails.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t('admin.users.roleLabel')}</p>
                      <p className="text-sm font-medium capitalize">{userDetails.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {t('admin.users.table.joined')}
                      </p>
                      <p className="text-sm font-medium">
                        {formatDateTime(userDetails.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 flex items-center justify-center text-muted-foreground">
                      📄
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {t('admin.users.table.receipts')}
                      </p>
                      <p className="text-sm font-medium">{userDetails.receiptCount}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs for Categories and Receipts */}
            <Tabs defaultValue="categories" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="categories">{t('admin.users.categories')}</TabsTrigger>
                <TabsTrigger value="receipts">{t('admin.users.receipts')}</TabsTrigger>
              </TabsList>

              {/* Categories Tab */}
              <TabsContent value="categories" className="space-y-4">
                {isLoadingCategories ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : categoriesData && categoriesData.data.length > 0 ? (
                  <>
                    <Card>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12"></TableHead>
                              <TableHead>{t('categories.name')}</TableHead>
                              <TableHead>{t('categories.description')}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {categoriesData.data.map((category) => (
                              <TableRow key={category.id}>
                                <TableCell>
                                  <div
                                    className="flex h-8 w-8 items-center justify-center rounded-full text-lg"
                                    style={{ backgroundColor: category.color + '20' }}
                                  >
                                    {category.icon}
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium">{category.name}</TableCell>
                                <TableCell className="text-muted-foreground">
                                  {category.description || '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                    {categoriesData.meta.totalPages > 1 && (
                      <Pagination
                        page={categoriesData.meta.page}
                        totalPages={categoriesData.meta.totalPages}
                        total={categoriesData.meta.total}
                        limit={categoriesData.meta.limit}
                        onPageChange={setCategoriesPage}
                      />
                    )}
                  </>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      {t('admin.users.noCategories')}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Receipts Tab */}
              <TabsContent value="receipts" className="space-y-4">
                {isLoadingReceipts ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : receiptsData && receiptsData.data.length > 0 ? (
                  <>
                    <Card>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t('receipts.table.store')}</TableHead>
                              <TableHead>{t('receipts.table.amount')}</TableHead>
                              <TableHead>{t('receipts.table.category')}</TableHead>
                              <TableHead>{t('receipts.table.date')}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {receiptsData.data.map((receipt) => (
                              <TableRow key={receipt.id}>
                                <TableCell className="font-medium">
                                  {receipt.storeName || '-'}
                                </TableCell>
                                <TableCell>
                                  {receipt.totalAmount
                                    ? `${Number(receipt.totalAmount).toFixed(2)} ${receipt.currency || 'RSD'}`
                                    : '-'}
                                </TableCell>
                                <TableCell>
                                  {receipt.category ? (
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="flex h-6 w-6 items-center justify-center rounded-full text-sm"
                                        style={{
                                          backgroundColor: receipt.category.color + '20',
                                        }}
                                      >
                                        {receipt.category.icon}
                                      </div>
                                      <span className="text-sm">{receipt.category.name}</span>
                                    </div>
                                  ) : (
                                    '-'
                                  )}
                                </TableCell>
                                <TableCell>
                                  {receipt.receiptDate
                                    ? formatDateTime(receipt.receiptDate)
                                    : '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                    {receiptsData.meta.totalPages > 1 && (
                      <Pagination
                        page={receiptsData.meta.page}
                        totalPages={receiptsData.meta.totalPages}
                        total={receiptsData.meta.total}
                        limit={receiptsData.meta.limit}
                        onPageChange={setReceiptsPage}
                      />
                    )}
                  </>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      {t('admin.users.noReceipts')}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </DrawerContent>
    </Drawer>
  )
}

