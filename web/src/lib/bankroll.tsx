import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import type { Bankroll } from './types'
import { fetchBankrolls } from './services/bankrolls'

interface BankrollContextValue {
  bankrolls: Bankroll[]
  activeBankroll: Bankroll | null
  selectBankroll: (id: string) => void
  clearSelection: () => void
  isLoading: boolean
  error: string | null
  refresh: () => void
}

const BankrollContext = createContext<BankrollContextValue | undefined>(undefined)
const STORAGE_KEY = 'databet:active-bankroll'

function readStoredBankroll(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(STORAGE_KEY)
}

function persistBankroll(id: string | null) {
  if (typeof window === 'undefined') return
  if (id) {
    window.localStorage.setItem(STORAGE_KEY, id)
  } else {
    window.localStorage.removeItem(STORAGE_KEY)
  }
}

export function BankrollProvider({ children }: PropsWithChildren) {
  const [bankrolls, setBankrolls] = useState<Bankroll[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeBankrollId, setActiveBankrollId] = useState<string | null>(() => readStoredBankroll())

  const loadBankrolls = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchBankrolls()
      setBankrolls(data)

      if (!data.length) {
        setActiveBankrollId(null)
        return
      }

      setActiveBankrollId((previous) => {
        if (previous && data.some((bankroll) => bankroll.id === previous)) {
          return previous
        }
        return previous ?? data[0]?.id ?? null
      })
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'No se pudieron cargar los bankrolls'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    const run = async () => {
      if (!isMounted) return
      await loadBankrolls()
    }
    void run()
    return () => {
      isMounted = false
    }
  }, [loadBankrolls])

  useEffect(() => {
    persistBankroll(activeBankrollId)
  }, [activeBankrollId])

  const activeBankroll = useMemo(() => {
    return bankrolls.find((bankroll) => bankroll.id === activeBankrollId) ?? null
  }, [bankrolls, activeBankrollId])

  const selectBankroll = useCallback((id: string) => {
    setActiveBankrollId((previous) => (previous === id ? previous : id))
  }, [])

  const clearSelection = useCallback(() => {
    setActiveBankrollId(null)
  }, [])

  const value = useMemo(() => ({
    bankrolls,
    activeBankroll,
    selectBankroll,
    clearSelection,
    isLoading,
    error,
    refresh: () => { void loadBankrolls() },
  }), [bankrolls, activeBankroll, selectBankroll, clearSelection, isLoading, error, loadBankrolls])

  return <BankrollContext.Provider value={value}>{children}</BankrollContext.Provider>
}

export function useBankroll() {
  const context = useContext(BankrollContext)
  if (!context) {
    throw new Error('useBankroll debe usarse dentro de BankrollProvider')
  }
  return context
}
