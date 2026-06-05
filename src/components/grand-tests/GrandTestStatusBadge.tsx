import {
  getGrandTestLifecycleLabel,
  getGrandTestLifecycleStatus,
} from '@/lib/grand-test-status'
import type { GrandTestLifecycleStatus } from '@/types/grand-test'

interface GrandTestStatusBadgeProps {
  testStart: Date
  testExpiry: Date
}

const statusStyles: Record<
  GrandTestLifecycleStatus,
  { container: string; dot: string }
> = {
  upcoming: {
    container: 'bg-surface-container text-on-surface-variant',
    dot: 'bg-on-surface-variant',
  },
  live: {
    container: 'bg-success-bg text-success-green',
    dot: 'bg-success-green',
  },
  expired: {
    container: 'bg-error-bg text-error-red',
    dot: 'bg-error-red',
  },
}

export function GrandTestStatusBadge({
  testStart,
  testExpiry,
}: GrandTestStatusBadgeProps) {
  const status = getGrandTestLifecycleStatus(testStart, testExpiry)
  const label = getGrandTestLifecycleLabel(status)
  const styles = statusStyles[status]

  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-body-md font-normal',
        styles.container,
      ].join(' ')}
    >
      <span
        aria-hidden
        className={['size-1.5 rounded-full', styles.dot].join(' ')}
      />
      {label}
    </span>
  )
}
