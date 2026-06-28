// The receipts filter chip is the app-wide `Chip` primitive. Kept as a thin re-export
// so existing receipts imports stay stable; new code should import `Chip` directly.
export { Chip as FilterChip, type ChipProps as FilterChipProps } from '@/components/glass/chip'
