import type { QbankChapter, QbankChapterSortField, SortDirection } from '@/types/qbank-chapter'

import { QBANK_CHAPTERS_PAGE_SIZE } from '@/lib/qbank-chapters'
import { StatusBadge } from '@/components/banners/StatusBadge'
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

const COLUMN_COUNT = 6

interface QbankChaptersTableProps {
  chapters: QbankChapter[]
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
  sortField: QbankChapterSortField
  sortDirection: SortDirection
  onSort: (field: QbankChapterSortField) => void
  onNext: () => void
  onPrevious: () => void
  onRetry: () => void
  onView: (chapter: QbankChapter) => void
  onEdit: (chapter: QbankChapter) => void
}

const COLUMN_WIDTHS = [
  'w-[100px]',
  undefined,
  'w-[160px]',
  'w-[120px]',
  'w-[140px]',
  'w-[120px]',
]

const actionButtonClassName =
  'cursor-pointer rounded-lg p-2 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring'

function QbankChaptersSkeletonRows() {
  return Array.from({ length: QBANK_CHAPTERS_PAGE_SIZE }).map((_, index) => (
    <TableRow key={`qbank-chapter-skeleton-${index}`} aria-hidden>
      {Array.from({ length: COLUMN_COUNT }).map((__, cellIndex) => (
        <TableCell key={`qbank-chapter-skeleton-${index}-${cellIndex}`}>
          <div className="h-4 w-full max-w-[120px] animate-pulse rounded bg-surface-container" />
        </TableCell>
      ))}
    </TableRow>
  ))
}

function QbankChapterRow({
  chapter,
  onView,
  onEdit,
}: {
  chapter: QbankChapter
  onView: (chapter: QbankChapter) => void
  onEdit: (chapter: QbankChapter) => void
}) {
  const chapterLabel = chapter.chapterName.trim() || chapter.id

  return (
    <TableRow>
      <TableCell className="text-center text-body-md text-text-black">
        {chapter.sortOrder ?? '—'}
      </TableCell>
      <TableCell className="font-medium text-text-black">
        <span className="block truncate">{chapter.chapterName || '—'}</span>
      </TableCell>
      <TableCell className="text-body-md text-text-black">
        <span className="block truncate">{chapter.moduleName || '—'}</span>
      </TableCell>
      <TableCell className="text-center text-body-md text-text-black">
        {chapter.questionsCount}
      </TableCell>
      <TableCell className="text-center">
        <StatusBadge isActive={chapter.isActive} />
      </TableCell>
      <TableCell className="px-3">
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            aria-label={`View chapter ${chapterLabel}`}
            title="View chapter"
            onClick={() => onView(chapter)}
            className={actionButtonClassName}
          >
            <MaterialIcon name="visibility" size={16} className="text-on-surface-variant" />
          </button>
          <button
            type="button"
            aria-label={`Edit chapter ${chapterLabel}`}
            title="Edit chapter"
            onClick={() => onEdit(chapter)}
            className={actionButtonClassName}
          >
            <MaterialIcon name="edit" size={16} className="text-on-surface-variant" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function QbankChaptersTable({
  chapters,
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
  sortField,
  sortDirection,
  onSort,
  onNext,
  onPrevious,
  onRetry,
  onView,
  onEdit,
}: QbankChaptersTableProps) {
  if (!hasSubjectSelected) {
    return (
      <section className="rounded-xl border border-border-subtle bg-surface-white px-gutter py-10 shadow-tier-1">
        <p className="text-center text-body-md text-on-surface-variant">
          Select a qbank subject to view chapters.
        </p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="rounded-xl border border-border-subtle bg-surface-white px-gutter py-gutter shadow-tier-1">
        <TableErrorState message={error} indexUrl={errorIndexUrl} onRetry={onRetry} />
      </section>
    )
  }

  const emptyMessage = isLoading
    ? 'Loading chapters...'
    : 'No chapters found for this subject.'

  return (
    <section className="rounded-xl border border-border-subtle bg-surface-white shadow-tier-1">
      <DataTable
        columnCount={COLUMN_COUNT}
        columnWidths={COLUMN_WIDTHS}
        minWidth={720}
        header={
          <TableHeaderRow>
            <TableHeadCell className="whitespace-nowrap text-center">Sort Order</TableHeadCell>
            <TableHeadCell>Chapter Name</TableHeadCell>
            <TableHeadCell>Module</TableHeadCell>
            <TableHeadCell className="text-center">Questions</TableHeadCell>
            <SortableTableHeader
              label="Status"
              field="isActive"
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
              align="center"
            />
            <TableHeadCell className="text-center">Actions</TableHeadCell>
          </TableHeaderRow>
        }
        skeletonRows={<QbankChaptersSkeletonRows />}
        emptyMessage={emptyMessage}
        rowCount={chapters.length}
        pageSize={QBANK_CHAPTERS_PAGE_SIZE}
        isInitialLoading={isInitialLoading}
        isPageLoading={isPageLoading}
        isLoading={isLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        onNext={onNext}
        onPrevious={onPrevious}
      >
        {chapters.map((chapter) => (
          <QbankChapterRow
            key={chapter.id}
            chapter={chapter}
            onView={onView}
            onEdit={onEdit}
          />
        ))}
      </DataTable>
    </section>
  )
}
