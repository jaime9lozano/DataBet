import type { ChangeEvent } from 'react'
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
}: FiltersBarProps) {
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
        Agrupar métricas
        <select value={groupingValue} onChange={(event) => onGroupingChange(event.target.value as PeriodGrouping)}>
          {GROUPING_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {isLoading && <span className="filters-loader">Actualizando…</span>}
    </section>
  )
}
