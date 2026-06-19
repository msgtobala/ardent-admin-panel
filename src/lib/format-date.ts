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
