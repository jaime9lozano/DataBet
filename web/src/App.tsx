import './App.css'
import { useSession } from './lib/session'
import { FullPageLoader } from './components/FullPageLoader'
import { AuthPanel } from './features/auth/AuthPanel'
import { BankrollProvider } from './lib/bankroll'
import { BankrollGate } from './features/bankrolls/BankrollGate'
import { NotificationCenter } from './components/NotificationCenter'

function App() {
  const { status } = useSession()

  if (status === 'loading') {
    return (
      <div className="app-shell">
        <FullPageLoader />
        <NotificationCenter />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="app-shell">
        <AuthPanel />
        <NotificationCenter />
      </div>
    )
  }

  return (
    <div className="app-shell">
      <BankrollProvider>
        <BankrollGate />
      </BankrollProvider>
      <NotificationCenter />
    </div>
  )
}

export default App
