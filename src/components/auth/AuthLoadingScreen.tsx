export function AuthLoadingScreen() {
  return (
    <div
      className="flex min-h-svh items-center justify-center bg-app-bg"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <p className="text-body-md text-on-surface-variant">Loading...</p>
    </div>
  )
}
