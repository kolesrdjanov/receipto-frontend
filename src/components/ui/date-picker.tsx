"use client"

import * as React from "react"
import { format, parse, getYear, getMonth, setMonth, setYear } from "date-fns"
import { enUS, srLatn } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const locales = {
  en: enUS,
  sr: srLatn,
}

interface DatePickerProps {
  /** Date value in YYYY-MM-DD format */
  value?: string
  /** Callback when date changes, returns YYYY-MM-DD format */
  onChange?: (value: string) => void
  /** Placeholder text when no date is selected */
  placeholder?: string
  /** Whether the date picker is disabled */
  disabled?: boolean
  /** Additional className for the trigger button */
  className?: string
  /** ID for the trigger button */
  id?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  id,
}: DatePickerProps) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = React.useState(false)

  const locale = locales[i18n.language as keyof typeof locales] || enUS

  // Parse the string date to a Date object for the calendar
  const selectedDate = React.useMemo(() => {
    if (!value) return undefined
    try {
      return parse(value, "yyyy-MM-dd", new Date())
    } catch {
      return undefined
    }
  }, [value])

  // For month navigation
  const [month, setMonthState] = React.useState<Date>(selectedDate || new Date())

  // Update month when selected date changes
  React.useEffect(() => {
    if (selectedDate) {
      setMonthState(selectedDate)
    }
  }, [selectedDate])

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange?.(format(date, "yyyy-MM-dd"))
    } else {
      onChange?.("")
    }
    setOpen(false)
  }

  const handleMonthChange = (newMonth: string) => {
    const newDate = setMonth(month, parseInt(newMonth))
    setMonthState(newDate)
  }

  const handleYearChange = (newYear: string) => {
    const newDate = setYear(month, parseInt(newYear))
    setMonthState(newDate)
  }

  const displayValue = selectedDate
    ? format(selectedDate, "dd.MM.yyyy")
    : null

  // Generate years array (100 years back to 50 years forward from current year)
  const currentYear = getYear(new Date())
  const years = Array.from({ length: 151 }, (_, i) => currentYear - 100 + i)

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center gap-2 rounded-lg border border-border bg-card px-3 text-left text-sm transition-[border-color,box-shadow]",
            "focus:outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
        >
          <CalendarIcon className="size-4 shrink-0 text-fg-faint" />
          <span
            className={cn(
              "flex-1 truncate text-base font-medium text-foreground md:text-sm",
              !displayValue && "text-muted-foreground"
            )}
          >
            {displayValue ?? placeholder ?? t("common.pickDate")}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="grid grid-cols-2 gap-2 px-3 pt-3">
          <Select
            value={getMonth(month).toString()}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger className="h-8 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={getYear(month).toString()}
            onValueChange={handleYearChange}
          >
            <SelectTrigger className="h-8 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          month={month}
          onMonthChange={setMonthState}
          locale={locale}
          initialFocus
          hideNavigation
        />
      </PopoverContent>
    </Popover>
  )
}
