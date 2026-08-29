import { GRAND_TEST_TIME_ZONE } from '@/lib/grand-tests'

const DAILY_QUESTION_TIME_ZONE = 'Asia/Kolkata'

export function formatDisplayDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function formatGrandTestDisplayDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: GRAND_TEST_TIME_ZONE,
  }).format(date)
}

export function formatTodayDate(): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeZone: DAILY_QUESTION_TIME_ZONE,
  }).format(new Date())
}

export function getTodayDateIso(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: DAILY_QUESTION_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}
