import { describe, expect, it } from 'vitest'
import { Timestamp } from 'firebase/firestore'
import { formatDeviceLoginTimestamp } from '@/lib/format-date'
import { parseDeviceDetails } from '@/lib/students'

describe('formatDeviceLoginTimestamp', () => {
  it('returns fallback when date is null', () => {
    expect(formatDeviceLoginTimestamp(null)).toBe('Not available')
  })

  it('formats a valid date', () => {
    const formatted = formatDeviceLoginTimestamp(new Date('2026-01-15T14:30:00'))
    expect(formatted).toContain('Jan')
    expect(formatted).toContain('2026')
  })
})

describe('parseDeviceDetails', () => {
  it('returns null for missing device details', () => {
    expect(parseDeviceDetails(null)).toBeNull()
    expect(parseDeviceDetails(undefined)).toBeNull()
  })

  it('parses device fields from firestore payload', () => {
    const loginTimestamp = Timestamp.fromDate(new Date('2026-02-01T10:00:00'))

    expect(
      parseDeviceDetails({
        deviceId: 'abc123',
        deviceName: 'Pixel 8',
        platform: 'Android',
        loginTimestamp,
      }),
    ).toEqual({
      deviceName: 'Pixel 8',
      platform: 'Android',
      loginTimestamp: loginTimestamp.toDate(),
    })
  })
})
