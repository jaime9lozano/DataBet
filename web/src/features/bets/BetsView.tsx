import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '../../lib/session'
import type { Bet, BetFilters, BetStatus, NewBet, PeriodGrouping } from '../../lib/types'
import { fetchBets, createBet, deleteBet, fetchTags, updateBet } from '../../lib/services/bets'
import { DashboardStats } from './components/DashboardStats'
import { FiltersBar } from './components/FiltersBar'
import './bets.css'
import { CsvImportCard } from './components/CsvImportCard'
import { AddBetForm } from './components/AddBetForm'
import { BetList } from './components/BetList'
import { useNotifications } from '../../lib/notifications'
import { TopLoader } from '../../components/TopLoader'
import { useBankroll } from '../../lib/bankroll'
import { BankrollSwitcher } from '../bankrolls/BankrollSwitcher'
import { BetEditor } from './components/BetEditor'
import type { UpdateBetPayload } from '../../lib/types'

type BetsScreen = 'overview' | 'create' | 'history'

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined

    const mediaQuery = window.matchMedia(query)
    const handleChange = () => setMatches(mediaQuery.matches)
    handleChange()
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [query])

  return matches
}

export function BetsView() {
  const { user, signOut, isAuthActionPending } = useSession()
  const { push } = useNotifications()
  const { activeBankroll } = useBankroll()
  const queryClient = useQueryClient()
  const isMobile = useMediaQuery('(max-width: 900px)')
  const [activeScreen, setActiveScreen] = useState<BetsScreen>('overview')
  const [statusFilter, setStatusFilter] = useState<BetStatus | ''>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [search, setSearch] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [grouping, setGrouping] = useState<PeriodGrouping>('month')
  const [editingBet, setEditingBet] = useState<Bet | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)

  const filters = useMemo<BetFilters>(() => {
    return {
      bankrollId: activeBankroll?.id,
      status: statusFilter || undefined,
      from: from ? new Date(from).toISOString() : undefined,
      to: to ? new Date(to).toISOString() : undefined,
      search: search ? search.trim() : undefined,
      tags: selectedTags.length ? selectedTags : undefined,
    }
  }, [activeBankroll?.id, statusFilter, from, to, search, selectedTags])

  const { data: bets = [], isFetching, isLoading } = useQuery<Bet[]>({
    queryKey: [
      'bets',
      filters.bankrollId ?? 'no-bankroll',
      filters.status ?? 'all',
      filters.from ?? 'none',
      filters.to ?? 'none',
      filters.search ?? 'none',
      (filters.tags ?? []).join(','),
    ],
    queryFn: () => fetchBets(filters),
    enabled: Boolean(filters.bankrollId),
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

  const updateMutation = useMutation<Bet, Error, { id: string; payload: UpdateBetPayload }>({
    mutationFn: ({ id, payload }) => updateBet(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bets'] })
      push('success', 'Apuesta actualizada')
    },
    onError: (error) => push('error', error.message),
  })

  const handleCreateBet = async (payload: NewBet) => {
    if (!activeBankroll) {
      push('error', 'Selecciona un bankroll antes de registrar apuestas')
      return
    }
    await createMutation.mutateAsync({ ...payload, bankroll_id: activeBankroll.id })
  }

  const handleDeleteBet = async (betId: string) => {
    await deleteMutation.mutateAsync(betId)
  }

  const handleOpenEditor = (bet: Bet) => {
    setEditingBet(bet)
    setIsEditorOpen(true)
  }

  const handleCloseEditor = () => {
    setIsEditorOpen(false)
    setEditingBet(null)
  }

  const handleUpdateBet = async (payload: UpdateBetPayload) => {
    if (!editingBet) return
    await updateMutation.mutateAsync({ id: editingBet.id, payload })
    handleCloseEditor()
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

  const screens: Array<{ id: BetsScreen; label: string }> = [
    { id: 'overview', label: 'Resumen' },
    { id: 'create', label: 'Registrar' },
    { id: 'history', label: 'Historial' },
  ]

  const shouldShowScreen = (screen: BetsScreen) => (!isMobile || activeScreen === screen)

  return (
    <div className="bets-shell">
      <TopLoader active={isFetching && !isLoading} />
      <header className="bets-header">
        <div>
          <p className="eyebrow">Panel DataBet</p>
          <h1>Hola, {user?.email}</h1>
          <p className="subhead">
            {activeBankroll ? `Operando sobre ${activeBankroll.name}` : 'Selecciona un bankroll para empezar.'}
          </p>
        </div>
        <div className="bets-header__actions">
          <BankrollSwitcher />
          <button className="ghost" onClick={() => { void handleSignOut() }} disabled={isAuthActionPending}>
            {isAuthActionPending ? 'Saliendo…' : 'Cerrar sesión'}
          </button>
        </div>
      </header>

      <nav className="bets-nav" aria-label="Secciones del panel">
        {screens.map((screen) => (
          <button
            key={screen.id}
            type="button"
            className={['bets-nav__button', activeScreen === screen.id ? 'is-active' : ''].join(' ').trim()}
            onClick={() => setActiveScreen(screen.id)}
          >
            {screen.label}
          </button>
        ))}
      </nav>

      {shouldShowScreen('overview') && (
        <>
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
        </>
      )}

      {shouldShowScreen('create') && (
        <section className="two-column">
          <AddBetForm
            onSubmit={handleCreateBet}
            isSubmitting={createMutation.isPending}
            lastError={createMutation.error?.message ?? null}
          />
          <CsvImportCard
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['bets'] })
              push('success', 'Importación completada')
            }}
            onError={(message) => push('error', message)}
          />
        </section>
      )}

      {shouldShowScreen('history') && (
        <BetList
          bets={bets}
          isLoading={isLoading}
          onDelete={handleDeleteBet}
          deletingId={deleteMutation.variables ?? undefined}
          onEdit={handleOpenEditor}
        />
      )}

      <BetEditor
        bet={editingBet}
        isOpen={isEditorOpen}
        onClose={handleCloseEditor}
        onSubmit={handleUpdateBet}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  )
}
