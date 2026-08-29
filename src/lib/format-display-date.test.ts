import { describe, expect, it } from 'vitest'
import { formatGrandTestDisplayDate } from '@/lib/format-display-date'
import { GRAND_TEST_TIME_ZONE } from '@/lib/grand-tests'

describe('formatGrandTestDisplayDate', () => {
  it('formats timestamps in IST regardless of runtime timezone', () => {
    const date = new Date('2026-06-29T03:30:00.000Z')
    const formatted = formatGrandTestDisplayDate(date)
    const expected = new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: GRAND_TEST_TIME_ZONE,
    }).format(date)

    expect(formatted).toBe(expected)
    expect(formatted).toMatch(/9:00/)
  })
})
