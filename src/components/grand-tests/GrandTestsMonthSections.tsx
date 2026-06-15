import type { GrandTest, GrandTestMonthGroup } from '@/types/grand-test'
import { TableErrorState } from '@/components/ui/table'
import {
  GrandTestsMonthSection,
  GrandTestsMonthSectionSkeleton,
} from './GrandTestsMonthSection'

interface GrandTestsMonthSectionsProps {
  monthGroups: GrandTestMonthGroup[]
  isLoading: boolean
  error?: string
  emptyMessage: string
  monthEmptyMessage: string
  onRetry: () => void
  showEdit?: boolean
  onEdit?: (test: GrandTest) => void
  showLeaderboard?: boolean
  onViewLeaderboard?: (test: GrandTest) => void
}

export function GrandTestsMonthSections({
  monthGroups,
  isLoading,
  error,
  emptyMessage,
  monthEmptyMessage,
  onRetry,
  showEdit = false,
  onEdit,
  showLeaderboard = false,
  onViewLeaderboard,
}: GrandTestsMonthSectionsProps) {
  if (error) {
    return <TableErrorState message={error} onRetry={onRetry} />
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-gutter">
        <GrandTestsMonthSectionSkeleton />
      </div>
    )
  }

  if (monthGroups.length === 0) {
    return (
      <div className="rounded-xl border border-border-subtle bg-surface-white px-gutter py-gutter shadow-tier-1">
        <p className="text-body-md text-on-surface-variant">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-gutter">
      {monthGroups.map((group) => (
        <GrandTestsMonthSection
          key={group.monthKey}
          group={group}
          emptyMessage={monthEmptyMessage}
          showEdit={showEdit}
          onEdit={onEdit}
          showLeaderboard={showLeaderboard}
          onViewLeaderboard={onViewLeaderboard}
        />
      ))}
    </div>
  )
}
