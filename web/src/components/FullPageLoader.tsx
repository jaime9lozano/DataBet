import './FullPageLoader.css'

export function FullPageLoader() {
  return (
    <div className="loader-shell">
      <div className="spinner" aria-hidden>
        <div />
        <div />
        <div />
      </div>
      <p>Cargando DataBet…</p>
    </div>
  )
}
