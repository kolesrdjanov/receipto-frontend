"use client"

import * as React from "react"
import { format, parse, getYear, getMonth, setMonth, setYear } from "date-fns"
import { enUS, sr } from "date-fns/locale"
import { ChevronDown } from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
  sr: sr,
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
    ? format(selectedDate, "M/d/yyyy")
    : null

  // Generate years array (100 years back from current year)
  const currentYear = getYear(new Date())
  const years = Array.from({ length: 101 }, (_, i) => currentYear - 100 + i)

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-between text-left font-normal",
            !displayValue && "text-muted-foreground",
            className
          )}
        >
          <span>{displayValue ?? placeholder ?? t("common.pickDate")}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex items-center justify-between gap-2 px-3 pt-3">
          <Select
            value={getMonth(month).toString()}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger className="h-8 w-[110px]">
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
            <SelectTrigger className="h-8 w-[80px]">
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
