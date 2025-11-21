import { BankrollHub } from './BankrollHub'
import { useBankroll } from '../../lib/bankroll'
import { FullPageLoader } from '../../components/FullPageLoader'
import { BetsView } from '../bets'
import './bankrolls.css'

export function BankrollGate() {
  const { bankrolls, activeBankroll, selectBankroll, isLoading, error, refresh } = useBankroll()

  if (isLoading) {
    return <FullPageLoader />
  }

  if (error) {
    return (
      <section className="bankroll-state">
        <h2>Error cargando bankrolls</h2>
        <p>{error}</p>
        <button type="button" onClick={refresh}>
          Reintentar
        </button>
      </section>
    )
  }

  if (!bankrolls.length) {
    return (
      <section className="bankroll-state">
        <h2>Añade un bankroll</h2>
        <p>Ve a Supabase o a tu panel de datos para crear el primer bankroll.</p>
        <button type="button" onClick={refresh}>
          Comprobar de nuevo
        </button>
      </section>
    )
  }

  if (!activeBankroll) {
    return <BankrollHub bankrolls={bankrolls} onSelect={selectBankroll} />
  }

  return <BetsView />
}
