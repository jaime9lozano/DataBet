import { type FormEvent, useState } from 'react'
import type { NewBet } from '../../../lib/types'

interface AddBetFormProps {
  onSubmit: (payload: NewBet) => Promise<void>
  isSubmitting: boolean
  lastError: string | null
}

export function AddBetForm({ onSubmit, isSubmitting, lastError }: AddBetFormProps) {
  const [bankrollId, setBankrollId] = useState('')
  const [stake, setStake] = useState('')
  const [odds, setOdds] = useState('')
  const [notes, setNotes] = useState('')
  const [placedAt, setPlacedAt] = useState(() => new Date().toISOString().slice(0, 16))
  const [feedback, setFeedback] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!bankrollId || !stake || !odds || !placedAt) return

    setFeedback(null)
    try {
      await onSubmit({
        bankroll_id: bankrollId,
        stake: Number(stake),
        odds: Number(odds),
        placed_at: new Date(placedAt).toISOString(),
        notes: notes || undefined,
      })
      setFeedback('Apuesta creada correctamente')
      setStake('')
      setOdds('')
      setNotes('')
    } catch (error) {
      console.error('AddBetForm error', error)
      setFeedback(null)
    }
  }

  return (
    <article className="panel">
      <h2>Nueva apuesta</h2>
      <p className="muted">Introduce los mínimos: bankroll, stake, cuota y fecha.</p>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Bankroll ID
          <input value={bankrollId} onChange={(event) => setBankrollId(event.target.value)} placeholder="UUID" required />
        </label>
        <label>
          Stake
          <input type="number" step="0.01" min="0" value={stake} onChange={(event) => setStake(event.target.value)} required />
        </label>
        <label>
          Cuota
          <input type="number" step="0.01" min="0" value={odds} onChange={(event) => setOdds(event.target.value)} required />
        </label>
        <label>
          Fecha
          <input type="datetime-local" value={placedAt} onChange={(event) => setPlacedAt(event.target.value)} required />
        </label>
        <label className="full">
          Notas
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Opcional" rows={3} />
        </label>
        {lastError && <p className="form-error">{lastError}</p>}
        {feedback && <p className="form-success">{feedback}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando…' : 'Guardar apuesta'}
        </button>
      </form>
    </article>
  )
}
