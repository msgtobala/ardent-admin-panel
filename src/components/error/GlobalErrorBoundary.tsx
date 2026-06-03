import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorFallbackScreen } from '@/components/error/ErrorFallbackScreen'

interface GlobalErrorBoundaryProps {
  children: ReactNode
}

interface GlobalErrorBoundaryState {
  error: Error | null
  hasError: boolean
}

export class GlobalErrorBoundary extends Component<
  GlobalErrorBoundaryProps,
  GlobalErrorBoundaryState
> {
  state: GlobalErrorBoundaryState = {
    error: null,
    hasError: false,
  }

  static getDerivedStateFromError(error: Error): GlobalErrorBoundaryState {
    return {
      error,
      hasError: true,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[GlobalErrorBoundary]', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ error: null, hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallbackScreen
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      )
    }

    return this.props.children
  }
}
