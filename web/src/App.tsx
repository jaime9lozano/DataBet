import './App.css'
import { useSession } from './lib/session'
import { FullPageLoader } from './components/FullPageLoader'
import { AuthPanel } from './features/auth/AuthPanel'
import { BetsView } from './features/bets'
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
      <BetsView />
      <NotificationCenter />
    </div>
  )
}

export default App
