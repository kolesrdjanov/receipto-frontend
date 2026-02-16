export type ReceiptRank = 'none' | 'status_c' | 'status_b' | 'status_a'

export interface RankInfo {
  code: ReceiptRank
  minReceipts: number
  nameKey: string
}

export const rankOrder: RankInfo[] = [
  { code: 'none', minReceipts: 0, nameKey: 'settings.profile.rank.names.noStatus' },
  { code: 'status_c', minReceipts: 50, nameKey: 'settings.profile.rank.names.statusC' },
  { code: 'status_b', minReceipts: 75, nameKey: 'settings.profile.rank.names.statusB' },
  { code: 'status_a', minReceipts: 100, nameKey: 'settings.profile.rank.names.statusA' },
]

export function deriveRankByCount(receiptCount: number): ReceiptRank {
  if (receiptCount >= 100) return 'status_a'
  if (receiptCount >= 75) return 'status_b'
  if (receiptCount >= 50) return 'status_c'
  return 'none'
}

export function normalizeRank(_rank: ReceiptRank | undefined, receiptCount: number): ReceiptRank {
  return deriveRankByCount(receiptCount)
}

export function getRankInfo(rank: ReceiptRank): RankInfo {
  return rankOrder.find((item) => item.code === rank) || rankOrder[0]
}

export function getNextRank(rank: ReceiptRank): RankInfo | null {
  const idx = rankOrder.findIndex((item) => item.code === rank)
  if (idx < 0 || idx >= rankOrder.length - 1) return null
  return rankOrder[idx + 1]
}

export function getProgressToNextRank(rank: ReceiptRank, receiptCount: number): number {
  const current = getRankInfo(rank)
  const next = getNextRank(rank)
  if (!next) return 100

  const span = Math.max(next.minReceipts - current.minReceipts, 1)
  const progress = ((receiptCount - current.minReceipts) / span) * 100
  return Math.min(100, Math.max(0, progress))
}
