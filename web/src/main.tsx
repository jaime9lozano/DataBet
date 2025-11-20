import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { SessionProvider } from './lib/session'
import { NotificationsProvider } from './lib/notifications'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <NotificationsProvider>
        <SessionProvider>
          <App />
        </SessionProvider>
      </NotificationsProvider>
    </QueryClientProvider>
  </StrictMode>,
)
