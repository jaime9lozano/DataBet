import { supabase } from '../supabaseClient'
import type { SessionUser } from '../types'

export async function signInWithPassword(email: string, password: string): Promise<SessionUser> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return { email: data.user?.email ?? email }
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
