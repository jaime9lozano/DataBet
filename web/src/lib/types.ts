export type BetStatus = 'pending' | 'won' | 'lost' | 'void' | 'cashed_out' | 'cancelled'
export type BetType = 'single' | 'parlay' | 'system'
export type PeriodGrouping = 'week' | 'month' | 'quarter'

export interface Bet {
  id: string
  user_id: string
  bankroll_id: string
  event_id: string | null
  market_id: string | null
  bookmaker_id: string | null
  stake: number
  odds: number
  implied_probability: number | null
  status: BetStatus
  bet_type: BetType
  placed_at: string
  settled_at: string | null
  result_amount: number | null
  notes: string | null
  tags: string[] | null
  created_at: string
  updated_at: string
}

export interface NewBet {
  id?: string
  bankroll_id: string
  event_id?: string | null
  market_id?: string | null
  bookmaker_id?: string | null
  stake: number
  odds: number
  implied_probability?: number | null
  status?: BetStatus
  bet_type?: BetType
  placed_at: string
  settled_at?: string | null
  result_amount?: number | null
  notes?: string | null
  tags?: string[]
}

export interface Bankroll {
  id: string
  name: string
  currency: string
  balance: number
  target_stake_unit: number
}

export interface UpdateBetPayload {
  stake?: number
  odds?: number
  status?: BetStatus
  bet_type?: BetType
  settled_at?: string | null
  result_amount?: number | null
  notes?: string | null
  tags?: string[] | null
}

export interface BetFilters {
  status?: BetStatus
  from?: string
  to?: string
  search?: string
  tags?: string[]
  bankrollId?: string
}

export interface SessionUser {
  email: string
}

export interface RegisterPayload {
  email: string
  password: string
  displayName: string
}
