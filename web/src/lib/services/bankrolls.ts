import { supabase } from '../supabaseClient'
import type { Bankroll } from '../types'

export async function fetchBankrolls(): Promise<Bankroll[]> {
  const { data, error } = await supabase
    .from('bankrolls')
    .select('id,name,currency,balance,target_stake_unit')
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as Bankroll[]
}
