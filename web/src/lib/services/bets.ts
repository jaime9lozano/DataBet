import { supabase } from '../supabaseClient'
import type { Bet, BetFilters, NewBet } from '../types'

function generateBetId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `bet_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export async function fetchBets(filters: BetFilters = {}): Promise<Bet[]> {
  let query = supabase
    .from('bets')
    .select('*')
    .order('placed_at', { ascending: false })

  if (filters.bankrollId) {
    query = query.eq('bankroll_id', filters.bankrollId)
  }
  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.from) {
    query = query.gte('placed_at', filters.from)
  }
  if (filters.to) {
    query = query.lte('placed_at', filters.to)
  }
  if (filters.search) {
    query = query.ilike('notes', `%${filters.search}%`)
  }
  if (filters.tags?.length) {
    query = query.contains('tags', filters.tags)
  }

  const { data, error } = await query
  if (error) throw error
  return data as Bet[]
}

export async function createBet(payload: NewBet): Promise<Bet> {
  const payloadWithId = {
    id: payload.id ?? generateBetId(),
    ...payload,
  }
  const { data, error } = await supabase
    .from('bets')
    .insert(payloadWithId)
    .select()
    .single()
  if (error) throw error
  return data as Bet
}

export async function deleteBet(id: string): Promise<void> {
  const { error } = await supabase.from('bets').delete().eq('id', id)
  if (error) throw error
}

export async function fetchTags(): Promise<string[]> {
  const { data, error } = await supabase.from('bets').select('tags')
  if (error) throw error

  const tagSet = new Set<string>()
  for (const row of data ?? []) {
    for (const tag of row.tags ?? []) {
      tagSet.add(tag)
    }
  }

  return Array.from(tagSet).sort((a, b) => a.localeCompare(b))
}
