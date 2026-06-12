import { useMemo, useState } from 'react'
import { UserEngagementBarChart } from '@/components/dashboard/UserEngagementBarChart'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { TableErrorState } from '@/components/ui/table'
import { useUserEngagement } from '@/hooks/useUserEngagement'

const YEAR_LOOKBACK = 5

const yearSelectClassName =
  'h-[38px] min-w-[132px] appearance-none rounded-lg border border-border-subtle bg-surface-white py-2 pl-3 pr-9 text-body-md text-on-surface shadow-tier-1 focus:border-primary-action focus:outline-none focus:ring-2 focus:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-60'

function buildYearOptions(): number[] {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: YEAR_LOOKBACK + 1 }, (_, index) => currentYear - index)
}

export function UserEngagementCard() {
  const yearOptions = useMemo(() => buildYearOptions(), [])
  const [selectedYear, setSelectedYear] = useState(yearOptions[0])
  const { data, isLoading, error, handleRetry } = useUserEngagement(selectedYear)

  const monthlyCounts = useMemo(() => {
    if (!data) return Array.from({ length: 12 }, () => 0)

    const counts = Array.from({ length: 12 }, () => 0)
    for (const monthEntry of data.months) {
      if (monthEntry.month >= 1 && monthEntry.month <= 12) {
        counts[monthEntry.month - 1] = monthEntry.count
      }
    }

    return counts
  }, [data])

  return (
    <section className="rounded-xl border border-border-subtle bg-surface-white p-5 shadow-tier-1 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-card-title text-on-surface">User Engagement</h2>
          <p className="text-body-md text-on-surface-variant">
            Number of users logged in per month
          </p>
        </div>

        <div className="relative w-fit shrink-0">
          <label htmlFor="user-engagement-year" className="sr-only">
            Select year
          </label>
          <select
            id="user-engagement-year"
            value={selectedYear}
            disabled={isLoading}
            onChange={(event) => setSelectedYear(Number(event.target.value))}
            className={yearSelectClassName}
            aria-label="Select year for user engagement chart"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                Year {year}
              </option>
            ))}
          </select>
          <MaterialIcon
            name="expand_more"
            size={18}
            aria-hidden
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
          />
        </div>
      </div>

      {error ? (
        <TableErrorState message={error} onRetry={handleRetry} />
      ) : (
        <UserEngagementBarChart monthlyCounts={monthlyCounts} isLoading={isLoading} />
      )}
    </section>
  )
}
