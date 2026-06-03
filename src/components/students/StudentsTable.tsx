import { STUDENTS_PAGE_SIZE } from '@/lib/students'
import {
  getAuthenticationMethodDisplay,
  getStudentDisplayName,
} from '@/lib/student-utils'
import type { Student, StudentSortField, SortDirection } from '@/types/student'
import { StudentContactCell } from './StudentContactCell'
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

interface StudentsTableProps {
  students: Student[]
  currentPage: number
  totalPages: number
  isLoading: boolean
  isInitialLoading: boolean
  isPageLoading: boolean
  error?: string
  errorIndexUrl?: string
  hasNext: boolean
  hasPrevious: boolean
  sortField: StudentSortField
  sortDirection: SortDirection
  isSortDisabled?: boolean
  onSort: (field: StudentSortField) => void
  onNext: () => void
  onPrevious: () => void
  onRetry: () => void
  onEdit: (student: Student) => void
}

const STUDENT_COLUMN_WIDTHS = [undefined, 'w-[220px]', 'w-[140px]', undefined, 'w-[148px]']

const actionButtonClassName =
  'cursor-pointer rounded-lg p-2 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring'

function StudentsTableSkeletonRows() {
  return Array.from({ length: STUDENTS_PAGE_SIZE }).map((_, index) => (
    <TableRow key={`skeleton-${index}`} aria-hidden>
      <TableCell>
        <div className="h-4 w-36 animate-pulse rounded bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-40 animate-pulse rounded bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-24 animate-pulse rounded bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-28 animate-pulse rounded bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="mx-auto h-8 w-16 animate-pulse rounded-lg bg-surface-container" />
      </TableCell>
    </TableRow>
  ))
}

function StudentRow({
  student,
  onEdit,
}: {
  student: Student
  onEdit: (student: Student) => void
}) {
  const displayName = getStudentDisplayName(student)
  const authMethod = getAuthenticationMethodDisplay(student.authenticationMethod)

  return (
    <TableRow>
      <TableCell className="font-medium text-text-black">{displayName}</TableCell>
      <TableCell>
        <StudentContactCell student={student} />
      </TableCell>
      <TableCell className="text-body-md text-text-black">
        <div className="flex items-center gap-2">
          <MaterialIcon
            name={authMethod.icon}
            size={18}
            className="shrink-0 text-on-surface-variant"
          />
          <span className="truncate">{authMethod.label}</span>
        </div>
      </TableCell>
      <TableCell className="text-body-md text-text-black">
        <span className="block truncate">{student.planName || '—'}</span>
      </TableCell>
      <TableCell className="px-3">
        <div className="flex items-center justify-center gap-1.5">
          <CopyIdButton
            value={student.uid}
            ariaLabel={`Copy student uid ${student.uid}`}
            successMessage="UID copied to clipboard"
          />
          <button
            type="button"
            aria-label={`Edit student ${displayName}`}
            onClick={() => onEdit(student)}
            className={actionButtonClassName}
          >
            <MaterialIcon
              name="edit"
              size={16}
              className="text-on-surface-variant"
            />
          </button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function StudentsTable({
  students,
  currentPage,
  totalPages,
  isLoading,
  isInitialLoading,
  isPageLoading,
  error,
  errorIndexUrl,
  hasNext,
  hasPrevious,
  sortField,
  sortDirection,
  isSortDisabled = false,
  onSort,
  onNext,
  onPrevious,
  onRetry,
  onEdit,
}: StudentsTableProps) {
  if (error) {
    return (
      <TableErrorState
        message={error}
        indexUrl={errorIndexUrl}
        onRetry={onRetry}
      />
    )
  }

  return (
    <DataTable
      columnCount={5}
      columnWidths={STUDENT_COLUMN_WIDTHS}
      rowCount={students.length}
      pageSize={STUDENTS_PAGE_SIZE}
      isInitialLoading={isInitialLoading}
      isPageLoading={isPageLoading}
      isLoading={isLoading}
      currentPage={currentPage}
      totalPages={totalPages}
      hasNext={hasNext}
      hasPrevious={hasPrevious}
      onNext={onNext}
      onPrevious={onPrevious}
      emptyMessage="No students found. Try adjusting your search."
      skeletonRows={<StudentsTableSkeletonRows />}
      header={
        <TableHeaderRow>
          <SortableTableHeader
            label="Name"
            field="name"
            sortField={sortField}
            sortDirection={sortDirection}
            disabled={isSortDisabled}
            onSort={onSort}
          />
          <TableHeadCell>Email / Phone</TableHeadCell>
          <TableHeadCell>Authentication</TableHeadCell>
          <SortableTableHeader
            label="Plan"
            field="planName"
            sortField={sortField}
            sortDirection={sortDirection}
            disabled={isSortDisabled}
            onSort={onSort}
          />
          <TableHeadCell align="center" className="px-3">
            Actions
          </TableHeadCell>
        </TableHeaderRow>
      }
    >
      {students.map((student) => (
        <StudentRow
          key={student.id}
          student={student}
          onEdit={onEdit}
        />
      ))}
    </DataTable>
  )
}
