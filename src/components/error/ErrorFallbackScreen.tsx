import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

interface ErrorFallbackScreenProps {
  title?: string
  message?: string
  error?: Error | null
  onRetry?: () => void
  onGoHome?: () => void
}

export function ErrorFallbackScreen({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again or return to the dashboard.',
  error = null,
  onRetry,
  onGoHome,
}: ErrorFallbackScreenProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry()
      return
    }

    window.location.reload()
  }

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome()
      return
    }

    window.location.assign('/dashboard')
  }

  return (
    <div
      className="flex min-h-svh items-center justify-center bg-app-bg px-gutter py-gutter"
      role="alert"
      aria-live="assertive"
    >
      <div className="w-full max-w-md rounded-lg border border-border-subtle bg-surface-white p-gutter shadow-tier-1">
        <div className="mb-4 flex items-center gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-error-red/10"
            aria-hidden="true"
          >
            <MaterialIcon name="error" size={24} className="text-error-red" />
          </span>
          <h1 className="text-section-title text-on-surface">{title}</h1>
        </div>

        <p className="mb-6 text-body-md text-on-surface-variant">{message}</p>

        {import.meta.env.DEV && error?.message ? (
          <pre className="mb-6 overflow-x-auto rounded-input border border-border-subtle bg-app-bg p-3 text-label-sm text-error-red">
            {error.message}
          </pre>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={handleRetry} aria-label="Retry loading the page">
            Try again
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleGoHome}
            aria-label="Go to dashboard"
          >
            Go to dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
