import { type FormEvent, useState } from 'react'
import { useSession } from '../../lib/session'
import { useNotifications } from '../../lib/notifications'
import './auth.css'

export function AuthPanel() {
  const { signIn, signUp, authError, clearAuthError, isAuthActionPending } = useSession()
  const { push } = useNotifications()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!email || !password) return
    if (mode === 'signup' && !displayName.trim()) return
    try {
      if (mode === 'signin') {
        await signIn(email, password)
        push('success', 'Sesión iniciada correctamente')
      } else {
        await signUp({ email, password, displayName: displayName.trim() })
        push('success', 'Cuenta creada. ¡Bienvenido!')
      }
    } catch (error) {
      console.error('AuthPanel submit error', error)
      const message = error instanceof Error ? error.message : 'No se pudo iniciar sesión'
      push('error', message)
    }
  }

  const toggleMode = () => {
    clearAuthError()
    setMode((prev) => (prev === 'signin' ? 'signup' : 'signin'))
  }

  return (
    <div className="auth-panel">
      <h1>DataBet</h1>
      <p>{mode === 'signin' ? 'Inicia sesión con tus credenciales.' : 'Crea una cuenta para comenzar a registrar tus apuestas.'}</p>

      <form onSubmit={handleSubmit} className="auth-form">
        {mode === 'signup' && (
          <label>
            Nombre visible
            <input
              type="text"
              value={displayName}
              onChange={(event) => {
                clearAuthError()
                setDisplayName(event.target.value)
              }}
              placeholder="Tu alias"
              required
            />
          </label>
        )}
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
          {isAuthActionPending ? 'Procesando…' : mode === 'signin' ? 'Entrar' : 'Crear cuenta'}
        </button>
      </form>
      <p className="auth-switch">
        {mode === 'signin' ? '¿No tienes cuenta?' : '¿Ya tienes una cuenta?'}{' '}
        <button type="button" className="ghost-link" onClick={toggleMode}>
          {mode === 'signin' ? 'Regístrate' : 'Inicia sesión'}
        </button>
      </p>
    </div>
  )
}
