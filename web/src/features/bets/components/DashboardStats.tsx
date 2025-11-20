import { useMemo } from 'react'
import type { Bet, PeriodGrouping } from '../../../lib/types'
import { addDays, format, startOfMonth, startOfQuarter, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'

interface DashboardStatsProps {
  bets: Bet[]
  isLoading: boolean
  grouping: PeriodGrouping
}

const currencyFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
})

export function DashboardStats({ bets, isLoading, grouping }: DashboardStatsProps) {
  const stats = useMemo(() => {
    if (!bets.length) {
      return {
        totalBets: 0,
        roi: 0,
        profit: 0,
        pending: 0,
        lastUpdate: null as string | null,
      }
    }

    const totalStake = bets.reduce((acc, bet) => acc + Number(bet.stake ?? 0), 0)
    const profit = bets.reduce((acc, bet) => acc + Number(bet.result_amount ?? 0), 0)
    const roi = totalStake === 0 ? 0 : (profit / totalStake) * 100
    const pending = bets.filter((bet) => bet.status === 'pending').length
    const sorted = [...bets].sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
    const lastUpdate = sorted[0]?.updated_at ?? null

    return {
      totalBets: bets.length,
      profit,
      roi,
      pending,
      lastUpdate,
    }
  }, [bets])

  const periodStats = useMemo(() => summarizeByPeriod(bets, grouping), [bets, grouping])

  return (
    <section className="stats-grid">
      <article>
        <p className="label">Total apuestas</p>
        <h3>{stats.totalBets}</h3>
      </article>
      <article>
        <p className="label">Beneficio</p>
        <h3>{currencyFormatter.format(stats.profit)}</h3>
      </article>
      <article>
        <p className="label">ROI</p>
        <h3>{stats.roi.toFixed(2)}%</h3>
      </article>
      <article>
        <p className="label">Pendientes</p>
        <h3>{isLoading ? '…' : stats.pending}</h3>
        <span className="muted">{stats.lastUpdate ? `Actualizado ${format(new Date(stats.lastUpdate), 'dd MMM HH:mm', { locale: es })}` : 'Sin registros'}</span>
      </article>
      <article className="period-card">
        <p className="label">Top {GROUPING_LABELS[grouping]}</p>
        {periodStats.length === 0 ? (
          <p className="muted">Sin datos suficientes</p>
        ) : (
          <ul className="period-list">
            {periodStats.map((period) => (
              <li key={period.key}>
                <div>
                  <strong>{period.label}</strong>
                  <span className="muted">{period.count} apuestas</span>
                </div>
                <div className="period-values">
                  <span>{currencyFormatter.format(period.profit)}</span>
                  <span className={period.roi >= 0 ? 'roi-positive' : 'roi-negative'}>{period.roi.toFixed(1)}%</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  )
}

const GROUPING_LABELS: Record<PeriodGrouping, string> = {
  week: 'semanas',
  month: 'meses',
  quarter: 'trimestres',
}

interface PeriodSummaryItem {
  key: string
  label: string
  count: number
  profit: number
  roi: number
}

function summarizeByPeriod(bets: Bet[], grouping: PeriodGrouping): PeriodSummaryItem[] {
  if (!bets.length) return []

  const buckets = new Map<string, { key: string; label: string; count: number; profit: number; stake: number; date: Date }>()

  for (const bet of bets) {
    const placedAt = new Date(bet.placed_at)
    const bucketInfo = getPeriodBucket(placedAt, grouping)
    const existing = buckets.get(bucketInfo.key)

    if (existing) {
      existing.count += 1
      existing.profit += Number(bet.result_amount ?? 0)
      existing.stake += Number(bet.stake ?? 0)
    } else {
      buckets.set(bucketInfo.key, {
        key: bucketInfo.key,
        label: bucketInfo.label,
        date: bucketInfo.start,
        count: 1,
        profit: Number(bet.result_amount ?? 0),
        stake: Number(bet.stake ?? 0),
      })
    }
  }

  return Array.from(buckets.values())
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5)
    .map((bucket) => ({
      key: bucket.key,
      label: bucket.label,
      count: bucket.count,
      profit: bucket.profit,
      roi: bucket.stake === 0 ? 0 : (bucket.profit / bucket.stake) * 100,
    }))
}

function getPeriodBucket(date: Date, grouping: PeriodGrouping) {
  if (grouping === 'week') {
    const start = startOfWeek(date, { weekStartsOn: 1 })
    const end = addDays(start, 6)
    return {
      key: `w-${start.toISOString()}`,
      start,
      label: `${format(start, 'dd MMM', { locale: es })} - ${format(end, 'dd MMM', { locale: es })}`,
    }
  }

  if (grouping === 'month') {
    const start = startOfMonth(date)
    return {
      key: `m-${start.toISOString()}`,
      start,
      label: format(start, 'MMMM yyyy', { locale: es }),
    }
  }

  const start = startOfQuarter(date)
  const quarterNumber = Math.floor(start.getMonth() / 3) + 1
  return {
    key: `q-${start.toISOString()}`,
    start,
    label: `Q${quarterNumber} ${start.getFullYear()}`,
  }
}
