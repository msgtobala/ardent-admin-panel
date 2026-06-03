import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { AuthLoadingScreen } from './AuthLoadingScreen'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isAdmin, isLoading } = useAuth()

  if (isLoading) return <AuthLoadingScreen />
  if (!user || !isAdmin) return <Navigate to="/login" replace />

  return children
}
