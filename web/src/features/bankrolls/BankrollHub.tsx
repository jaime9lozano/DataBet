import type { Bankroll } from '../../lib/types'
import './bankrolls.css'

interface BankrollHubProps {
  bankrolls: Bankroll[]
  onSelect: (id: string) => void
}

const currencyFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
})

export function BankrollHub({ bankrolls, onSelect }: BankrollHubProps) {
  return (
    <section className="bankroll-hub">
      <header>
        <p className="eyebrow">Selecciona un bankroll</p>
        <h1>¿Con qué bankroll quieres trabajar?</h1>
        <p className="muted">Puedes cambiarlo en cualquier momento desde la cabecera.</p>
      </header>

      <div className="bankroll-grid">
        {bankrolls.map((bankroll) => (
          <article key={bankroll.id} className="bankroll-card">
            <div>
              <p className="label">Bankroll</p>
              <h2>{bankroll.name}</h2>
            </div>
            <dl>
              <div>
                <dt>Balance</dt>
                <dd>{currencyFormatter.format(Number(bankroll.balance))}</dd>
              </div>
              <div>
                <dt>Unidad objetivo</dt>
                <dd>
                  {currencyFormatter.format(Number(bankroll.target_stake_unit))}
                </dd>
              </div>
              <div>
                <dt>Divisa</dt>
                <dd>{bankroll.currency}</dd>
              </div>
            </dl>
            <button type="button" onClick={() => onSelect(bankroll.id)}>
              Usar este bankroll
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}
