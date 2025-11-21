import { useState, type ChangeEvent } from 'react'
import type { BetStatus, PeriodGrouping } from '../../../lib/types'

interface FiltersBarProps {
  statusValue: BetStatus | ''
  onStatusChange: (value: BetStatus | '') => void
  fromValue: string
  toValue: string
  onDateChange: (from: string, to: string) => void
  isLoading: boolean
  searchValue: string
  onSearchChange: (value: string) => void
  tagOptions: string[]
  selectedTags: string[]
  onTagsChange: (next: string[]) => void
  groupingValue: PeriodGrouping
  onGroupingChange: (value: PeriodGrouping) => void
  stakeMinValue: string
  stakeMaxValue: string
  onStakeRangeChange: (min: string, max: string) => void
  oddsMinValue: string
  oddsMaxValue: string
  onOddsRangeChange: (min: string, max: string) => void
  bookmakerValue: string
  bookmakerOptions: Array<{ id: string; name: string; country: string | null }>
  onBookmakerChange: (id: string) => void
  savedViews: Array<{ id: string; name: string }>
  selectedViewId: string
  onSelectSavedView: (id: string) => void
  onSaveView: (name: string) => void
  onDeleteView: (id: string) => void
}

const STATUS_OPTIONS: { label: string; value: BetStatus | '' }[] = [
  { label: 'Todas', value: '' },
  { label: 'Pendientes', value: 'pending' },
  { label: 'Ganadas', value: 'won' },
  { label: 'Perdidas', value: 'lost' },
  { label: 'Void', value: 'void' },
  { label: 'Cashout', value: 'cashed_out' },
]

const GROUPING_OPTIONS: { label: string; value: PeriodGrouping }[] = [
  { label: 'Por semanas', value: 'week' },
  { label: 'Por meses', value: 'month' },
  { label: 'Por trimestres', value: 'quarter' },
]

export function FiltersBar({
  statusValue,
  onStatusChange,
  fromValue,
  toValue,
  onDateChange,
  isLoading,
  searchValue,
  onSearchChange,
  tagOptions,
  selectedTags,
  onTagsChange,
  groupingValue,
  onGroupingChange,
  stakeMinValue,
  stakeMaxValue,
  onStakeRangeChange,
  oddsMinValue,
  oddsMaxValue,
  onOddsRangeChange,
  bookmakerValue,
  bookmakerOptions,
  onBookmakerChange,
  savedViews,
  selectedViewId,
  onSelectSavedView,
  onSaveView,
  onDeleteView,
}: FiltersBarProps) {
  const [viewName, setViewName] = useState('')
  const handleTagsChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = Array.from(event.target.selectedOptions).map((option) => option.value)
    onTagsChange(next)
  }

  return (
    <section className="filters-bar">
      <label className="full">
        Buscar
        <input type="search" value={searchValue} onChange={(event) => onSearchChange(event.target.value)} placeholder="Notas o etiquetas" />
      </label>
      <label>
        Estado
        <select value={statusValue} onChange={(event) => onStatusChange(event.target.value as BetStatus | '')}>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Stake mínimo
        <input
          type="number"
          step="0.01"
          min="0"
          value={stakeMinValue}
          onChange={(event) => onStakeRangeChange(event.target.value, stakeMaxValue)}
        />
      </label>
      <label>
        Stake máximo
        <input
          type="number"
          step="0.01"
          min="0"
          value={stakeMaxValue}
          onChange={(event) => onStakeRangeChange(stakeMinValue, event.target.value)}
        />
      </label>
      <label>
        Cuota mínima
        <input
          type="number"
          step="0.01"
          min="0"
          value={oddsMinValue}
          onChange={(event) => onOddsRangeChange(event.target.value, oddsMaxValue)}
        />
      </label>
      <label>
        Cuota máxima
        <input
          type="number"
          step="0.01"
          min="0"
          value={oddsMaxValue}
          onChange={(event) => onOddsRangeChange(oddsMinValue, event.target.value)}
        />
      </label>
      <label>
        Desde
        <input type="date" value={fromValue} onChange={(event) => onDateChange(event.target.value, toValue)} />
      </label>
      <label>
        Hasta
        <input type="date" value={toValue} onChange={(event) => onDateChange(fromValue, event.target.value)} />
      </label>
      <label>
        Tags
        <select multiple value={selectedTags} onChange={handleTagsChange} disabled={tagOptions.length === 0}>
          {tagOptions.length === 0 && <option disabled value="">Sin etiquetas</option>}
          {tagOptions.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
        <span className="filters-hint">Mantén Cmd/Ctrl para multi selección</span>
      </label>
      <label>
        Bookmaker
        <select value={bookmakerValue} onChange={(event) => onBookmakerChange(event.target.value)}>
          <option value="">Todos</option>
          {bookmakerOptions.map((bookmaker) => (
            <option key={bookmaker.id} value={bookmaker.id}>
              {bookmaker.name}
              {bookmaker.country ? ` · ${bookmaker.country}` : ''}
            </option>
          ))}
        </select>
      </label>
      <label>
        Agrupar métricas
        <select value={groupingValue} onChange={(event) => onGroupingChange(event.target.value as PeriodGrouping)}>
          {GROUPING_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <div className="filters-saved full">
        <label>
          Vistas guardadas
          <select value={selectedViewId} onChange={(event) => onSelectSavedView(event.target.value)}>
            <option value="">Selecciona una vista</option>
            {savedViews.map((view) => (
              <option key={view.id} value={view.id}>
                {view.name}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="ghost" onClick={() => onDeleteView(selectedViewId)} disabled={!selectedViewId}>
          Eliminar vista
        </button>
      </div>
      <div className="filters-saved full">
        <input
          type="text"
          value={viewName}
          onChange={(event) => setViewName(event.target.value)}
          placeholder="Nombre para guardar filtros"
        />
        <button type="button" onClick={() => {
          if (!viewName.trim()) return
          onSaveView(viewName.trim())
          setViewName('')
        }}>
          Guardar vista
        </button>
      </div>
      {isLoading && <span className="filters-loader">Actualizando…</span>}
    </section>
  )
}
