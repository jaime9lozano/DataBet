import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import type { SessionUser } from './types'
import { getCurrentUser, onAuthStateChange, signInWithPassword, signOut as supabaseSignOut } from './services/session'

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface SessionContextValue {
  user: SessionUser | null
  status: SessionStatus
  authError: string | null
  isAuthActionPending: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  clearAuthError: () => void
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined)

export function SessionProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [status, setStatus] = useState<SessionStatus>('loading')
  const [authError, setAuthError] = useState<string | null>(null)
  const [isAuthActionPending, setIsAuthActionPending] = useState(false)

  useEffect(() => {
    let isMounted = true

    getCurrentUser()
      .then((current) => {
        if (!isMounted) return
        setUser(current)
        setStatus(current ? 'authenticated' : 'unauthenticated')
      })
      .catch((error) => {
        console.error('Session bootstrap error', error)
        if (!isMounted) return
        setAuthError(error instanceof Error ? error.message : 'No se pudo recuperar la sesión')
        setStatus('unauthenticated')
      })

    const unsubscribe = onAuthStateChange((nextUser) => {
      if (!isMounted) return
      setUser(nextUser)
      setStatus(nextUser ? 'authenticated' : 'unauthenticated')
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    setIsAuthActionPending(true)
    setAuthError(null)
    try {
      const logged = await signInWithPassword(email, password)
      setUser(logged)
      setStatus('authenticated')
    } catch (error) {
      console.error('Auth error', error)
      setAuthError(error instanceof Error ? error.message : 'No se pudo iniciar sesión')
      throw error
    } finally {
      setIsAuthActionPending(false)
    }
  }

  const signOut = async () => {
    setIsAuthActionPending(true)
    try {
      await supabaseSignOut()
      setUser(null)
      setStatus('unauthenticated')
    } catch (error) {
      console.error('Sign out error', error)
      setAuthError(error instanceof Error ? error.message : 'No se pudo cerrar sesión')
      throw error
    } finally {
      setIsAuthActionPending(false)
    }
  }

  const clearAuthError = () => setAuthError(null)

  const value = useMemo(
    () => ({ user, status, authError, isAuthActionPending, signIn, signOut, clearAuthError }),
    [user, status, authError, isAuthActionPending],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession debe usarse dentro de SessionProvider')
  }
  return context
}
