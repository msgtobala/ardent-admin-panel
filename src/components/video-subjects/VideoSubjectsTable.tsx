import { VIDEO_SUBJECTS_PAGE_SIZE } from '@/lib/video-subjects'
import type { VideoSubject } from '@/types/video-subject'
import { ActiveToggle } from '@/components/banners/ActiveToggle'
import { StatusBadge } from '@/components/banners/StatusBadge'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import {
  DataTable,
  TableCell,
  TableErrorState,
  TableHeaderRow,
  TableHeadCell,
  TableRow,
} from '@/components/ui/table'
import { VideoSubjectIcon } from './VideoSubjectIcon'

interface VideoSubjectsTableProps {
  subjects: VideoSubject[]
  currentPage: number
  totalPages: number
  isLoading: boolean
  isInitialLoading: boolean
  isPageLoading: boolean
  error?: string
  errorIndexUrl?: string
  hasNext: boolean
  hasPrevious: boolean
  onNext: () => void
  onPrevious: () => void
  onRetry: () => void
  onToggleIsActive: (id: string, isActive: boolean) => void
  onEdit: (subject: VideoSubject) => void
}

const COLUMN_WIDTHS = ['w-[76px]', undefined, 'w-[120px]', 'w-[140px]', 'w-[148px]']

const actionButtonClassName =
  'cursor-pointer rounded-lg p-2 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring'

function VideoSubjectsSkeletonRows() {
  return Array.from({ length: VIDEO_SUBJECTS_PAGE_SIZE }).map((_, index) => (
    <TableRow key={`video-subject-skeleton-${index}`} aria-hidden>
      <TableCell>
        <div className="size-10 animate-pulse rounded-lg bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-48 animate-pulse rounded bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="h-6 w-16 animate-pulse rounded-full bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-12 animate-pulse rounded bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="mx-auto h-8 w-16 animate-pulse rounded-lg bg-surface-container" />
      </TableCell>
    </TableRow>
  ))
}

function VideoSubjectRow({
  subject,
  onEdit,
  onToggleIsActive,
}: {
  subject: VideoSubject
  onEdit: (subject: VideoSubject) => void
  onToggleIsActive: (id: string, isActive: boolean) => void
}) {
  return (
    <TableRow>
      <TableCell>
        <VideoSubjectIcon
          iconUrl={subject.icon}
          subjectName={subject.subjectName}
        />
      </TableCell>
      <TableCell className="font-medium text-text-black">
        <span className="block truncate">{subject.subjectName || '—'}</span>
      </TableCell>
      <TableCell>
        <StatusBadge isActive={subject.isActive} />
      </TableCell>
      <TableCell className="text-body-md text-text-black">
        {subject.totalLessons}
      </TableCell>
      <TableCell className="px-3">
        <div className="flex items-center justify-center gap-1.5">
          <ActiveToggle
            isActive={subject.isActive}
            ariaLabel={`Toggle status for ${subject.subjectName || subject.id}`}
            onChange={(isActive) => onToggleIsActive(subject.id, isActive)}
          />
          <button
            type="button"
            aria-label={`Edit video subject ${subject.subjectName || subject.id}`}
            onClick={() => onEdit(subject)}
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

export function VideoSubjectsTable({
  subjects,
  currentPage,
  totalPages,
  isLoading,
  isInitialLoading,
  isPageLoading,
  error,
  errorIndexUrl,
  hasNext,
  hasPrevious,
  onNext,
  onPrevious,
  onRetry,
  onToggleIsActive,
  onEdit,
}: VideoSubjectsTableProps) {
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
      columnWidths={COLUMN_WIDTHS}
      rowCount={subjects.length}
      pageSize={VIDEO_SUBJECTS_PAGE_SIZE}
      isInitialLoading={isInitialLoading}
      isPageLoading={isPageLoading}
      isLoading={isLoading}
      currentPage={currentPage}
      totalPages={totalPages}
      hasNext={hasNext}
      hasPrevious={hasPrevious}
      onNext={onNext}
      onPrevious={onPrevious}
      emptyMessage="No video subjects found."
      skeletonRows={<VideoSubjectsSkeletonRows />}
      header={
        <TableHeaderRow>
          <TableHeadCell>Icon</TableHeadCell>
          <TableHeadCell>Subject Name</TableHeadCell>
          <TableHeadCell>Status</TableHeadCell>
          <TableHeadCell>Total Lessons</TableHeadCell>
          <TableHeadCell align="center" className="px-3">
            Actions
          </TableHeadCell>
        </TableHeaderRow>
      }
    >
      {subjects.map((subject) => (
        <VideoSubjectRow
          key={subject.id}
          subject={subject}
          onEdit={onEdit}
          onToggleIsActive={onToggleIsActive}
        />
      ))}
    </DataTable>
  )
}
