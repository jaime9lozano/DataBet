import { createContext, useContext, useMemo, useState, useCallback, type PropsWithChildren } from 'react'

type NotificationType = 'success' | 'error' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  message: string
}

interface NotificationsContextValue {
  notifications: Notification[]
  push: (type: NotificationType, message: string, options?: { timeout?: number }) => void
  dismiss: (id: string) => void
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined)

export function NotificationsProvider({ children }: PropsWithChildren) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }, [])

  const push = useCallback(
    (type: NotificationType, message: string, options?: { timeout?: number }) => {
      const id = crypto.randomUUID()
      setNotifications((prev) => [...prev, { id, type, message }])

      const timeout = options?.timeout ?? 4000
      if (timeout > 0) {
        setTimeout(() => dismiss(id), timeout)
      }
    },
    [dismiss],
  )

  const value = useMemo(() => ({ notifications, push, dismiss }), [notifications, push, dismiss])

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (!context) {
    throw new Error('useNotifications debe usarse dentro de NotificationsProvider')
  }
  return context
}
