import { SUGGESTED_VIDEOS_SLOT_COUNT } from '@/types/suggested-video'
import { formatBannerDate } from '@/lib/format-date'
import type { ResolvedSuggestedVideo } from '@/types/suggested-video'
import {
  Table,
  TableBody,
  TableCell,
  TableElement,
  TableErrorState,
  TableHeadCell,
  TableHeader,
  TableHeaderRow,
  TableRow,
  TableScrollArea,
} from '@/components/ui/table'
import { TableLoadingOverlay } from '@/components/ui/table/TableLoadingOverlay'
import { CopyIdText } from '@/components/ui/CopyIdText'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { BannerImagePreview } from '@/components/banners/BannerImagePreview'

interface SuggestedVideosTableProps {
  videos: ResolvedSuggestedVideo[]
  isLoading: boolean
  isGenerating: boolean
  error?: string
  onRetry: () => void
  onView: (video: ResolvedSuggestedVideo) => void
}

const COLUMN_WIDTHS = [
  'w-[88px]',
  'w-[120px]',
  undefined,
  undefined,
  'w-[140px]',
  'w-[140px]',
  'w-[100px]',
]

const actionButtonClassName =
  'cursor-pointer rounded-lg p-2 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring'

function SuggestedVideosSkeletonRows() {
  return Array.from({ length: SUGGESTED_VIDEOS_SLOT_COUNT }).map((_, index) => (
    <TableRow key={`skeleton-${index}`} aria-hidden>
      <TableCell>
        <div className="h-4 w-10 animate-pulse rounded bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="h-14 w-24 animate-pulse rounded-input bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-32 animate-pulse rounded bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-48 animate-pulse rounded bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-16 animate-pulse rounded bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-24 animate-pulse rounded bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="mx-auto h-8 w-10 animate-pulse rounded-lg bg-surface-container" />
      </TableCell>
    </TableRow>
  ))
}

function SuggestedVideoRow({
  video,
  onView,
}: {
  video: ResolvedSuggestedVideo
  onView: (video: ResolvedSuggestedVideo) => void
}) {
  const lessonLabel = video.lessonName.trim() || video.lessonRefId

  return (
    <TableRow>
      <TableCell>
        <span className="text-body-md text-on-surface">{video.sortOrder + 1}</span>
      </TableCell>
      <TableCell>
        {video.thumbnailImage ? (
          <BannerImagePreview
            imageUrl={video.thumbnailImage}
            altText={video.lessonName}
          />
        ) : (
          <span className="text-body-md text-on-surface-variant">—</span>
        )}
      </TableCell>
      <TableCell>
        <CopyIdText
          label={video.subjectName}
          copyValue={video.subjectRefId}
          successMessage="Subject ID copied"
        />
      </TableCell>
      <TableCell>
        <CopyIdText
          label={video.lessonName}
          copyValue={video.lessonRefId}
          successMessage="Lesson ID copied"
        />
      </TableCell>
      <TableCell>
        <span className="text-body-md text-on-surface">
          {video.noOfStudentsWatched.toLocaleString()}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-body-md text-on-surface">
          {video.updatedAt ? formatBannerDate(video.updatedAt) : '—'}
        </span>
      </TableCell>
      <TableCell className="px-3">
        <div className="flex items-center justify-center">
          <button
            type="button"
            aria-label={`View video for ${lessonLabel}`}
            title="View video"
            onClick={() => onView(video)}
            className={actionButtonClassName}
          >
            <MaterialIcon name="play_circle" size={20} className="text-on-surface-variant" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function SuggestedVideosTable({
  videos,
  isLoading,
  isGenerating,
  error,
  onRetry,
  onView,
}: SuggestedVideosTableProps) {
  if (error && !isLoading && videos.length === 0) {
    return <TableErrorState message={error} onRetry={onRetry} />
  }

  const showSkeleton = isLoading && videos.length === 0
  const showEmptyState = !isLoading && !isGenerating && videos.length === 0

  return (
    <Table>
      <TableScrollArea
        isPageLoading={isGenerating}
        loadingOverlay={<TableLoadingOverlay />}
      >
        <TableElement columnWidths={COLUMN_WIDTHS}>
          <TableHeader>
            <TableHeaderRow>
              <TableHeadCell>Slot</TableHeadCell>
              <TableHeadCell>Thumbnail</TableHeadCell>
              <TableHeadCell>Subject</TableHeadCell>
              <TableHeadCell>Lesson</TableHeadCell>
              <TableHeadCell>Students watched</TableHeadCell>
              <TableHeadCell>Last updated</TableHeadCell>
              <TableHeadCell align="center" className="px-3">
                Actions
              </TableHeadCell>
            </TableHeaderRow>
          </TableHeader>
          <TableBody isPageLoading={isGenerating}>
            {showSkeleton ? <SuggestedVideosSkeletonRows /> : null}

            {!showSkeleton && videos.length > 0
              ? videos.map((video) => (
                  <SuggestedVideoRow key={video.id} video={video} onView={onView} />
                ))
              : null}

            {showEmptyState ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <p className="py-6 text-center text-body-md text-on-surface-variant">
                    No suggested videos yet. Use Generate Suggested Videos to pick three
                    active lessons for the student dashboard.
                  </p>
                </TableCell>
              </TableRow>
            ) : null}

            {error && videos.length > 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <p className="pt-2 text-body-md text-error-red" role="alert">
                    {error}
                  </p>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </TableElement>
      </TableScrollArea>
    </Table>
  )
}
