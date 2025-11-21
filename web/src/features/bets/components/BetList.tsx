import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Bet } from '../../../lib/types'

interface BetListProps {
  bets: Bet[]
  isLoading: boolean
  onDelete: (betId: string) => Promise<void>
  deletingId?: string
  onEdit: (bet: Bet) => void
}

const currencyFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
})

export function BetList({ bets, isLoading, onDelete, deletingId, onEdit }: BetListProps) {
  if (isLoading) {
    return (
      <section className="bets-table">
        <p>Descargando apuestas…</p>
      </section>
    )
  }

  if (!bets.length) {
    return (
      <section className="bets-table">
        <p>No hay apuestas con los filtros actuales.</p>
      </section>
    )
  }

  return (
    <section className="bets-table">
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Stake</th>
            <th>Cuota</th>
            <th>Estado</th>
            <th>Resultado</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {bets.map((bet) => (
            <tr key={bet.id}>
              <td>{format(new Date(bet.placed_at), 'dd MMM yyyy', { locale: es })}</td>
              <td>{currencyFormatter.format(Number(bet.stake))}</td>
              <td>{Number(bet.odds).toFixed(2)}</td>
              <td>
                <span className={`status-pill status-${bet.status}`}>
                  {bet.status}
                </span>
              </td>
              <td>{bet.result_amount ? currencyFormatter.format(Number(bet.result_amount)) : '—'}</td>
              <td className="actions-cell">
                <button className="ghost" onClick={() => onEdit(bet)}>
                  Editar
                </button>
                <button className="ghost" onClick={() => onDelete(bet.id)} disabled={deletingId === bet.id}>
                  {deletingId === bet.id ? 'Eliminando…' : 'Eliminar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
