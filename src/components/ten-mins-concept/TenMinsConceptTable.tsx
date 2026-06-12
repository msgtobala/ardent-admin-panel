import { formatBannerDate } from '@/lib/format-date'
import type { ResolvedTenMinsConcept } from '@/types/ten-mins-concept'
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

interface TenMinsConceptTableProps {
  concept: ResolvedTenMinsConcept | null
  isLoading: boolean
  isSuggesting: boolean
  error?: string
  onRetry: () => void
  onView: (concept: ResolvedTenMinsConcept) => void
}

const COLUMN_WIDTHS = ['w-[120px]', undefined, undefined, 'w-[140px]', 'w-[100px]']

const actionButtonClassName =
  'cursor-pointer rounded-lg p-2 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring'

function TenMinsConceptSkeletonRow() {
  return (
    <TableRow aria-hidden>
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
        <div className="h-4 w-24 animate-pulse rounded bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="mx-auto h-8 w-10 animate-pulse rounded-lg bg-surface-container" />
      </TableCell>
    </TableRow>
  )
}

function TenMinsConceptRow({
  concept,
  onView,
}: {
  concept: ResolvedTenMinsConcept
  onView: (concept: ResolvedTenMinsConcept) => void
}) {
  const lessonLabel = concept.lessonName.trim() || concept.lessonRefId

  return (
    <TableRow>
      <TableCell>
        {concept.thumbnailImage ? (
          <BannerImagePreview
            imageUrl={concept.thumbnailImage}
            altText={concept.lessonName}
          />
        ) : (
          <span className="text-body-md text-on-surface-variant">—</span>
        )}
      </TableCell>
      <TableCell>
        <CopyIdText
          label={concept.subjectName}
          copyValue={concept.subjectRefId}
          successMessage="Subject ID copied"
        />
      </TableCell>
      <TableCell>
        <CopyIdText
          label={concept.lessonName}
          copyValue={concept.lessonRefId}
          successMessage="Lesson ID copied"
        />
      </TableCell>
      <TableCell>
        <span className="text-body-md text-on-surface">
          {concept.updatedAt ? formatBannerDate(concept.updatedAt) : '—'}
        </span>
      </TableCell>
      <TableCell className="px-3">
        <div className="flex items-center justify-center">
          <button
            type="button"
            aria-label={`View video for ${lessonLabel}`}
            title="View video"
            onClick={() => onView(concept)}
            className={actionButtonClassName}
          >
            <MaterialIcon name="play_circle" size={20} className="text-on-surface-variant" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function TenMinsConceptTable({
  concept,
  isLoading,
  isSuggesting,
  error,
  onRetry,
  onView,
}: TenMinsConceptTableProps) {
  if (error && !isLoading && !concept) {
    return <TableErrorState message={error} onRetry={onRetry} />
  }

  const showSkeleton = isLoading && !concept
  const showEmptyState = !isLoading && !isSuggesting && !concept

  return (
    <Table>
      <TableScrollArea
        isPageLoading={isSuggesting}
        loadingOverlay={<TableLoadingOverlay />}
      >
        <TableElement columnWidths={COLUMN_WIDTHS}>
          <TableHeader>
            <TableHeaderRow>
              <TableHeadCell>Thumbnail</TableHeadCell>
              <TableHeadCell>Subject</TableHeadCell>
              <TableHeadCell>Lesson</TableHeadCell>
              <TableHeadCell>Last updated</TableHeadCell>
              <TableHeadCell align="center" className="px-3">
                Actions
              </TableHeadCell>
            </TableHeaderRow>
          </TableHeader>
          <TableBody isPageLoading={isSuggesting}>
            {showSkeleton ? <TenMinsConceptSkeletonRow /> : null}

            {!showSkeleton && concept ? (
              <TenMinsConceptRow concept={concept} onView={onView} />
            ) : null}

            {showEmptyState ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <p className="py-6 text-center text-body-md text-on-surface-variant">
                    No 10 mins concept yet. Use Suggest 10 Mins Concept to pick an
                    active lesson for the student dashboard.
                  </p>
                </TableCell>
              </TableRow>
            ) : null}

            {error && concept ? (
              <TableRow>
                <TableCell colSpan={5}>
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
