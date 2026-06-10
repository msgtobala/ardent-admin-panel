import { DashboardStatCard } from '@/components/dashboard/DashboardStatCard'
import { UserEngagementCard } from '@/components/dashboard/UserEngagementCard'
import { TableErrorState } from '@/components/ui/table'
import { formatDashboardStatValue } from '@/lib/format-stat-value'
import { useDashboardStats } from '@/hooks/useDashboardStats'

export default function DashboardPage() {
  const { stats, isLoading, error, handleRetry } = useDashboardStats()

  return (
    <div className="flex flex-col gap-gutter">
      <div className="flex max-w-3xl flex-col gap-2">
        <h1 className="text-section-title text-on-surface">Dashboard</h1>
        <p className="text-body-md text-on-surface-variant">
          Overview of registered students and published video content across the platform
        </p>
      </div>

      {error ? <TableErrorState message={error} onRetry={handleRetry} /> : null}

      <section
        aria-label="Dashboard statistics"
        className="grid gap-gutter sm:grid-cols-2 lg:grid-cols-4"
      >
        <DashboardStatCard
          title="Total Registered User"
          value={formatDashboardStatValue(stats.totalStudents)}
          icon="school"
          badge={{ label: 'Live count', icon: 'groups' }}
          footerText="registered students"
          isLoading={isLoading}
        />
        <DashboardStatCard
          title="Total Active Videos"
          value={formatDashboardStatValue(stats.totalVideos)}
          icon="play_circle"
          badge={{ label: 'Active Now' }}
          isLoading={isLoading}
        />
      </section>

      <UserEngagementCard />
    </div>
  )
}
