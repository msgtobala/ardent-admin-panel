import { SelectField } from '@/components/ui/SelectField'
import {
  USER_QUERY_STATUS_FILTER_OPTIONS,
  formatUserQueryStatus,
} from '@/lib/user-query-display'
import type { UserQueryStatusFilter } from '@/types/user-query'

interface UserQueriesPageHeaderProps {
  totalCount: number
  statusFilter: UserQueryStatusFilter
  onStatusFilterChange: (value: string) => void
  disabled?: boolean
}

export function UserQueriesPageHeader({
  totalCount,
  statusFilter,
  onStatusFilterChange,
  disabled = false,
}: UserQueriesPageHeaderProps) {
  const countLabel =
    totalCount === 1 ? '1 ticket' : `${totalCount.toLocaleString()} tickets`
  const filteredCountLabel =
    statusFilter === 'all'
      ? countLabel
      : `${countLabel} (${formatUserQueryStatus(statusFilter).toLowerCase()})`

  return (
    <div className="flex flex-col gap-gutter">
      <div className="flex items-end justify-between gap-gutter">
        <div className="flex max-w-[672px] flex-col gap-2">
          <h1 className="text-section-title text-on-surface">User Queries</h1>
          <p className="text-body-md text-on-surface-variant">
            Review support tickets submitted by students, inspect issue details, and
            resolve, reject, or reopen tickets as needed.
          </p>
          <p className="text-body-sm text-on-surface-variant">{filteredCountLabel}</p>
        </div>
        <div className="w-full max-w-[220px] shrink-0">
          <SelectField
            id="user-queries-status-filter"
            label="Ticket status"
            value={statusFilter}
            options={USER_QUERY_STATUS_FILTER_OPTIONS}
            disabled={disabled}
            onChange={onStatusFilterChange}
          />
        </div>
      </div>
    </div>
  )
}
