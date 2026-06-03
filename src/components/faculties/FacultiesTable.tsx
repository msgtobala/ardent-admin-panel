import { FACULTIES_PAGE_SIZE } from '@/lib/faculties'
import type { Faculty, FacultySortField, SortDirection } from '@/types/faculty'
import { CopyIdButton } from '@/components/ui/CopyIdButton'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import {
  DataTable,
  SortableTableHeader,
  TableCell,
  TableErrorState,
  TableHeaderRow,
  TableHeadCell,
  TableRow,
} from '@/components/ui/table'

interface FacultiesTableProps {
  faculties: Faculty[]
  currentPage: number
  totalPages: number
  isLoading: boolean
  isInitialLoading: boolean
  isPageLoading: boolean
  error?: string
  hasNext: boolean
  hasPrevious: boolean
  sortField: FacultySortField
  sortDirection: SortDirection
  onSort: (field: FacultySortField) => void
  onNext: () => void
  onPrevious: () => void
  onRetry: () => void
  onEdit: (faculty: Faculty) => void
  onDelete: (faculty: Faculty) => void
}

const FACULTY_COLUMN_WIDTHS = [
  undefined,
  'w-[220px]',
  undefined,
  'w-[180px]',
]

const actionButtonClassName =
  'cursor-pointer rounded-lg p-2 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring'

function getFacultyDisplayName(faculty: Faculty): string {
  if (faculty.displayName.trim()) return faculty.displayName
  return [faculty.firstName, faculty.lastName].filter(Boolean).join(' ') || '—'
}

function FacultiesTableSkeletonRows() {
  return Array.from({ length: FACULTIES_PAGE_SIZE }).map((_, index) => (
    <TableRow key={`skeleton-${index}`} aria-hidden>
      <TableCell>
        <div className="h-4 w-36 animate-pulse rounded bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-40 animate-pulse rounded bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-full max-w-[320px] animate-pulse rounded bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="mx-auto h-8 w-16 animate-pulse rounded-lg bg-surface-container" />
      </TableCell>
    </TableRow>
  ))
}

function FacultyRow({
  faculty,
  onEdit,
  onDelete,
}: {
  faculty: Faculty
  onEdit: (faculty: Faculty) => void
  onDelete: (faculty: Faculty) => void
}) {
  return (
    <TableRow>
      <TableCell className="font-medium text-text-black">
        {getFacultyDisplayName(faculty)}
      </TableCell>
      <TableCell>
        {faculty.email ? (
          <a
            href={`mailto:${faculty.email}`}
            className="block truncate text-body-md text-primary transition hover:text-primary-action hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            {faculty.email}
          </a>
        ) : (
          <span className="text-body-md text-text-black">—</span>
        )}
      </TableCell>
      <TableCell
        className="max-w-0 text-body-md text-text-black"
        title={faculty.bio || undefined}
      >
        <span className="block truncate">{faculty.bio || '—'}</span>
      </TableCell>
      <TableCell className="px-3">
        <div className="flex items-center justify-center gap-1.5">
          <CopyIdButton
            value={faculty.facultyId}
            ariaLabel={`Copy faculty id ${faculty.facultyId}`}
          />
          <button
            type="button"
            aria-label={`Edit faculty ${faculty.id}`}
            onClick={() => onEdit(faculty)}
            className={actionButtonClassName}
          >
            <MaterialIcon
              name="edit"
              size={16}
              className="text-on-surface-variant"
            />
          </button>
          <button
            type="button"
            aria-label={`Delete faculty ${faculty.id}`}
            onClick={() => onDelete(faculty)}
            className={actionButtonClassName}
          >
            <MaterialIcon
              name="delete"
              size={16}
              className="text-primary-action"
            />
          </button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function FacultiesTable({
  faculties,
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
  onSort,
  onNext,
  onPrevious,
  onRetry,
  onEdit,
  onDelete,
}: FacultiesTableProps) {
  if (error) {
    return <TableErrorState message={error} onRetry={onRetry} />
  }

  return (
    <DataTable
      columnCount={4}
      columnWidths={FACULTY_COLUMN_WIDTHS}
      rowCount={faculties.length}
      pageSize={FACULTIES_PAGE_SIZE}
      isInitialLoading={isInitialLoading}
      isPageLoading={isPageLoading}
      isLoading={isLoading}
      currentPage={currentPage}
      totalPages={totalPages}
      hasNext={hasNext}
      hasPrevious={hasPrevious}
      onNext={onNext}
      onPrevious={onPrevious}
      emptyMessage="No faculty profiles found. Create your first faculty with the New Faculty button."
      skeletonRows={<FacultiesTableSkeletonRows />}
      header={
        <TableHeaderRow>
          <SortableTableHeader
            label="Name"
            field="displayName"
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
          />
          <SortableTableHeader
            label="Email"
            field="email"
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
          />
          <TableHeadCell>Bio</TableHeadCell>
          <TableHeadCell align="center" className="px-3">
            Actions
          </TableHeadCell>
        </TableHeaderRow>
      }
    >
      {faculties.map((faculty) => (
        <FacultyRow
          key={faculty.id}
          faculty={faculty}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </DataTable>
  )
}
