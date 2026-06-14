import {
  formatUserQueryContextSummary,
  formatUserQueryType,
} from '@/lib/user-query-display'
import { formatBannerDate } from '@/lib/format-date'
import { USER_QUERIES_PAGE_SIZE } from '@/lib/user-queries'
import type { SortDirection, UserQuery, UserQuerySortField } from '@/types/user-query'
import {
  DataTable,
  SortableTableHeader,
  TableCell,
  TableErrorState,
  TableHeadCell,
  TableHeaderRow,
  TableRow,
} from '@/components/ui/table'
import { CopyIdButton } from '@/components/ui/CopyIdButton'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { UserQueryStatusBadge } from '@/components/user-queries/UserQueryStatusBadge'

interface UserQueriesTableProps {
  queries: UserQuery[]
  currentPage: number
  totalPages: number
  isLoading: boolean
  isInitialLoading: boolean
  isPageLoading: boolean
  error?: string
  hasNext: boolean
  hasPrevious: boolean
  sortField: UserQuerySortField
  sortDirection: SortDirection
  updatingStatusId: string | null
  onSort: (field: UserQuerySortField) => void
  onNext: () => void
  onPrevious: () => void
  onRetry: () => void
  onView: (query: UserQuery) => void
  onResolve: (id: string) => Promise<void>
  onReject: (id: string) => Promise<void>
  onReopen: (id: string) => Promise<void>
}

const actionButtonClassName =
  'inline-flex size-8 cursor-pointer items-center justify-center rounded-full transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring'

const USER_QUERY_COLUMN_WIDTHS = [
  'w-[140px]',
  'w-[120px]',
  undefined,
  'w-[140px]',
  'w-[120px]',
  'w-[140px]',
  'w-[180px]',
]

function UserQueriesTableSkeletonRows() {
  return Array.from({ length: USER_QUERIES_PAGE_SIZE }).map((_, index) => (
    <TableRow key={`skeleton-${index}`} aria-hidden>
      <TableCell>
        <div className="h-4 w-24 animate-pulse rounded bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-20 animate-pulse rounded bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-full max-w-[240px] animate-pulse rounded bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-24 animate-pulse rounded bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="h-6 w-16 animate-pulse rounded-full bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-28 animate-pulse rounded bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="mx-auto size-8 animate-pulse rounded-full bg-surface-container" />
      </TableCell>
    </TableRow>
  ))
}

function UserQueryRow({
  query,
  isUpdatingStatus,
  onView,
  onResolve,
  onReject,
  onReopen,
}: {
  query: UserQuery
  isUpdatingStatus: boolean
  onView: (query: UserQuery) => void
  onResolve: (id: string) => Promise<void>
  onReject: (id: string) => Promise<void>
  onReopen: (id: string) => Promise<void>
}) {
  const isOpened = query.status === 'opened'
  const isResolved = query.status === 'resolved'

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-1">
          <span
            className="max-w-[96px] truncate text-body-md text-text-black"
            title={query.id}
          >
            {query.id}
          </span>
          <CopyIdButton value={query.id} ariaLabel={`Copy ticket id ${query.id}`} />
        </div>
      </TableCell>
      <TableCell className="whitespace-nowrap text-body-md text-text-black">
        {formatUserQueryType(query.type)}
      </TableCell>
      <TableCell>
        <span
          className="block truncate text-body-md text-text-black"
          title={formatUserQueryContextSummary(query)}
        >
          {formatUserQueryContextSummary(query)}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <span
            className="max-w-[96px] truncate text-body-md text-text-black"
            title={query.userId}
          >
            {query.userId || '—'}
          </span>
          {query.userId ? (
            <CopyIdButton
              value={query.userId}
              ariaLabel={`Copy user id ${query.userId}`}
            />
          ) : null}
        </div>
      </TableCell>
      <TableCell>
        <UserQueryStatusBadge status={query.status} />
      </TableCell>
      <TableCell className="whitespace-nowrap text-body-md text-text-black">
        {formatBannerDate(query.createdAt)}
      </TableCell>
      <TableCell className="px-3">
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            aria-label={`View ticket ${query.id}`}
            onClick={() => onView(query)}
            className={actionButtonClassName}
          >
            <MaterialIcon
              name="visibility"
              size={16}
              className="text-on-surface-variant"
            />
          </button>
          {isResolved ? (
            <button
              type="button"
              aria-label={`Reopen ticket ${query.id}`}
              onClick={() => onReopen(query.id)}
              disabled={isUpdatingStatus}
              className={`${actionButtonClassName} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <MaterialIcon
                name="undo"
                size={16}
                className="text-on-surface-variant"
              />
            </button>
          ) : null}
          {isOpened ? (
            <>
              <button
                type="button"
                aria-label={`Resolve ticket ${query.id}`}
                onClick={() => onResolve(query.id)}
                disabled={isUpdatingStatus}
                className={`${actionButtonClassName} disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <MaterialIcon
                  name="check_circle"
                  size={16}
                  className="text-success-green"
                />
              </button>
              <button
                type="button"
                aria-label={`Reject ticket ${query.id}`}
                onClick={() => onReject(query.id)}
                disabled={isUpdatingStatus}
                className={`${actionButtonClassName} disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <MaterialIcon
                  name="block"
                  size={16}
                  className="text-[#D20C0C]"
                />
              </button>
            </>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  )
}

export function UserQueriesTable({
  queries,
  currentPage,
  totalPages,
  isLoading,
  isInitialLoading,
  isPageLoading,
  error,
  hasNext,
  hasPrevious,
  sortField,
  sortDirection,
  updatingStatusId,
  onSort,
  onNext,
  onPrevious,
  onRetry,
  onView,
  onResolve,
  onReject,
  onReopen,
}: UserQueriesTableProps) {
  if (error) {
    return <TableErrorState message={error} onRetry={onRetry} />
  }

  return (
    <DataTable
      columnCount={7}
      columnWidths={USER_QUERY_COLUMN_WIDTHS}
      rowCount={queries.length}
      pageSize={USER_QUERIES_PAGE_SIZE}
      isInitialLoading={isInitialLoading}
      isPageLoading={isPageLoading}
      isLoading={isLoading}
      currentPage={currentPage}
      totalPages={totalPages}
      hasNext={hasNext}
      hasPrevious={hasPrevious}
      onNext={onNext}
      onPrevious={onPrevious}
      emptyMessage="No user queries yet. Tickets submitted from the app will appear here."
      skeletonRows={<UserQueriesTableSkeletonRows />}
      header={
        <TableHeaderRow>
          <TableHeadCell>Ticket ID</TableHeadCell>
          <SortableTableHeader
            label="Type"
            field="type"
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
          />
          <TableHeadCell>Subject / context</TableHeadCell>
          <TableHeadCell>User ID</TableHeadCell>
          <SortableTableHeader
            label="Status"
            field="status"
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
          />
          <SortableTableHeader
            label="Raised on"
            field="createdAt"
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
          />
          <TableHeadCell align="center" className="px-3">
            Actions
          </TableHeadCell>
        </TableHeaderRow>
      }
    >
      {queries.map((query) => (
        <UserQueryRow
          key={query.id}
          query={query}
          isUpdatingStatus={updatingStatusId === query.id}
          onView={onView}
          onResolve={onResolve}
          onReject={onReject}
          onReopen={onReopen}
        />
      ))}
    </DataTable>
  )
}
