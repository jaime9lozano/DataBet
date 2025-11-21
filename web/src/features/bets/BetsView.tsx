import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '../../lib/session'
import type { Bet, BetFilters, BetStatus, NewBet, PeriodGrouping, UpdateBetPayload } from '../../lib/types'
import { fetchBets, createBet, deleteBet, fetchTags, updateBet } from '../../lib/services/bets'
import { fetchBookmakers, type Bookmaker } from '../../lib/services/bookmakers'
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

type BetsScreen = 'overview' | 'create' | 'history'

interface SavedFilterPayload {
  status: BetStatus | ''
  from: string
  to: string
  search: string
  tags: string[]
  grouping: PeriodGrouping
  stakeMin: string
  stakeMax: string
  oddsMin: string
  oddsMax: string
  bookmakerId: string
}

interface SavedFilterView {
  id: string
  name: string
  payload: SavedFilterPayload
}

const FILTER_VIEWS_KEY = 'databet:saved-filter-views'

function loadSavedFilterViews(): SavedFilterView[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(FILTER_VIEWS_KEY)
    return raw ? (JSON.parse(raw) as SavedFilterView[]) : []
  } catch {
    return []
  }
}

function generateViewId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `view_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

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
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [activeScreen, setActiveScreen] = useState<BetsScreen>('overview')
  const [statusFilter, setStatusFilter] = useState<BetStatus | ''>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [search, setSearch] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [grouping, setGrouping] = useState<PeriodGrouping>('month')
  const [stakeMin, setStakeMin] = useState('')
  const [stakeMax, setStakeMax] = useState('')
  const [oddsMin, setOddsMin] = useState('')
  const [oddsMax, setOddsMax] = useState('')
  const [bookmakerFilter, setBookmakerFilter] = useState('')
  const [savedViews, setSavedViews] = useState<SavedFilterView[]>(() => loadSavedFilterViews())
  const [selectedViewId, setSelectedViewId] = useState('')
  const [editingBet, setEditingBet] = useState<Bet | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [areFiltersOpen, setAreFiltersOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(FILTER_VIEWS_KEY, JSON.stringify(savedViews))
  }, [savedViews])

  useEffect(() => {
    if (isDesktop) {
      setAreFiltersOpen(true)
    } else {
      setAreFiltersOpen(false)
    }
  }, [isDesktop])

  const resetSavedViewSelection = () => setSelectedViewId('')

  const handleStatusFilterChange = (value: BetStatus | '') => {
    resetSavedViewSelection()
    setStatusFilter(value)
  }

  const handleDateChange = (nextFrom: string, nextTo: string) => {
    resetSavedViewSelection()
    setFrom(nextFrom)
    setTo(nextTo)
  }

  const handleSearchChange = (value: string) => {
    resetSavedViewSelection()
    setSearch(value)
  }

  const handleTagsChange = (nextTags: string[]) => {
    resetSavedViewSelection()
    setSelectedTags(nextTags)
  }

  const handleGroupingChange = (value: PeriodGrouping) => {
    resetSavedViewSelection()
    setGrouping(value)
  }

  const handleStakeRangeChange = (min: string, max: string) => {
    resetSavedViewSelection()
    setStakeMin(min)
    setStakeMax(max)
  }

  const handleOddsRangeChange = (min: string, max: string) => {
    resetSavedViewSelection()
    setOddsMin(min)
    setOddsMax(max)
  }

  const handleBookmakerChange = (id: string) => {
    resetSavedViewSelection()
    setBookmakerFilter(id)
  }

  const buildSavedPayload = (): SavedFilterPayload => ({
    status: statusFilter,
    from,
    to,
    search,
    tags: selectedTags,
    grouping,
    stakeMin,
    stakeMax,
    oddsMin,
    oddsMax,
    bookmakerId: bookmakerFilter,
  })

  const handleSaveFilterView = (name: string) => {
    const view: SavedFilterView = {
      id: generateViewId(),
      name,
      payload: buildSavedPayload(),
    }
    setSavedViews((prev) => [...prev, view])
    setSelectedViewId(view.id)
    push('success', 'Vista guardada')
  }

  const handleSelectSavedView = (id: string) => {
    if (!id) {
      setSelectedViewId('')
      return
    }
    const view = savedViews.find((entry) => entry.id === id)
    if (!view) return
    setSelectedViewId(id)
    setStatusFilter(view.payload.status ?? '')
    setFrom(view.payload.from ?? '')
    setTo(view.payload.to ?? '')
    setSearch(view.payload.search ?? '')
    setSelectedTags(view.payload.tags ?? [])
    setGrouping(view.payload.grouping ?? 'month')
    setStakeMin(view.payload.stakeMin ?? '')
    setStakeMax(view.payload.stakeMax ?? '')
    setOddsMin(view.payload.oddsMin ?? '')
    setOddsMax(view.payload.oddsMax ?? '')
    setBookmakerFilter(view.payload.bookmakerId ?? '')
  }

  const handleDeleteSavedView = (id: string) => {
    if (!id) return
    setSavedViews((prev) => prev.filter((entry) => entry.id !== id))
    if (selectedViewId === id) {
      setSelectedViewId('')
    }
  }

  const filters = useMemo<BetFilters>(() => {
    return {
      bankrollId: activeBankroll?.id,
      status: statusFilter || undefined,
      from: from ? new Date(from).toISOString() : undefined,
      to: to ? new Date(to).toISOString() : undefined,
      search: search ? search.trim() : undefined,
      tags: selectedTags.length ? selectedTags : undefined,
      stakeMin: stakeMin ? Number(stakeMin) : undefined,
      stakeMax: stakeMax ? Number(stakeMax) : undefined,
      oddsMin: oddsMin ? Number(oddsMin) : undefined,
      oddsMax: oddsMax ? Number(oddsMax) : undefined,
      bookmakerId: bookmakerFilter || undefined,
    }
  }, [activeBankroll?.id, statusFilter, from, to, search, selectedTags, stakeMin, stakeMax, oddsMin, oddsMax, bookmakerFilter])

  const { data: bets = [], isFetching, isLoading } = useQuery<Bet[]>({
    queryKey: [
      'bets',
      filters.bankrollId ?? 'no-bankroll',
      filters.status ?? 'all',
      filters.from ?? 'none',
      filters.to ?? 'none',
      filters.search ?? 'none',
      (filters.tags ?? []).join(','),
      filters.stakeMin ?? 'stake-min-none',
      filters.stakeMax ?? 'stake-max-none',
      filters.oddsMin ?? 'odds-min-none',
      filters.oddsMax ?? 'odds-max-none',
      filters.bookmakerId ?? 'no-bookmaker',
    ],
    queryFn: () => fetchBets(filters),
    enabled: Boolean(filters.bankrollId),
  })

  const { data: tagOptions = [] } = useQuery<string[]>({
    queryKey: ['bet-tags'],
    queryFn: fetchTags,
    staleTime: 1000 * 60 * 10,
  })

  const { data: bookmakers = [] } = useQuery<Bookmaker[]>({
    queryKey: ['bookmakers'],
    queryFn: fetchBookmakers,
    staleTime: 1000 * 60 * 30,
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
          <section className="bets-view__filters" aria-label="Panel de filtros">
            {!isDesktop && (
              <div className="bets-view__filters-header">
                <div>
                  <p className="eyebrow">Filtros</p>
                  <p className="subhead">Ajusta tu vista con los filtros disponibles</p>
                </div>
                <button
                  type="button"
                  className="bets-view__filters-toggle"
                  onClick={() => setAreFiltersOpen((prev) => !prev)}
                  aria-expanded={areFiltersOpen}
                >
                  {areFiltersOpen ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            )}

            {(areFiltersOpen || isDesktop) && (
              <div className={['bets-view__filters-panel', isDesktop ? 'is-desktop' : ''].join(' ').trim()}>
                {!isDesktop && (
                  <div className="bets-view__filters-panel-header">
                    <div>
                      <p className="eyebrow">Vista rápida</p>
                      <h2>Filtros avanzados</h2>
                    </div>
                    <button type="button" onClick={() => setAreFiltersOpen(false)}>
                      Hecho
                    </button>
                  </div>
                )}
                <FiltersBar
                  statusValue={statusFilter}
                  onStatusChange={handleStatusFilterChange}
                  fromValue={from}
                  toValue={to}
                  onDateChange={handleDateChange}
                  isLoading={isFetching || isLoading}
                  searchValue={search}
                  onSearchChange={handleSearchChange}
                  tagOptions={tagOptions}
                  selectedTags={selectedTags}
                  onTagsChange={handleTagsChange}
                  groupingValue={grouping}
                  onGroupingChange={handleGroupingChange}
                  stakeMinValue={stakeMin}
                  stakeMaxValue={stakeMax}
                  onStakeRangeChange={handleStakeRangeChange}
                  oddsMinValue={oddsMin}
                  oddsMaxValue={oddsMax}
                  onOddsRangeChange={handleOddsRangeChange}
                  bookmakerValue={bookmakerFilter}
                  bookmakerOptions={bookmakers}
                  onBookmakerChange={handleBookmakerChange}
                  savedViews={savedViews}
                  selectedViewId={selectedViewId}
                  onSelectSavedView={handleSelectSavedView}
                  onSaveView={handleSaveFilterView}
                  onDeleteView={handleDeleteSavedView}
                />
              </div>
            )}
          </section>

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
