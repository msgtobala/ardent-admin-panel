import { createBrowserRouter, Navigate } from 'react-router-dom'
import { GuestRoute } from '@/components/auth/GuestRoute'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RouteErrorPage } from '@/components/error/RouteErrorPage'
import { AppLayout } from '@/components/layout/AppLayout'
import BannersPage from '@/pages/BannersPage'
import DashboardPage from '@/pages/DashboardPage'
import FacultiesPage from '@/pages/FacultiesPage'
import GrandTestsPage from '@/pages/GrandTestsPage'
import LoginPage from '@/pages/LoginPage'
import PlansPage from '@/pages/PlansPage'
import QBanksPage from '@/pages/QBanksPage'
import QbankSubjectsPage from '@/pages/QbankSubjectsPage'
import ClinicalVignettesPage from '@/pages/ClinicalVignettesPage'
import McqOfTheDayPage from '@/pages/McqOfTheDayPage'
import TenMinsConceptPage from '@/pages/TenMinsConceptPage'
import ThreeMinChallengesPage from '@/pages/ThreeMinChallengesPage'
import VideoChaptersPage from '@/pages/VideoChaptersPage'
import EditModulesPage from '@/pages/EditModulesPage'
import GenerateThumbnailPage from '@/pages/GenerateThumbnailPage'
import VideosPage from '@/pages/VideosPage'
import StudentsPage from '@/pages/StudentsPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    errorElement: <RouteErrorPage />,
    element: (
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
  },
  {
    path: '/',
    errorElement: <RouteErrorPage />,
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
        path: 'students',
        element: <StudentsPage />,
      },
      {
        path: 'users',
        element: <Navigate to="/students" replace />,
      },
      {
        path: 'faculties',
        element: <FacultiesPage />,
      },
      {
        path: 'plans',
        element: <PlansPage />,
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
        path: 'qbank-subjects',
        element: <QbankSubjectsPage />,
      },
      {
        path: 'mcq-of-the-day',
        element: <McqOfTheDayPage />,
      },
      {
        path: '3-min-challenges',
        element: <ThreeMinChallengesPage />,
      },
      {
        path: '10-mins-concept',
        element: <TenMinsConceptPage />,
      },
      {
        path: 'clinical-vignettes',
        element: <ClinicalVignettesPage />,
      },
      {
        path: 'video-chapters',
        element: <VideoChaptersPage />,
      },
      {
        path: 'edit-modules',
        element: <EditModulesPage />,
      },
      {
        path: 'videos',
        element: <VideosPage />,
      },
      {
        path: 'generate-thumbnail',
        element: <GenerateThumbnailPage />,
      },
    ],
  },
])
