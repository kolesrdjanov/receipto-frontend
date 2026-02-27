import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCurrencies, getCurrencyFlag } from '@/hooks/currencies/use-currencies'
import { cn } from '@/lib/utils'

interface CurrencySelectProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  id?: string
  className?: string
  triggerClassName?: string
  /** "compact" = flag + code, "full" = flag + name + symbol (default: "compact") */
  variant?: 'compact' | 'full'
  'data-testid'?: string
}

export function CurrencySelect({
  value,
  onValueChange,
  placeholder,
  id,
  className,
  triggerClassName,
  variant = 'compact',
  'data-testid': dataTestId,
}: CurrencySelectProps) {
  const { currencies } = useCurrencies()

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger id={id} className={cn(triggerClassName)} data-testid={dataTestId}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={className}>
        {currencies.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            <span className="flex items-center gap-2">
              <span>{getCurrencyFlag(c.icon)}</span>
              {variant === 'full' ? (
                <>
                  <span>{c.name}</span>
                  <span className="font-mono text-muted-foreground">{c.symbol}</span>
                </>
              ) : (
                <span>{c.code}</span>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}