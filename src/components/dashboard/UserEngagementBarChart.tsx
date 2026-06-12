import { buildChartTicks, getNiceChartMaxValue } from '@/lib/chart-scale'

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

interface UserEngagementBarChartProps {
  monthlyCounts: number[]
  isLoading?: boolean
}

function UserEngagementBarChartSkeleton() {
  return (
    <div aria-hidden className="flex h-[280px] flex-col gap-4">
      <div className="flex flex-1 gap-4">
        <div className="flex w-10 flex-col justify-between py-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={`y-skeleton-${index}`} className="h-3 w-6 animate-pulse rounded bg-surface-container" />
          ))}
        </div>
        <div className="flex flex-1 items-end gap-3 border border-border-subtle bg-surface-container-low px-4 py-4">
          {Array.from({ length: 12 }).map((_, index) => (
            <div
              key={`bar-skeleton-${index}`}
              className="flex flex-1 flex-col justify-end"
            >
              <div
                className="w-full animate-pulse rounded-t-md bg-surface-container"
                style={{ height: `${30 + (index % 4) * 15}%` }}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="ml-14 flex gap-3">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={`x-skeleton-${index}`} className="h-3 flex-1 animate-pulse rounded bg-surface-container" />
        ))}
      </div>
    </div>
  )
}

export function UserEngagementBarChart({
  monthlyCounts,
  isLoading = false,
}: UserEngagementBarChartProps) {
  if (isLoading) return <UserEngagementBarChartSkeleton />

  const maxCount = Math.max(...monthlyCounts, 0)
  const chartMax = getNiceChartMaxValue(maxCount)
  const yTicks = buildChartTicks(maxCount)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-4">
        <div
          aria-hidden
          className="flex w-10 shrink-0 flex-col justify-between py-1 text-right text-caption text-on-surface-variant"
        >
          {yTicks.map((tick) => (
            <span key={`tick-${tick}`}>{tick}</span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between py-1">
            {yTicks.map((tick) => (
              <div
                key={`grid-${tick}`}
                className="border-t border-border-subtle/80"
              />
            ))}
          </div>

          <div className="relative flex h-[240px] items-end gap-2 border border-border-subtle bg-surface-container-low px-4 pb-4 pt-6 sm:gap-3">
            {monthlyCounts.map((count, index) => {
              const heightPercent = chartMax > 0 ? (count / chartMax) * 100 : 0

              return (
                <div
                  key={`month-bar-${MONTH_LABELS[index]}`}
                  className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
                >
                  <div className="flex h-full w-full flex-col justify-end">
                    <div
                      className="w-full rounded-t-md bg-primary-action transition-[height] duration-300"
                      style={{
                        height: `${heightPercent}%`,
                        minHeight: count > 0 ? '6px' : '0',
                      }}
                      role="img"
                      aria-label={`${MONTH_LABELS[index]}: ${count} users logged in`}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="ml-14 grid grid-cols-12 gap-2 text-center text-caption text-on-surface-variant sm:gap-3">
        {MONTH_LABELS.map((label) => (
          <span key={`label-${label}`}>{label}</span>
        ))}
      </div>
    </div>
  )
}
