import { CircularLoader } from '@/components/ui/CircularLoader'

export function TableLoadingOverlay() {
  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center bg-surface-white/60"
      aria-hidden
    >
      <CircularLoader size="md" label="Loading page" />
    </div>
  )
}
