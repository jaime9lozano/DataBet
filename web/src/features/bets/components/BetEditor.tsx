import { useEffect, useState, type FormEvent } from 'react'
import type { Bet, BetStatus, BetType, UpdateBetPayload } from '../../../lib/types'

interface BetEditorProps {
  bet: Bet | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: UpdateBetPayload) => Promise<void>
  isSubmitting: boolean
}

const STATUS_OPTIONS: BetStatus[] = ['pending', 'won', 'lost', 'void', 'cashed_out', 'cancelled']
const TYPE_OPTIONS: BetType[] = ['single', 'parlay', 'system']

export function BetEditor({ bet, isOpen, onClose, onSubmit, isSubmitting }: BetEditorProps) {
  const [stake, setStake] = useState('')
  const [odds, setOdds] = useState('')
  const [status, setStatus] = useState<BetStatus>('pending')
  const [betType, setBetType] = useState<BetType>('single')
  const [resultAmount, setResultAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [settledAt, setSettledAt] = useState('')

  useEffect(() => {
    if (!bet) return
    setStake(String(bet.stake ?? ''))
    setOdds(String(bet.odds ?? ''))
    setStatus(bet.status)
    setBetType(bet.bet_type)
    setResultAmount(bet.result_amount != null ? String(bet.result_amount) : '')
    setNotes(bet.notes ?? '')
    setSettledAt(bet.settled_at ? bet.settled_at.slice(0, 16) : '')
  }, [bet])

  if (!bet) return null

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    await onSubmit({
      stake: stake ? Number(stake) : undefined,
      odds: odds ? Number(odds) : undefined,
      status,
      bet_type: betType,
      result_amount: resultAmount ? Number(resultAmount) : null,
      notes: notes || null,
      settled_at: settledAt ? new Date(settledAt).toISOString() : null,
    })
  }

  return (
    <div className={['bet-editor', isOpen ? 'is-open' : ''].join(' ').trim()} role="dialog" aria-modal="true">
      <div className="bet-editor__panel">
        <header>
          <div>
            <p className="label">Editar apuesta</p>
            <h2>{new Date(bet.placed_at).toLocaleString('es-ES')}</h2>
          </div>
          <button type="button" className="ghost" onClick={onClose}>
            Cerrar
          </button>
        </header>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Stake
            <input type="number" step="0.01" min="0" value={stake} onChange={(event) => setStake(event.target.value)} />
          </label>
          <label>
            Cuota
            <input type="number" step="0.01" min="0" value={odds} onChange={(event) => setOdds(event.target.value)} />
          </label>
          <label>
            Estado
            <select value={status} onChange={(event) => setStatus(event.target.value as BetStatus)}>
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tipo
            <select value={betType} onChange={(event) => setBetType(event.target.value as BetType)}>
              {TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Resultado
            <input type="number" step="0.01" value={resultAmount} onChange={(event) => setResultAmount(event.target.value)} />
          </label>
          <label>
            Fecha liquidación
            <input type="datetime-local" value={settledAt} onChange={(event) => setSettledAt(event.target.value)} />
          </label>
          <label className="full">
            Notas
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
          </label>
          <div className="bet-editor__actions">
            <button type="button" className="ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
