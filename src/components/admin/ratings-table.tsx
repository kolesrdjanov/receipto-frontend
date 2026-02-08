import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { Button } from '@/components/ui/button'
import { useAdminRatings, useAdminUpdateRating } from '@/hooks/ratings/use-ratings'
import { formatDateTime } from '@/lib/date-utils'
import { Loader2, Star, Globe, Check, X, MessageSquare, Send } from 'lucide-react'

interface RatingsTableProps {
  page: number
  onPageChange: (page: number) => void
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-muted-foreground/20'
          }`}
        />
      ))}
    </div>
  )
}

export function RatingsTable({ page, onPageChange }: RatingsTableProps) {
  const { t } = useTranslation()
  const { data: response, isLoading, error } = useAdminRatings(page, 20)
  const adminUpdate = useAdminUpdateRating()

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')

  const ratings = response?.data ?? []
  const meta = response?.meta

  const handleToggleApproval = (ratingId: string, currentApproved: boolean) => {
    adminUpdate.mutate({ id: ratingId, data: { isApproved: !currentApproved } })
  }

  const handleStartEditComment = (ratingId: string, currentComment?: string) => {
    setEditingCommentId(ratingId)
    setCommentText(currentComment || '')
  }

  const handleSaveComment = (ratingId: string) => {
    adminUpdate.mutate(
      { id: ratingId, data: { adminComment: commentText || undefined } },
      { onSuccess: () => setEditingCommentId(null) },
    )
  }

  const handleCancelComment = () => {
    setEditingCommentId(null)
    setCommentText('')
  }

  return (
    <>
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="p-8">
            <p className="text-center text-destructive">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !error && ratings.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-muted-foreground">
              {t('admin.ratings.noRatings')}
            </CardTitle>
          </CardHeader>
        </Card>
      )}

      {/* Mobile Card View */}
      {!isLoading && !error && ratings.length > 0 && (
        <div className="md:hidden space-y-4">
          {meta && (
            <div className="text-sm font-medium text-muted-foreground">
              {t('admin.ratings.totalRatings', { count: meta.total })}
            </div>
          )}
          {ratings.map((rating) => (
            <Card key={rating.id}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      firstName={rating.user?.firstName}
                      lastName={rating.user?.lastName}
                      imageUrl={rating.user?.profileImageUrl}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {rating.user?.firstName || rating.user?.lastName
                          ? `${rating.user?.firstName || ''} ${rating.user?.lastName || ''}`.trim()
                          : rating.user?.email}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{rating.user?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <StarDisplay rating={rating.rating} />
                    <div className="flex items-center gap-2">
                      {rating.isPublic && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <Globe className="h-3 w-3" />
                          {t('admin.ratings.table.public')}
                        </span>
                      )}
                      <button
                        onClick={() => handleToggleApproval(rating.id, rating.isApproved)}
                        disabled={adminUpdate.isPending}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full transition-colors ${
                          rating.isApproved
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                        }`}
                      >
                        {rating.isApproved ? (
                          <><Check className="h-3 w-3" />{t('admin.ratings.table.approved')}</>
                        ) : (
                          <><X className="h-3 w-3" />{t('admin.ratings.table.pending')}</>
                        )}
                      </button>
                    </div>
                  </div>

                  {rating.description && (
                    <p className="text-sm text-muted-foreground">{rating.description}</p>
                  )}

                  {/* Admin Comment Section - Mobile */}
                  {editingCommentId === rating.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder={t('admin.ratings.table.addComment')}
                        maxLength={1000}
                        rows={3}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveComment(rating.id)}
                          disabled={adminUpdate.isPending}
                        >
                          <Send className="h-3 w-3 mr-1" />
                          {t('admin.ratings.table.saveComment')}
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelComment}>
                          {t('admin.ratings.table.cancelComment')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {rating.adminComment ? (
                        <div className="p-2 rounded-md bg-muted/50 text-sm">
                          <p className="text-xs font-medium text-muted-foreground mb-1">{t('admin.ratings.table.comment')}</p>
                          <p className="text-foreground">{rating.adminComment}</p>
                          <button
                            onClick={() => handleStartEditComment(rating.id, rating.adminComment)}
                            className="text-xs text-primary mt-1 hover:underline"
                          >
                            {t('admin.ratings.table.editComment')}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEditComment(rating.id)}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <MessageSquare className="h-3 w-3" />
                          {t('admin.ratings.table.addComment')}
                        </button>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    {formatDateTime(rating.createdAt)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {meta && meta.totalPages > 1 && (
            <div className="pt-2">
              <Pagination
                page={meta.page}
                totalPages={meta.totalPages}
                total={meta.total}
                limit={meta.limit}
                onPageChange={onPageChange}
              />
            </div>
          )}
        </div>
      )}

      {/* Desktop Table View */}
      {!isLoading && !error && ratings.length > 0 && (
        <Card className="hidden md:block">
          <CardHeader>
            <CardTitle>
              {t('admin.ratings.totalRatings', { count: meta?.total || 0 })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.ratings.table.user')}</TableHead>
                  <TableHead>{t('admin.ratings.table.rating')}</TableHead>
                  <TableHead className="max-w-[250px]">{t('admin.ratings.table.description')}</TableHead>
                  <TableHead>{t('admin.ratings.table.public')}</TableHead>
                  <TableHead>{t('admin.ratings.table.approved')}</TableHead>
                  <TableHead className="max-w-[250px]">{t('admin.ratings.table.comment')}</TableHead>
                  <TableHead>{t('admin.ratings.table.date')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ratings.map((rating) => (
                  <TableRow key={rating.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar
                          firstName={rating.user?.firstName}
                          lastName={rating.user?.lastName}
                          imageUrl={rating.user?.profileImageUrl}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {rating.user?.firstName || rating.user?.lastName
                              ? `${rating.user?.firstName || ''} ${rating.user?.lastName || ''}`.trim()
                              : '-'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{rating.user?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StarDisplay rating={rating.rating} />
                    </TableCell>
                    <TableCell className="max-w-[250px]">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {rating.description || '-'}
                      </p>
                    </TableCell>
                    <TableCell>
                      {rating.isPublic ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <Globe className="h-3 w-3" />
                          {t('admin.ratings.table.public')}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">{t('admin.ratings.table.private')}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleToggleApproval(rating.id, rating.isApproved)}
                        disabled={adminUpdate.isPending}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full transition-colors cursor-pointer ${
                          rating.isApproved
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                        }`}
                      >
                        {rating.isApproved ? (
                          <><Check className="h-3 w-3" />{t('admin.ratings.table.approved')}</>
                        ) : (
                          <><X className="h-3 w-3" />{t('admin.ratings.table.pending')}</>
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="max-w-[250px]">
                      {editingCommentId === rating.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder={t('admin.ratings.table.addComment')}
                            maxLength={1000}
                            rows={2}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          />
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSaveComment(rating.id)}
                              disabled={adminUpdate.isPending}
                              className="h-7 px-2 text-xs"
                            >
                              <Send className="h-3 w-3 mr-1" />
                              {t('admin.ratings.table.saveComment')}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelComment}
                              className="h-7 px-2 text-xs"
                            >
                              {t('admin.ratings.table.cancelComment')}
                            </Button>
                          </div>
                        </div>
                      ) : rating.adminComment ? (
                        <div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{rating.adminComment}</p>
                          <button
                            onClick={() => handleStartEditComment(rating.id, rating.adminComment)}
                            className="text-xs text-primary hover:underline mt-1"
                          >
                            {t('admin.ratings.table.editComment')}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEditComment(rating.id)}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <MessageSquare className="h-3 w-3" />
                          {t('admin.ratings.table.addComment')}
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDateTime(rating.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {meta && meta.totalPages > 1 && (
              <div className="mt-4">
                <Pagination
                  page={meta.page}
                  totalPages={meta.totalPages}
                  total={meta.total}
                  limit={meta.limit}
                  onPageChange={onPageChange}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  )
}
