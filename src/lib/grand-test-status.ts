import type { GrandTestLifecycleStatus } from '@/types/grand-test'

export function getGrandTestLifecycleStatus(
  testStart: Date,
  testExpiry: Date,
  now: Date = new Date(),
): GrandTestLifecycleStatus {
  if (now.getTime() >= testExpiry.getTime()) {
    return 'expired'
  }

  if (now.getTime() < testStart.getTime()) {
    return 'upcoming'
  }

  return 'live'
}

export function getGrandTestLifecycleLabel(status: GrandTestLifecycleStatus): string {
  if (status === 'upcoming') return 'Upcoming'
  if (status === 'live') return 'Live'
  return 'Expired'
}
