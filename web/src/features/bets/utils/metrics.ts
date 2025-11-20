import type { Bet } from '../../../lib/types'

export interface EquityPoint {
  date: string
  profit: number
  roi: number
}

export interface BreakdownEntry {
  key: string
  label: string
  count: number
  profit: number
  stake: number
  winRate: number
}

export type InsightTone = 'positive' | 'warning' | 'info'

export interface InsightItem {
  tone: InsightTone
  message: string
}

const LOSS_STATUSES = new Set(['lost', 'void', 'cashed_out', 'cancelled'])
const WIN_STATUS = 'won'

export function calculateEquityCurve(bets: Bet[]): EquityPoint[] {
  if (!bets.length) return []

  const sorted = [...bets].sort((a, b) => new Date(a.placed_at).getTime() - new Date(b.placed_at).getTime())

  let runningProfit = 0
  let runningStake = 0

  return sorted.map((bet) => {
    runningProfit += Number(bet.result_amount ?? 0)
    runningStake += Number(bet.stake ?? 0)
    return {
      date: bet.placed_at,
      profit: runningProfit,
      roi: runningStake === 0 ? 0 : (runningProfit / runningStake) * 100,
    }
  })
}

export function buildBreakdown(bets: Bet[], key: keyof Pick<Bet, 'bankroll_id' | 'bookmaker_id' | 'event_id'>): BreakdownEntry[] {
  if (!bets.length) return []

  const map = new Map<string, BreakdownEntry>()

  for (const bet of bets) {
    const bucketKey = String(bet[key] ?? 'sin-dato')
    const current = map.get(bucketKey) ?? {
      key: bucketKey,
      label: bucketKey === 'sin-dato' ? 'Sin asignar' : formatLabel(bucketKey),
      count: 0,
      profit: 0,
      stake: 0,
      winRate: 0,
    }

    current.count += 1
    current.profit += Number(bet.result_amount ?? 0)
    current.stake += Number(bet.stake ?? 0)
    current.winRate += bet.status === WIN_STATUS ? 1 : 0

    map.set(bucketKey, current)
  }

  return Array.from(map.values())
    .map((entry) => ({
      ...entry,
      winRate: entry.count === 0 ? 0 : (entry.winRate / entry.count) * 100,
    }))
    .sort((a, b) => b.profit - a.profit)
}

function formatLabel(value: string) {
  if (value.length <= 10) return value
  return `${value.slice(0, 6)}…`
}

export function generateInsights(bets: Bet[]): InsightItem[] {
  if (!bets.length) {
    return [{ tone: 'info', message: 'Añade tus primeras apuestas para generar insights.' }]
  }

  const insights: InsightItem[] = []
  const totalStake = bets.reduce((acc, bet) => acc + Number(bet.stake ?? 0), 0)
  const totalProfit = bets.reduce((acc, bet) => acc + Number(bet.result_amount ?? 0), 0)
  const roi = totalStake === 0 ? 0 : (totalProfit / totalStake) * 100

  if (roi >= 8) {
    insights.push({ tone: 'positive', message: `ROI sólido (${roi.toFixed(2)}%). Mantén la estrategia actual.` })
  } else if (roi <= -5) {
    insights.push({ tone: 'warning', message: `ROI negativo (${roi.toFixed(2)}%). Revisa stake y mercados.` })
  }

  const pendingCount = bets.filter((bet) => bet.status === 'pending').length
  if (pendingCount >= 5) {
    insights.push({ tone: 'info', message: `${pendingCount} apuestas pendientes. Considera cerrar posiciones o registrar resultados.` })
  }

  const longestLosingStreak = getLongestLosingStreak(bets)
  if (longestLosingStreak >= 3) {
    insights.push({ tone: 'warning', message: `Racha negativa de ${longestLosingStreak} apuestas. Evalúa si toca pausar.` })
  }

  const topTag = findTopTag(bets)
  if (topTag) {
    insights.push({ tone: 'positive', message: `La etiqueta "${topTag.tag}" lidera con ROI ${topTag.roi.toFixed(1)}%.` })
  }

  if (!insights.length) {
    insights.push({ tone: 'info', message: 'Sin alertas destacables. Sigue registrando para obtener más insights.' })
  }

  return insights.slice(0, 4)
}

function getLongestLosingStreak(bets: Bet[]): number {
  const sorted = [...bets].sort((a, b) => new Date(a.placed_at).getTime() - new Date(b.placed_at).getTime())
  let current = 0
  let longest = 0
  for (const bet of sorted) {
    if (LOSS_STATUSES.has(bet.status)) {
      current += 1
      longest = Math.max(longest, current)
    } else if (bet.status === WIN_STATUS) {
      current = 0
    }
  }
  return longest
}

function findTopTag(bets: Bet[]) {
  const tagStats = new Map<string, { profit: number; stake: number }>()

  for (const bet of bets) {
    const tags = bet.tags ?? []
    if (!tags.length) continue
    for (const tag of tags) {
      const stats = tagStats.get(tag) ?? { profit: 0, stake: 0 }
      stats.profit += Number(bet.result_amount ?? 0)
      stats.stake += Number(bet.stake ?? 0)
      tagStats.set(tag, stats)
    }
  }

  let best: { tag: string; roi: number } | null = null
  for (const [tag, stats] of tagStats.entries()) {
    if (stats.stake === 0) continue
    const roi = (stats.profit / stats.stake) * 100
    if (!best || roi > best.roi) {
      best = { tag, roi }
    }
  }

  return best
}
