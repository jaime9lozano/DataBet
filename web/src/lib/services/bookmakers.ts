import { supabase } from '../supabaseClient'

export interface Bookmaker {
  id: string
  name: string
  country: string | null
}

export async function fetchBookmakers(): Promise<Bookmaker[]> {
  const { data, error } = await supabase
    .from('bookmakers')
    .select('id,name,country')
    .order('name', { ascending: true })

  if (error) throw error
  return (data ?? []) as Bookmaker[]
}
