import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GlobalErrorBoundary } from '@/components/error/GlobalErrorBoundary'
import './index.css'
import App from '@/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </StrictMode>,
)
