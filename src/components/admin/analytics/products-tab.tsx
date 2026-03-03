import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp, Search } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8"></TableHead>
            <TableHead>{t('analytics.productName')}</TableHead>
            <TableHead className="text-right">{t('analytics.purchases')}</TableHead>
            <TableHead className="text-right">{t('analytics.avgPrice')}</TableHead>
            <TableHead className="text-right">{t('analytics.priceRange')}</TableHead>
            <TableHead className="text-right">{t('analytics.stores')}</TableHead>
            <TableHead className="text-right">{t('analytics.buyers')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">{t('common.loading')}</TableCell></TableRow>
          ) : !filtered?.length ? (
            <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">{t('analytics.noData')}</TableCell></TableRow>
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
        </TableBody>
      </Table>
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
      <TableRow className="cursor-pointer" onClick={onToggle}>
        <TableCell><Icon className="h-4 w-4 text-muted-foreground" /></TableCell>
        <TableCell className="font-medium">{product.displayName}</TableCell>
        <TableCell className="text-right">{product.purchaseCount}</TableCell>
        <TableCell className="text-right">{Number(product.avgPrice).toLocaleString()} {product.currency}</TableCell>
        <TableCell className="text-right">{Number(product.minPrice).toLocaleString()} - {Number(product.maxPrice).toLocaleString()}</TableCell>
        <TableCell className="text-right">{product.storeCount}</TableCell>
        <TableCell className="text-right">{product.uniqueBuyers}</TableCell>
      </TableRow>
      {isExpanded && prices && prices.length > 0 && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={7} className="bg-muted/20">
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
          </TableCell>
        </TableRow>
      )}
    </>
  )
}
