import { type FormEvent, useState } from 'react'
import { useSession } from '../../lib/session'
import { useNotifications } from '../../lib/notifications'
import './auth.css'

export function AuthPanel() {
  const { signIn, authError, clearAuthError, isAuthActionPending } = useSession()
  const { push } = useNotifications()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!email || !password) return
    try {
      await signIn(email, password)
      push('success', 'Sesión iniciada correctamente')
    } catch (error) {
      console.error('AuthPanel submit error', error)
      const message = error instanceof Error ? error.message : 'No se pudo iniciar sesión'
      push('error', message)
    }
  }

  return (
    <div className="auth-panel">
      <h1>DataBet</h1>
      <p>Inicia sesión con tus credenciales de Supabase para acceder al panel web.</p>

      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => {
              clearAuthError()
              setEmail(event.target.value)
            }}
            placeholder="bettor@databet.app"
            required
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(event) => {
              clearAuthError()
              setPassword(event.target.value)
            }}
            placeholder="••••••••"
            required
          />
        </label>
        {authError && <p className="auth-error">{authError}</p>}
        <button type="submit" disabled={isAuthActionPending}>
          {isAuthActionPending ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
