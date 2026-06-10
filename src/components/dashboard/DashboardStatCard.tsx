import { MaterialIcon } from '@/components/ui/MaterialIcon'

interface DashboardStatBadge {
  label: string
  icon?: string
}

interface DashboardStatCardProps {
  title: string
  value: string
  icon: string
  badge?: DashboardStatBadge
  footerText?: string
  isLoading?: boolean
}

function DashboardStatCardSkeleton() {
  return (
    <article
      aria-hidden
      className="rounded-xl border border-border-subtle bg-surface-white p-5 shadow-tier-1"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-1 flex-col gap-3">
          <div className="h-3 w-36 animate-pulse rounded bg-surface-container" />
          <div className="h-9 w-24 animate-pulse rounded bg-surface-container" />
        </div>
        <div className="size-11 animate-pulse rounded-xl bg-surface-container" />
      </div>
      <div className="mt-4 h-6 w-32 animate-pulse rounded-full bg-surface-container" />
    </article>
  )
}

export function DashboardStatCard({
  title,
  value,
  icon,
  badge,
  footerText,
  isLoading = false,
}: DashboardStatCardProps) {
  if (isLoading) return <DashboardStatCardSkeleton />

  return (
    <article className="rounded-xl border border-border-subtle bg-surface-white p-5 shadow-tier-1">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <p className="text-label-sm uppercase tracking-[0.04em] text-on-surface-variant">
            {title}
          </p>
          <p className="text-[32px] font-semibold leading-none text-on-surface">{value}</p>
        </div>
        <div
          aria-hidden
          className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-fixed"
        >
          <MaterialIcon name={icon} size={24} className="text-primary" />
        </div>
      </div>

      {badge || footerText ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {badge ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-success-bg px-2.5 py-1 text-label-sm text-success-green">
              {badge.icon ? (
                <MaterialIcon name={badge.icon} size={16} aria-hidden />
              ) : null}
              {badge.label}
            </span>
          ) : null}
          {footerText ? (
            <span className="text-body-md text-on-surface-variant">{footerText}</span>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}
