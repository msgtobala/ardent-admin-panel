interface UserQueriesPageHeaderProps {
  totalCount: number
}

export function UserQueriesPageHeader({ totalCount }: UserQueriesPageHeaderProps) {
  const countLabel =
    totalCount === 1 ? '1 ticket' : `${totalCount.toLocaleString()} tickets`

  return (
    <div className="flex items-end justify-between gap-gutter">
      <div className="flex max-w-[672px] flex-col gap-2">
        <h1 className="text-section-title text-on-surface">User Queries</h1>
        <p className="text-body-md text-on-surface-variant">
          Review support tickets submitted by students, inspect issue details, and
          resolve, reject, or reopen tickets as needed.
        </p>
        <p className="text-body-sm text-on-surface-variant">{countLabel}</p>
      </div>
    </div>
  )
}
