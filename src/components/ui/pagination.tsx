import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  limit: number
  onPageChange: (page: number) => void
}

/** Compact page list with ellipses: 1 … p-1 p p+1 … N (first + last always shown). */
function getPageList(page: number, totalPages: number): (number | '…')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const pages: (number | '…')[] = [1]
  const left = Math.max(2, page - 1)
  const right = Math.min(totalPages - 1, page + 1)
  if (left > 2) pages.push('…')
  for (let p = left; p <= right; p++) pages.push(p)
  if (right < totalPages - 1) pages.push('…')
  pages.push(totalPages)
  return pages
}

function PageBtn({
  children,
  on,
  disabled,
  onClick,
  label,
}: {
  children: React.ReactNode
  on?: boolean
  disabled?: boolean
  onClick?: () => void
  label?: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={on ? 'page' : undefined}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'grid h-8 min-w-8 place-items-center rounded-[9px] px-2 text-[13px] font-semibold transition-colors',
        on ? 'bg-foreground text-background' : 'text-fg-2 hover:bg-bg-subtle',
        'disabled:pointer-events-none disabled:opacity-40',
      )}
    >
      {children}
    </button>
  )
}

export function Pagination({ page, totalPages, total, limit, onPageChange }: PaginationProps) {
  const { t } = useTranslation()
  const start = total === 0 ? 0 : (page - 1) * limit + 1
  const end = Math.min(page * limit, total)
  const pages = getPageList(page, Math.max(1, totalPages))

  return (
    <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3 shadow-glass-1 sm:flex-row">
      <p className="t-sm text-muted-foreground">
        {t('common.pagination.showing', { from: start, to: end, total })}
      </p>
      <div className="flex items-center gap-1">
        <PageBtn
          label={t('common.pagination.previous')}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-[15px]" />
        </PageBtn>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="px-1 text-sm text-muted-foreground">
              …
            </span>
          ) : (
            <PageBtn key={p} on={p === page} onClick={() => onPageChange(p)}>
              {p}
            </PageBtn>
          ),
        )}
        <PageBtn
          label={t('common.pagination.next')}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="size-[15px]" />
        </PageBtn>
      </div>
    </div>
  )
}
