import { supabase } from '../supabaseClient'
import type { RegisterPayload, SessionUser } from '../types'

export async function signInWithPassword(email: string, password: string): Promise<SessionUser> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return { email: data.user?.email ?? email }
}

export async function signUpWithProfile(payload: RegisterPayload): Promise<SessionUser> {
  const { data, error } = await supabase.auth.signUp({ email: payload.email, password: payload.password })
  if (error) throw error

  const userId = data.user?.id
  if (!userId) {
    throw new Error('No se pudo recuperar el usuario creado')
  }

  const { error: profileError } = await supabase.from('app_users').insert({
    auth_uid: userId,
    display_name: payload.displayName,
  })

  if (profileError) {
    throw profileError
  }

  return { email: data.user?.email ?? payload.email }
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  const email = data.session?.user?.email
  return email ? { email } : null
}

export function onAuthStateChange(callback: (user: SessionUser | null) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    const email = session?.user?.email
    callback(email ? { email } : null)
  })
  return () => {
    data.subscription.unsubscribe()
  }
}
