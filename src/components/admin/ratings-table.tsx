import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAdminRatings, useAdminUpdateRating } from '@/hooks/ratings/use-ratings'
import { formatDateTime } from '@/lib/date-utils'
import { EmptyState } from '@/components/glass/empty-state'
import { AdminCard, AdminCardHead, Pill } from '@/components/admin/primitives'
import { Loader2, Star, Globe, Check, X, MessageSquare, Send, Sparkles } from 'lucide-react'

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
          className={`size-[15px] ${star <= rating ? 'fill-warning text-warning' : 'text-border'}`}
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

  const handleToggleFeatured = (ratingId: string, currentFeatured: boolean) => {
    adminUpdate.mutate({ id: ratingId, data: { isFeatured: !currentFeatured } })
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

  const approvedPill = (id: string, approved: boolean) => (
    <Pill
      tone={approved ? 'emerald' : 'warn'}
      icon={approved ? Check : X}
      onClick={() => handleToggleApproval(id, approved)}
      disabled={adminUpdate.isPending}
    >
      {approved ? t('admin.ratings.table.approved') : t('admin.ratings.table.pending')}
    </Pill>
  )

  const featuredPill = (id: string, featured: boolean) => (
    <Pill
      tone={featured ? 'violet' : 'neutral'}
      icon={Sparkles}
      onClick={() => handleToggleFeatured(id, featured)}
      disabled={adminUpdate.isPending}
    >
      {featured ? t('admin.ratings.table.featured') : t('admin.ratings.table.notFeatured')}
    </Pill>
  )

  const commentEditor = (ratingId: string, mobile?: boolean) => (
    <div className="space-y-2">
      <Textarea
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        placeholder={t('admin.ratings.table.addComment')}
        maxLength={1000}
        rows={mobile ? 3 : 2}
      />
      <div className="flex gap-1.5">
        <Button size="sm" variant="outline" className="h-8" onClick={() => handleSaveComment(ratingId)} disabled={adminUpdate.isPending}>
          <Send className="size-3.5" />
          {t('admin.ratings.table.saveComment')}
        </Button>
        <Button size="sm" variant="ghost" className="h-8" onClick={handleCancelComment}>
          {t('admin.ratings.table.cancelComment')}
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <AdminCard className="p-8">
          <p className="text-center text-destructive">{error instanceof Error ? error.message : 'Unknown error'}</p>
        </AdminCard>
      )}

      {/* Empty State */}
      {!isLoading && !error && ratings.length === 0 && (
        <EmptyState compact icon={Star} title={t('admin.ratings.noRatings')} />
      )}

      {/* Mobile Card View */}
      {!isLoading && !error && ratings.length > 0 && (
        <div className="space-y-4 md:hidden">
          {meta && (
            <div className="text-sm font-semibold">{t('admin.ratings.totalRatings', { count: meta.total })}</div>
          )}
          {ratings.map((rating) => (
            <div key={rating.id} className="rounded-2xl border border-border bg-card p-4 shadow-glass-1">
              <div className="flex items-center gap-3">
                <Avatar firstName={rating.user?.firstName} lastName={rating.user?.lastName} imageUrl={rating.user?.profileImageUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {rating.user?.firstName || rating.user?.lastName
                      ? `${rating.user?.firstName || ''} ${rating.user?.lastName || ''}`.trim()
                      : rating.user?.email}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{rating.user?.email}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <StarDisplay rating={rating.rating} />
                <div className="flex flex-wrap items-center gap-1.5">
                  {rating.isPublic && <Pill tone="emerald" icon={Globe}>{t('admin.ratings.table.public')}</Pill>}
                  {approvedPill(rating.id, rating.isApproved)}
                </div>
              </div>

              {rating.description && <p className="mt-3 text-sm text-muted-foreground">{rating.description}</p>}

              <div className="mt-3">
                {editingCommentId === rating.id ? (
                  commentEditor(rating.id, true)
                ) : rating.adminComment ? (
                  <div className="rounded-xl bg-bg-subtle/60 p-2.5 text-sm">
                    <p className="t-xs mb-1 text-muted-foreground">{t('admin.ratings.table.comment')}</p>
                    <p>{rating.adminComment}</p>
                    <Button variant="link" className="mt-1 h-auto p-0 text-[12px]" onClick={() => handleStartEditComment(rating.id, rating.adminComment)}>
                      {t('admin.ratings.table.editComment')}
                    </Button>
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" className="h-auto gap-1.5 px-2 py-1 text-[12px] text-muted-foreground" onClick={() => handleStartEditComment(rating.id)}>
                    <MessageSquare className="size-3.5" />
                    {t('admin.ratings.table.addComment')}
                  </Button>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                {featuredPill(rating.id, rating.isFeatured)}
                <span className="text-xs text-muted-foreground">{formatDateTime(rating.createdAt)}</span>
              </div>
            </div>
          ))}

          {meta && meta.totalPages > 1 && (
            <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={onPageChange} />
          )}
        </div>
      )}

      {/* Desktop Table View */}
      {!isLoading && !error && ratings.length > 0 && (
        <AdminCard className="hidden md:block">
          <AdminCardHead title={t('admin.ratings.totalRatings', { count: meta?.total || 0 })} />
          <div className="mt-3 overflow-x-auto custom-scrollbar">
            <table className="w-full caption-bottom text-sm">
              <TableHeader className="bg-transparent">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5 sm:pl-[22px]">{t('admin.ratings.table.user')}</TableHead>
                  <TableHead>{t('admin.ratings.table.rating')}</TableHead>
                  <TableHead className="max-w-[250px]">{t('admin.ratings.table.description')}</TableHead>
                  <TableHead>{t('admin.ratings.table.public')}</TableHead>
                  <TableHead>{t('admin.ratings.table.approved')}</TableHead>
                  <TableHead>{t('admin.ratings.table.featured')}</TableHead>
                  <TableHead className="max-w-[250px]">{t('admin.ratings.table.comment')}</TableHead>
                  <TableHead className="pr-5 sm:pr-[22px]">{t('admin.ratings.table.date')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ratings.map((rating) => (
                  <TableRow key={rating.id}>
                    <TableCell className="pl-5 sm:pl-[22px]">
                      <div className="flex items-center gap-3">
                        <Avatar firstName={rating.user?.firstName} lastName={rating.user?.lastName} imageUrl={rating.user?.profileImageUrl} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold">
                            {rating.user?.firstName || rating.user?.lastName
                              ? `${rating.user?.firstName || ''} ${rating.user?.lastName || ''}`.trim()
                              : '–'}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{rating.user?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><StarDisplay rating={rating.rating} /></TableCell>
                    <TableCell className="max-w-[250px]">
                      <p className="line-clamp-2 text-sm text-muted-foreground">{rating.description || '–'}</p>
                    </TableCell>
                    <TableCell>
                      {rating.isPublic
                        ? <Pill tone="emerald" icon={Globe}>{t('admin.ratings.table.public')}</Pill>
                        : <Pill tone="neutral">{t('admin.ratings.table.private')}</Pill>}
                    </TableCell>
                    <TableCell>{approvedPill(rating.id, rating.isApproved)}</TableCell>
                    <TableCell>{featuredPill(rating.id, rating.isFeatured)}</TableCell>
                    <TableCell className="max-w-[250px]">
                      {editingCommentId === rating.id ? (
                        commentEditor(rating.id)
                      ) : rating.adminComment ? (
                        <div>
                          <p className="line-clamp-2 text-sm text-muted-foreground">{rating.adminComment}</p>
                          <Button variant="link" className="mt-1 h-auto p-0 text-[12px]" onClick={() => handleStartEditComment(rating.id, rating.adminComment)}>
                            {t('admin.ratings.table.editComment')}
                          </Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" className="h-auto gap-1.5 px-2 py-1 text-[12px] text-muted-foreground" onClick={() => handleStartEditComment(rating.id)}>
                          <MessageSquare className="size-3.5" />
                          {t('admin.ratings.table.addComment')}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap pr-5 text-sm text-muted-foreground sm:pr-[22px]">
                      {formatDateTime(rating.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </table>
          </div>
          {meta && meta.totalPages > 1 && (
            <div className="border-t border-hairline-soft px-5 py-4 sm:px-[22px]">
              <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={onPageChange} />
            </div>
          )}
        </AdminCard>
      )}
    </>
  )
}
