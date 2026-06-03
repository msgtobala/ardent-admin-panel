import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { ErrorFallbackScreen } from '@/components/error/ErrorFallbackScreen'

const getRouteErrorMessage = (error: unknown): string => {
  if (isRouteErrorResponse(error)) {
    if (typeof error.data === 'string' && error.data.trim()) {
      return error.data
    }

    if (error.statusText) {
      return error.statusText
    }

    return `Request failed with status ${error.status}`
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return 'We could not load this page. Please try again.'
}

export function RouteErrorPage() {
  const routeError = useRouteError()
  const error = routeError instanceof Error ? routeError : null

  return (
    <ErrorFallbackScreen
      title="Page failed to load"
      message={getRouteErrorMessage(routeError)}
      error={error}
    />
  )
}
