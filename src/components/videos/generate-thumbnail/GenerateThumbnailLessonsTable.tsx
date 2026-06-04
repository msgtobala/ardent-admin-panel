import { VIDEO_LESSONS_PAGE_SIZE } from '@/lib/video-lessons'
import {
  lessonHasMuxVideo,
  lessonHasThumbnail,
} from '@/lib/video-lesson-thumbnail'
import type { VideoLesson } from '@/types/video-lesson'
import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import {
  DataTable,
  TableCell,
  TableErrorState,
  TableHeaderRow,
  TableHeadCell,
  TableRow,
} from '@/components/ui/table'
import { GenerateThumbnailLessonThumbnailCell } from './GenerateThumbnailLessonThumbnailCell'

interface GenerateThumbnailLessonsTableProps {
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
  generatingLessonId: string | null
  bulkGenerating: boolean
  onNext: () => void
  onPrevious: () => void
  onRetry: () => void
  onGenerate: (lesson: VideoLesson) => void
}

const COLUMN_WIDTHS = [undefined, undefined, 'w-[220px]', 'w-[140px]', 'w-[160px]']

function GenerateThumbnailSkeletonRows() {
  return Array.from({ length: VIDEO_LESSONS_PAGE_SIZE }).map((_, index) => (
    <TableRow key={`generate-thumbnail-skeleton-${index}`} aria-hidden>
      <TableCell>
        <div className="h-4 w-48 animate-pulse rounded bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-36 animate-pulse rounded bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="aspect-video w-full max-w-[200px] animate-pulse rounded-input bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="h-6 w-24 animate-pulse rounded-full bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="h-9 w-28 animate-pulse rounded-lg bg-surface-container" />
      </TableCell>
    </TableRow>
  ))
}

function ThumbnailStatusBadge({ lesson }: { lesson: VideoLesson }) {
  if (!lessonHasMuxVideo(lesson)) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-1 text-caption font-medium text-on-surface-variant">
        <MaterialIcon name="videocam_off" size={16} />
        No video
      </span>
    )
  }

  if (lessonHasThumbnail(lesson)) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary-fixed px-2.5 py-1 text-caption font-medium text-primary-action">
        <MaterialIcon name="check_circle" size={16} />
        Has thumbnail
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-1 text-caption font-medium text-primary-action">
      <MaterialIcon name="warning" size={16} />
      Missing
    </span>
  )
}

function GenerateThumbnailLessonRow({
  lesson,
  generatingLessonId,
  bulkGenerating,
  onGenerate,
}: {
  lesson: VideoLesson
  generatingLessonId: string | null
  bulkGenerating: boolean
  onGenerate: (lesson: VideoLesson) => void
}) {
  const lessonLabel = lesson.lessonName.trim() || lesson.id
  const hasVideo = lessonHasMuxVideo(lesson)
  const isRowGenerating = generatingLessonId === lesson.id
  const isDisabled = bulkGenerating || (generatingLessonId !== null && !isRowGenerating)

  return (
    <TableRow>
      <TableCell className="font-medium text-text-black">
        <span className="block truncate">{lesson.lessonName || '—'}</span>
      </TableCell>
      <TableCell className="text-text-black">
        <span className="block truncate">{lesson.moduleName || '—'}</span>
      </TableCell>
      <TableCell>
        <GenerateThumbnailLessonThumbnailCell
          thumbnailUrl={lesson.thumbnailImage}
          lessonLabel={lessonLabel}
        />
      </TableCell>
      <TableCell>
        <ThumbnailStatusBadge lesson={lesson} />
      </TableCell>
      <TableCell>
        <Button
          type="button"
          variant="outline"
          disabled={!hasVideo || isDisabled}
          onClick={() => onGenerate(lesson)}
          className="gap-1.5 px-3 py-2 text-body-md"
          aria-label={
            hasVideo
              ? `Generate thumbnail for ${lessonLabel}`
              : `Cannot generate thumbnail for ${lessonLabel} without a linked video`
          }
        >
          <MaterialIcon
            name={isRowGenerating ? 'hourglass_top' : 'auto_awesome'}
            size={16}
          />
          {isRowGenerating ? 'Generating...' : 'Generate'}
        </Button>
      </TableCell>
    </TableRow>
  )
}

export function GenerateThumbnailLessonsTable({
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
  generatingLessonId,
  bulkGenerating,
  onNext,
  onPrevious,
  onRetry,
  onGenerate,
}: GenerateThumbnailLessonsTableProps) {
  if (!hasSubjectSelected) {
    return (
      <div className="rounded-xl border border-border-subtle bg-surface-white px-gutter py-10 shadow-tier-1">
        <p className="text-center text-body-md text-on-surface-variant">
          Select a video subject to manage lesson thumbnails.
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
      columnCount={5}
      columnWidths={COLUMN_WIDTHS}
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
      skeletonRows={<GenerateThumbnailSkeletonRows />}
      header={
        <TableHeaderRow>
          <TableHeadCell>Lesson Name</TableHeadCell>
          <TableHeadCell>Module Name</TableHeadCell>
          <TableHeadCell>Thumbnail</TableHeadCell>
          <TableHeadCell>Status</TableHeadCell>
          <TableHeadCell>Actions</TableHeadCell>
        </TableHeaderRow>
      }
    >
      {lessons.map((lesson) => (
        <GenerateThumbnailLessonRow
          key={lesson.id}
          lesson={lesson}
          generatingLessonId={generatingLessonId}
          bulkGenerating={bulkGenerating}
          onGenerate={onGenerate}
        />
      ))}
    </DataTable>
  )
}
