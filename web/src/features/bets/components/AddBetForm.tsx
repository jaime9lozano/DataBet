import { type FormEvent, useEffect, useState } from 'react'
import type { Bankroll, NewBet } from '../../../lib/types'

interface AddBetFormProps {
  onSubmit: (payload: NewBet) => Promise<void>
  isSubmitting: boolean
  lastError: string | null
  bankrolls: Bankroll[]
  isLoadingBankrolls: boolean
}

export function AddBetForm({ onSubmit, isSubmitting, lastError, bankrolls, isLoadingBankrolls }: AddBetFormProps) {
  const [bankrollId, setBankrollId] = useState('')
  const [stake, setStake] = useState('')
  const [odds, setOdds] = useState('')
  const [notes, setNotes] = useState('')
  const [placedAt, setPlacedAt] = useState(() => new Date().toISOString().slice(0, 16))
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    if (!bankrollId && bankrolls.length) {
      setBankrollId(bankrolls[0].id)
    }
  }, [bankrollId, bankrolls])

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

  const canSubmit = Boolean(bankrollId && stake && odds && placedAt && !isSubmitting)

  return (
    <article className="panel">
      <h2>Nueva apuesta</h2>
      <p className="muted">Selecciona bankroll y completa stake, cuota y fecha.</p>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Bankroll
          <select value={bankrollId} onChange={(event) => setBankrollId(event.target.value)} disabled={isLoadingBankrolls || !bankrolls.length} required>
            <option value="">Selecciona un bankroll</option>
            {bankrolls.map((bankroll) => (
              <option key={bankroll.id} value={bankroll.id}>
                {bankroll.name} · {bankroll.currency}
              </option>
            ))}
          </select>
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
        {!isLoadingBankrolls && !bankrolls.length && <p className="form-error">Necesitas un bankroll activo antes de registrar apuestas.</p>}
        {lastError && <p className="form-error">{lastError}</p>}
        {feedback && <p className="form-success">{feedback}</p>}
        <button type="submit" disabled={!canSubmit}>
          {isSubmitting ? 'Guardando…' : 'Guardar apuesta'}
        </button>
      </form>
    </article>
  )
}
