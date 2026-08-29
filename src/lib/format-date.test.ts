import { describe, expect, it } from 'vitest'
import {
  fromDatetimeInTimeZone,
  fromGrandTestDatetimeValue,
  toDatetimeInTimeZone,
  toGrandTestDatetimeValue,
} from '@/lib/format-date'
import { GRAND_TEST_TIME_ZONE } from '@/lib/grand-tests'

describe('grand test datetime timezone helpers', () => {
  it('parses IST wall-clock time to the correct UTC instant', () => {
    const parsed = fromGrandTestDatetimeValue('2026-06-29T09:00')

    expect(parsed).not.toBeNull()
    expect(parsed?.toISOString()).toBe('2026-06-29T03:30:00.000Z')
  })

  it('formats a UTC instant as IST wall-clock time', () => {
    const formatted = toGrandTestDatetimeValue(new Date('2026-06-29T03:30:00.000Z'))

    expect(formatted).toBe('2026-06-29T09:00')
  })

  it('round-trips IST datetime values', () => {
    const value = '2026-06-29T09:00'
    const parsed = fromGrandTestDatetimeValue(value)

    expect(parsed).not.toBeNull()
    expect(toGrandTestDatetimeValue(parsed)).toBe(value)
  })

  it('handles midnight IST', () => {
    const value = '2026-06-30T00:00'
    const parsed = fromGrandTestDatetimeValue(value)

    expect(parsed).not.toBeNull()
    expect(parsed?.toISOString()).toBe('2026-06-29T18:30:00.000Z')
    expect(toGrandTestDatetimeValue(parsed)).toBe(value)
  })

  it('returns null for invalid datetime strings', () => {
    expect(fromGrandTestDatetimeValue('')).toBeNull()
    expect(fromGrandTestDatetimeValue('2026-06-29')).toBeNull()
    expect(fromGrandTestDatetimeValue('not-a-date')).toBeNull()
  })

  it('returns empty string for invalid dates when formatting', () => {
    expect(toGrandTestDatetimeValue(null)).toBe('')
    expect(toGrandTestDatetimeValue(new Date('invalid'))).toBe('')
  })
})

describe('generic timezone datetime helpers', () => {
  it('supports arbitrary IANA time zones', () => {
    const timeZone = 'America/New_York'
    const value = '2026-01-15T09:30'
    const parsed = fromDatetimeInTimeZone(value, timeZone)

    expect(parsed).not.toBeNull()
    expect(toDatetimeInTimeZone(parsed, timeZone)).toBe(value)
  })

  it('uses Asia/Kolkata for grand test wrappers', () => {
    const date = new Date('2026-06-29T03:30:00.000Z')

    expect(toGrandTestDatetimeValue(date)).toBe(
      toDatetimeInTimeZone(date, GRAND_TEST_TIME_ZONE),
    )
  })
})
