import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { SnackbarProvider } from '@/contexts/SnackbarContext'
import { router } from '@/routes/router'

export default function App() {
  return (
    <AuthProvider>
      <SnackbarProvider>
        <RouterProvider router={router} />
      </SnackbarProvider>
    </AuthProvider>
  )
}
