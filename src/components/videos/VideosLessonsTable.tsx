import { VIDEO_LESSONS_PAGE_SIZE } from '@/lib/video-lessons'
import type { VideoLesson } from '@/types/video-lesson'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import {
  DataTable,
  TableCell,
  TableErrorState,
  TableHeaderRow,
  TableHeadCell,
  TableRow,
} from '@/components/ui/table'
import { lessonHasMuxVideo } from '@/lib/video-lesson-thumbnail'
import { MUX_ASSET_STATUS } from '@/types/video-lesson'
import { VideoLessonPlayer } from './VideoLessonPlayer'

interface VideosLessonsTableProps {
  lessons: VideoLesson[]
  currentPage: number
  totalPages: number
  isLoading: boolean
  isInitialLoading: boolean
  isPageLoading: boolean
  hasSubjectSelected: boolean
  error?: string
  errorIndexUrl?: string
  hasNext: boolean
  hasPrevious: boolean
  onNext: () => void
  onPrevious: () => void
  onRetry: () => void
  onEdit: (lesson: VideoLesson) => void
  onDelete: (lesson: VideoLesson) => void
}

const LESSON_COLUMN_WIDTHS = [undefined, undefined, 'w-[300px]', 'w-[120px]']

const actionButtonClassName =
  'cursor-pointer rounded-lg p-2 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring'

function VideosLessonsSkeletonRows() {
  return Array.from({ length: VIDEO_LESSONS_PAGE_SIZE }).map((_, index) => (
    <TableRow key={`video-lesson-skeleton-${index}`} aria-hidden>
      <TableCell>
        <div className="h-4 w-56 animate-pulse rounded bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-40 animate-pulse rounded bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="aspect-video w-full max-w-[280px] animate-pulse rounded-input bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="mx-auto h-8 w-16 animate-pulse rounded-lg bg-surface-container" />
      </TableCell>
    </TableRow>
  ))
}

function VideoLessonRow({
  lesson,
  onEdit,
  onDelete,
}: {
  lesson: VideoLesson
  onEdit: (lesson: VideoLesson) => void
  onDelete: (lesson: VideoLesson) => void
}) {
  const lessonLabel = lesson.lessonName.trim() || lesson.id
  const canPlayVideo = lessonHasMuxVideo(lesson)
  const isProcessing = lesson.muxAssetStatus === MUX_ASSET_STATUS.processing

  return (
    <TableRow>
      <TableCell className="font-medium text-text-black">
        <span className="block truncate">{lesson.lessonName || '—'}</span>
      </TableCell>
      <TableCell className="text-text-black">
        <span className="block truncate">{lesson.moduleName || '—'}</span>
      </TableCell>
      <TableCell>
        {isProcessing ? (
          <p className="max-w-[280px] text-label-sm text-on-surface-variant">
            Video processing…
          </p>
        ) : (
          <VideoLessonPlayer
            subjectId={lesson.subjectId}
            lessonId={lesson.id}
            lessonLabel={lessonLabel}
            isLessonActive={lesson.isActive}
            autoLoad={canPlayVideo}
            compact
          />
        )}
      </TableCell>
      <TableCell className="px-3">
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            aria-label={`Edit lesson ${lessonLabel}`}
            onClick={() => onEdit(lesson)}
            className={actionButtonClassName}
          >
            <MaterialIcon name="edit" size={16} className="text-on-surface-variant" />
          </button>
          <button
            type="button"
            aria-label={`Delete lesson ${lessonLabel}`}
            onClick={() => onDelete(lesson)}
            className={actionButtonClassName}
          >
            <MaterialIcon name="delete" size={16} className="text-primary-action" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function VideosLessonsTable({
  lessons,
  currentPage,
  totalPages,
  isLoading,
  isInitialLoading,
  isPageLoading,
  hasSubjectSelected,
  error,
  errorIndexUrl,
  hasNext,
  hasPrevious,
  onNext,
  onPrevious,
  onRetry,
  onEdit,
  onDelete,
}: VideosLessonsTableProps) {
  if (!hasSubjectSelected) {
    return (
      <div className="rounded-xl border border-border-subtle bg-surface-white px-gutter py-10 shadow-tier-1">
        <p className="text-center text-body-md text-on-surface-variant">
          Select a video subject to view its lessons.
        </p>
      </div>
    )
  }

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
      columnCount={4}
      columnWidths={LESSON_COLUMN_WIDTHS}
      rowCount={lessons.length}
      pageSize={VIDEO_LESSONS_PAGE_SIZE}
      isInitialLoading={isInitialLoading}
      isPageLoading={isPageLoading}
      isLoading={isLoading}
      currentPage={currentPage}
      totalPages={totalPages}
      hasNext={hasNext}
      hasPrevious={hasPrevious}
      onNext={onNext}
      onPrevious={onPrevious}
      emptyMessage="No video lessons found for this subject."
      skeletonRows={<VideosLessonsSkeletonRows />}
      header={
        <TableHeaderRow>
          <TableHeadCell>Lesson Name</TableHeadCell>
          <TableHeadCell>Module Name</TableHeadCell>
          <TableHeadCell>Video</TableHeadCell>
          <TableHeadCell align="center" className="px-3">
            Actions
          </TableHeadCell>
        </TableHeaderRow>
      }
    >
      {lessons.map((lesson) => (
        <VideoLessonRow
          key={lesson.id}
          lesson={lesson}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </DataTable>
  )
}
