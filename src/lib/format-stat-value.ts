export function formatDashboardStatValue(count: number): string {
  if (count >= 1_000_000) {
    const millions = count / 1_000_000
    const formatted = millions.toFixed(1)
    return `${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}M`
  }

  if (count >= 10_000) {
    const thousands = count / 1_000
    const formatted = thousands.toFixed(1)
    return `${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}k`
  }

  return count.toLocaleString('en-US')
}
