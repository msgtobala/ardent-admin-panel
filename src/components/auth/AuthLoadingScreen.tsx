import { CircularLoader } from '../ui/CircularLoader'

export function AuthLoadingScreen() {
  return (
    <div
      className="flex min-h-svh items-center justify-center bg-app-bg"
      aria-live="polite"
    >
      <CircularLoader size="lg" />
    </div>
  )
}
