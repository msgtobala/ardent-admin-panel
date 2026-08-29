import { GRAND_TEST_TIME_ZONE } from '@/lib/grand-tests'

const DATETIME_IN_TIMEZONE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/

function getDateTimePartsInTimeZone(
  date: Date,
  timeZone: string,
): {
  year: string
  month: string
  day: string
  hour: string
  minute: string
} {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const map = Object.fromEntries(
    parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]),
  )

  return {
    year: map.year ?? '',
    month: map.month ?? '',
    day: map.day ?? '',
    hour: map.hour ?? '',
    minute: map.minute ?? '',
  }
}

function normalizeHourValue(hour: string): string {
  return hour === '24' ? '00' : hour
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = getDateTimePartsInTimeZone(date, timeZone)
  const normalizedHour = normalizeHourValue(parts.hour)

  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(normalizedHour),
    Number(parts.minute),
  )

  return asUtc - date.getTime()
}

export function toDatetimeInTimeZone(date: Date | null, timeZone: string): string {
  if (!date || Number.isNaN(date.getTime())) return ''

  const parts = getDateTimePartsInTimeZone(date, timeZone)
  if (!parts.year || !parts.month || !parts.day || !parts.hour || !parts.minute) {
    return ''
  }

  const hour = normalizeHourValue(parts.hour)
  return `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}`
}

export function fromDatetimeInTimeZone(value: string, timeZone: string): Date | null {
  const trimmed = value.trim()
  const match = DATETIME_IN_TIMEZONE_PATTERN.exec(trimmed)
  if (!match) return null

  const [, yearStr, monthStr, dayStr, hourStr, minuteStr] = match
  const year = Number(yearStr)
  const month = Number(monthStr)
  const day = Number(dayStr)
  const hour = Number(hourStr)
  const minute = Number(minuteStr)

  if (![year, month, day, hour, minute].every(Number.isFinite)) return null

  const wallClockUtcMs = Date.UTC(year, month - 1, day, hour, minute)
  const guess = new Date(wallClockUtcMs)
  const offset = getTimeZoneOffsetMs(guess, timeZone)
  const result = new Date(wallClockUtcMs - offset)

  const offsetAfter = getTimeZoneOffsetMs(result, timeZone)
  if (offsetAfter !== offset) {
    return new Date(wallClockUtcMs - offsetAfter)
  }

  return result
}

export function toGrandTestDatetimeValue(date: Date | null): string {
  return toDatetimeInTimeZone(date, GRAND_TEST_TIME_ZONE)
}

export function fromGrandTestDatetimeValue(value: string): Date | null {
  return fromDatetimeInTimeZone(value, GRAND_TEST_TIME_ZONE)
}

export function formatBannerDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

export function formatDeviceLoginTimestamp(
  date: Date | null,
  fallback = 'Not available',
): string {
  if (!date || Number.isNaN(date.getTime())) return fallback

  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function toDateInputValue(date: Date | null): string {
  if (!date) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function fromDateInputValue(value: string): Date | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const parsed = new Date(`${trimmed}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return null

  return parsed
}

export function toDatetimeLocalValue(date: Date | null): string {
  if (!date) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function fromDatetimeLocalValue(value: string): Date | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return null

  return parsed
}

export function splitDatetimeLocalValue(value: string): {
  dateValue: string
  timeValue: string
} {
  const trimmed = value.trim()
  if (!trimmed) {
    return { dateValue: '', timeValue: '' }
  }

  const [dateValue, timeValue = ''] = trimmed.split('T')
  return { dateValue, timeValue }
}

export function combineDateAndTimeValues(
  dateValue: string,
  timeValue: string,
  defaultTime = '00:00',
): string {
  const trimmedDate = dateValue.trim()
  if (!trimmedDate) return ''

  const trimmedTime = timeValue.trim() || defaultTime
  return `${trimmedDate}T${trimmedTime}`
}

export function fromDateAndTimeInputValues(
  dateValue: string,
  timeValue: string,
): Date | null {
  const combined = combineDateAndTimeValues(dateValue, timeValue)
  if (!combined) return null

  return fromDatetimeLocalValue(combined)
}
