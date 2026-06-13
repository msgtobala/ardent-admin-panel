import type { SelectOption } from '@/components/ui/SelectField'

export type TimePeriod = 'AM' | 'PM'

export type TimeParts = {
  hour: string
  minute: string
  period: TimePeriod
}

const HOUR_OPTIONS: SelectOption[] = Array.from({ length: 12 }, (_, index) => {
  const hour = String(index + 1).padStart(2, '0')
  return { value: hour, label: hour }
})

const MINUTE_OPTIONS: SelectOption[] = Array.from({ length: 60 }, (_, index) => {
  const minute = String(index).padStart(2, '0')
  return { value: minute, label: minute }
})

const PERIOD_OPTIONS: SelectOption[] = [
  { value: 'AM', label: 'AM' },
  { value: 'PM', label: 'PM' },
]

export function getHourSelectOptions(): SelectOption[] {
  return HOUR_OPTIONS
}

export function getMinuteSelectOptions(): SelectOption[] {
  return MINUTE_OPTIONS
}

export function getPeriodSelectOptions(): SelectOption[] {
  return PERIOD_OPTIONS
}

export function parseTimeValue(value: string, defaultTime = '00:00'): TimeParts {
  const normalized = value.trim() || defaultTime
  const [hoursStr = '0', minutesStr = '0'] = normalized.split(':')
  const hours24 = Number.parseInt(hoursStr, 10)
  const minutes = Number.parseInt(minutesStr, 10)

  const safeHours24 = Number.isNaN(hours24) ? 0 : Math.min(23, Math.max(0, hours24))
  const safeMinutes = Number.isNaN(minutes) ? 0 : Math.min(59, Math.max(0, minutes))
  const period: TimePeriod = safeHours24 >= 12 ? 'PM' : 'AM'

  let hours12 = safeHours24 % 12
  if (hours12 === 0) hours12 = 12

  return {
    hour: String(hours12).padStart(2, '0'),
    minute: String(safeMinutes).padStart(2, '0'),
    period,
  }
}

export function formatTimeValue(parts: TimeParts): string {
  const parsedHour = Number.parseInt(parts.hour, 10)
  const parsedMinute = Number.parseInt(parts.minute, 10)
  const safeHour12 = Number.isNaN(parsedHour)
    ? 12
    : Math.min(12, Math.max(1, parsedHour))
  const safeMinute = Number.isNaN(parsedMinute)
    ? 0
    : Math.min(59, Math.max(0, parsedMinute))

  let hours24 = safeHour12 % 12
  if (parts.period === 'PM') {
    hours24 += 12
  }

  return `${String(hours24).padStart(2, '0')}:${String(safeMinute).padStart(2, '0')}`
}
