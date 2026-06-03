export function formatBannerDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
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
