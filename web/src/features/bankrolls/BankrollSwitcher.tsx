import { useBankroll } from '../../lib/bankroll'
import './bankrolls.css'

export function BankrollSwitcher() {
  const { bankrolls, activeBankroll, selectBankroll, refresh, isLoading } = useBankroll()

  if (isLoading || bankrolls.length === 0) {
    return null
  }

  if (bankrolls.length === 1 && activeBankroll) {
    return (
      <div className="bankroll-switcher" role="status">
        <span className="label">Bankroll activo</span>
        <strong>{activeBankroll.name}</strong>
      </div>
    )
  }

  return (
    <label className="bankroll-switcher">
      <span>Bankroll</span>
      <div className="bankroll-switcher__row">
        <select value={activeBankroll?.id ?? ''} onChange={(event) => selectBankroll(event.target.value)}>
          <option value="" disabled>
            Selecciona
          </option>
          {bankrolls.map((bankroll) => (
            <option key={bankroll.id} value={bankroll.id}>
              {bankroll.name}
            </option>
          ))}
        </select>
        <button type="button" onClick={refresh} title="Actualizar bankrolls" aria-label="Actualizar bankrolls">
          ↻
        </button>
      </div>
    </label>
  )
}
