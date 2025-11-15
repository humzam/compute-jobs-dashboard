import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ComputationalJobsDashboard } from './pages/ComputationalJobsDashboard'
import { ToastProvider } from './contexts/ToastContext'

// Create a client with optimized cache settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes - data is fresh for 2 minutes
      gcTime: 15 * 60 * 1000, // 15 minutes - keep unused data for 15 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors, but retry on network errors
        if (error?.status >= 400 && error?.status < 500) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: true,
      refetchOnMount: 'always', // Always refetch to ensure fresh data
      networkMode: 'online', // Only query when online
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/dashboard" element={<ComputationalJobsDashboard />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </ToastProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App