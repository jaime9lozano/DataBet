import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '../../lib/session'
import type { Bet, BetFilters, BetStatus, NewBet, PeriodGrouping } from '../../lib/types'
import { fetchBets, createBet, deleteBet, fetchTags } from '../../lib/services/bets'
import { DashboardStats } from './components/DashboardStats'
import { FiltersBar } from './components/FiltersBar'
import './bets.css'
import { CsvImportCard } from './components/CsvImportCard'
import { AddBetForm } from './components/AddBetForm'
import { BetList } from './components/BetList'
import { useNotifications } from '../../lib/notifications'
import { TopLoader } from '../../components/TopLoader'

export function BetsView() {
  const { user, signOut, isAuthActionPending } = useSession()
  const { push } = useNotifications()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<BetStatus | ''>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [search, setSearch] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [grouping, setGrouping] = useState<PeriodGrouping>('month')

  const filters = useMemo<BetFilters>(() => {
    return {
      status: statusFilter || undefined,
      from: from ? new Date(from).toISOString() : undefined,
      to: to ? new Date(to).toISOString() : undefined,
      search: search ? search.trim() : undefined,
      tags: selectedTags.length ? selectedTags : undefined,
    }
  }, [statusFilter, from, to, search, selectedTags])

  const { data: bets = [], isFetching, isLoading } = useQuery<Bet[]>({
    queryKey: [
      'bets',
      filters.status ?? 'all',
      filters.from ?? 'none',
      filters.to ?? 'none',
      filters.search ?? 'none',
      (filters.tags ?? []).join(','),
    ],
    queryFn: () => fetchBets(filters),
  })

  const { data: tagOptions = [] } = useQuery<string[]>({
    queryKey: ['bet-tags'],
    queryFn: fetchTags,
    staleTime: 1000 * 60 * 10,
  })

  const createMutation = useMutation<Bet, Error, NewBet>({
    mutationFn: createBet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bets'] })
      push('success', 'Apuesta registrada correctamente')
    },
    onError: (error) => push('error', error.message),
  })

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: deleteBet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bets'] })
      push('info', 'Apuesta eliminada')
    },
    onError: (error) => push('error', error.message),
  })

  const handleCreateBet = async (payload: NewBet) => {
    await createMutation.mutateAsync(payload)
  }

  const handleDeleteBet = async (betId: string) => {
    await deleteMutation.mutateAsync(betId)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      push('info', 'Sesión cerrada')
    } catch (error) {
      console.error('Sign out error', error)
      const message = error instanceof Error ? error.message : 'No se pudo cerrar sesión'
      push('error', message)
    }
  }

  return (
    <div className="bets-shell">
      <TopLoader active={isFetching && !isLoading} />
      <header className="bets-header">
        <div>
          <p className="eyebrow">Panel DataBet</p>
          <h1>Hola, {user?.email}</h1>
          <p className="subhead">Revisa tu rendimiento y añade nuevas apuestas.</p>
        </div>
        <button className="ghost" onClick={() => { void handleSignOut() }} disabled={isAuthActionPending}>
          {isAuthActionPending ? 'Saliendo…' : 'Cerrar sesión'}
        </button>
      </header>

      <FiltersBar
        statusValue={statusFilter}
        onStatusChange={(value) => setStatusFilter(value)}
        fromValue={from}
        toValue={to}
        onDateChange={(nextFrom, nextTo) => {
          setFrom(nextFrom)
          setTo(nextTo)
        }}
        isLoading={isFetching || isLoading}
        searchValue={search}
        onSearchChange={setSearch}
        tagOptions={tagOptions}
        selectedTags={selectedTags}
        onTagsChange={setSelectedTags}
        groupingValue={grouping}
        onGroupingChange={setGrouping}
      />

      <DashboardStats bets={bets} isLoading={isLoading} grouping={grouping} />

      <section className="two-column">
        <AddBetForm onSubmit={handleCreateBet} isSubmitting={createMutation.isPending} lastError={createMutation.error?.message ?? null} />
        <CsvImportCard
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['bets'] })
            push('success', 'Importación completada')
          }}
          onError={(message) => push('error', message)}
        />
      </section>

      <BetList bets={bets} isLoading={isLoading} onDelete={handleDeleteBet} deletingId={deleteMutation.variables ?? undefined} />
    </div>
  )
}
