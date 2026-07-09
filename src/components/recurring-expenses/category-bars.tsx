import type { CategoryChartItem } from '@/components/recurring-expenses/category-breakdown'

/** Calm monthly-equivalent bars — the demoted, secondary category breakdown. */
export function CategoryBars({
  data,
  formatAmount,
}: {
  data: CategoryChartItem[]
  formatAmount: (value: number) => string
}) {
  const total = data.reduce((sum, c) => sum + c.value, 0) || 1
  return (
    <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
      {data.map((c) => {
        const pct = c.value / total
        return (
          <div key={c.name}>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="grid size-6 shrink-0 place-items-center rounded-md text-[13px]"
                  style={{ background: (c.color || '#888') + '24' }}
                >
                  {c.icon}
                </span>
                <span className="truncate text-[13px] font-medium">{c.name}</span>
              </span>
              <span className="shrink-0 text-[12.5px] text-muted-foreground">
                {formatAmount(c.value)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-bg-subtle">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.max(6, pct * 100)}%`, background: c.color || '#888' }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
