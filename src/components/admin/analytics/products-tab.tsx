import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp, Search } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useAnalyticsTopProducts, useAnalyticsProductPrices, type AnalyticsFilters } from '@/hooks/admin/use-analytics'

interface ProductsTabProps {
  filters: AnalyticsFilters
}

export function ProductsTab({ filters }: ProductsTabProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const debouncedSearch = useDebouncedValue(search, 300)

  const { data: products, isLoading } = useAnalyticsTopProducts(filters)

  const filtered = products?.filter((p) =>
    !debouncedSearch || p.displayName.toLowerCase().includes(debouncedSearch.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={t('analytics.searchProducts')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-background"
        />
      </div>

      {/* Products table */}
      <div className="rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium w-8"></th>
                <th className="text-left p-3 font-medium">{t('analytics.productName')}</th>
                <th className="text-right p-3 font-medium">{t('analytics.purchases')}</th>
                <th className="text-right p-3 font-medium">{t('analytics.avgPrice')}</th>
                <th className="text-right p-3 font-medium">{t('analytics.priceRange')}</th>
                <th className="text-right p-3 font-medium">{t('analytics.stores')}</th>
                <th className="text-right p-3 font-medium">{t('analytics.buyers')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">{t('common.loading')}</td></tr>
              ) : !filtered?.length ? (
                <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">{t('analytics.noData')}</td></tr>
              ) : (
                filtered.map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    isExpanded={expandedId === product.id}
                    onToggle={() => setExpandedId(expandedId === product.id ? null : product.id)}
                    filters={filters}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ProductRow({ product, isExpanded, onToggle, filters }: {
  product: any
  isExpanded: boolean
  onToggle: () => void
  filters: AnalyticsFilters
}) {
  const { t } = useTranslation()
  const { data: prices } = useAnalyticsProductPrices(
    product.id,
    isExpanded ? { dateFrom: filters.dateFrom, dateTo: filters.dateTo } : undefined,
  )

  const Icon = isExpanded ? ChevronUp : ChevronDown

  return (
    <>
      <tr className="border-b hover:bg-muted/30 cursor-pointer" onClick={onToggle}>
        <td className="p-3"><Icon className="h-4 w-4 text-muted-foreground" /></td>
        <td className="p-3 font-medium">{product.displayName}</td>
        <td className="p-3 text-right">{product.purchaseCount}</td>
        <td className="p-3 text-right">{Number(product.avgPrice).toLocaleString()} {product.currency}</td>
        <td className="p-3 text-right">{Number(product.minPrice).toLocaleString()} - {Number(product.maxPrice).toLocaleString()}</td>
        <td className="p-3 text-right">{product.storeCount}</td>
        <td className="p-3 text-right">{product.uniqueBuyers}</td>
      </tr>
      {isExpanded && prices && prices.length > 0 && (
        <tr>
          <td colSpan={7} className="p-4 bg-muted/20">
            <div className="max-w-2xl">
              <p className="text-xs font-medium text-muted-foreground mb-3">{t('analytics.priceByChain')}</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={prices} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="chainName" type="category" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0]
                      return (
                        <div className="bg-popover/95 backdrop-blur-sm border border-border/50 rounded-xl shadow-xl p-3">
                          <p className="font-semibold text-sm">{d.payload.chainName}</p>
                          <p className="text-sm">{Number(d.value).toLocaleString()} {prices[0]?.currency || ''}</p>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="avgPrice" name={t('analytics.avgPrice')} fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
