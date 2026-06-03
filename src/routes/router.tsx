import { createBrowserRouter, Navigate } from 'react-router-dom'
import { GuestRoute } from '../components/auth/GuestRoute'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import { AppLayout } from '../components/layout/AppLayout'
import BannersPage from '../pages/BannersPage'
import DashboardPage from '../pages/DashboardPage'
import GrandTestsPage from '../pages/GrandTestsPage'
import LoginPage from '../pages/LoginPage'
import QBanksPage from '../pages/QBanksPage'
import ThreeMinChallengesPage from '../pages/ThreeMinChallengesPage'
import UsersPage from '../pages/UsersPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'users',
        element: <UsersPage />,
      },
      {
        path: 'banners',
        element: <BannersPage />,
      },
      {
        path: 'grand-tests',
        element: <GrandTestsPage />,
      },
      {
        path: 'qbanks',
        element: <QBanksPage />,
      },
      {
        path: '3-min-challenges',
        element: <ThreeMinChallengesPage />,
      },
    ],
  },
])
