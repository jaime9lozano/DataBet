import { useNotifications } from '../lib/notifications'
import './NotificationCenter.css'

export function NotificationCenter() {
  const { notifications, dismiss } = useNotifications()

  if (!notifications.length) return null

  return (
    <div className="notification-center">
      {notifications.map((notification) => (
        <div key={notification.id} className={`toast toast-${notification.type}`}>
          <span>{notification.message}</span>
          <button onClick={() => dismiss(notification.id)} aria-label="Cerrar alerta">
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
