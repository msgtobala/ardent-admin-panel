import { CLINICAL_VIGNETTE_PREVIOUS_PAGE_SIZE } from '@/lib/clinical-vignettes'
import { formatDisplayDate } from '@/lib/format-display-date'
import type {
  ClinicalVignettePreviousSortField,
  ResolvedClinicalVignetteQuestion,
  SortDirection,
} from '@/types/clinical-vignette'
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

interface PreviousClinicalVignettesTableProps {
  questions: ResolvedClinicalVignetteQuestion[]
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
  onDelete: (question: ResolvedClinicalVignetteQuestion) => void
  sortField: ClinicalVignettePreviousSortField
  sortDirection: SortDirection
  onSort: (field: ClinicalVignettePreviousSortField) => void
}

const COLUMN_WIDTHS = [undefined, undefined, 'w-[200px]', 'w-[100px]']

const actionButtonClassName =
  'cursor-pointer rounded-lg p-2 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring'

function PreviousQuestionsSkeletonRows() {
  return Array.from({ length: CLINICAL_VIGNETTE_PREVIOUS_PAGE_SIZE }).map((_, index) => (
    <TableRow key={`previous-vignette-skeleton-${index}`} aria-hidden>
      <TableCell>
        <div className="h-4 w-40 animate-pulse rounded bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-full animate-pulse rounded bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-32 animate-pulse rounded bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="mx-auto h-8 w-10 animate-pulse rounded-lg bg-surface-container" />
      </TableCell>
    </TableRow>
  ))
}

function PreviousQuestionRow({
  question,
  onDelete,
}: {
  question: ResolvedClinicalVignetteQuestion
  onDelete: (question: ResolvedClinicalVignetteQuestion) => void
}) {
  return (
    <TableRow>
      <TableCell className="font-medium text-text-black">
        <span className="block truncate">{question.subjectName || '—'}</span>
      </TableCell>
      <TableCell className="text-body-md text-text-black">
        <span className="line-clamp-2">{question.questionText || '—'}</span>
      </TableCell>
      <TableCell className="whitespace-nowrap text-body-md text-text-black">
        {formatDisplayDate(question.createdAt)}
      </TableCell>
      <TableCell className="px-3">
        <div className="flex items-center justify-center">
          <button
            type="button"
            aria-label={`Delete previous question ${question.questionRefId}`}
            onClick={() => onDelete(question)}
            className={actionButtonClassName}
          >
            <MaterialIcon name="delete" size={16} className="text-on-surface-variant" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function PreviousClinicalVignettesTable({
  questions,
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
  onDelete,
  sortField,
  sortDirection,
  onSort,
}: PreviousClinicalVignettesTableProps) {
  if (error) {
    return (
      <div className="flex flex-col gap-gutter">
        <section
          aria-labelledby="previous-clinical-vignettes-title"
          className="overflow-hidden rounded-xl border border-border-subtle bg-surface-white px-gutter py-5 shadow-tier-1"
        >
          <h2 id="previous-clinical-vignettes-title" className="text-card-title text-on-surface">
            Previous Questions
          </h2>
        </section>
        <TableErrorState message={error} indexUrl={errorIndexUrl} onRetry={onRetry} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-gutter">
      <section
        aria-labelledby="previous-clinical-vignettes-title"
        className="overflow-hidden rounded-xl border border-border-subtle bg-surface-white px-gutter py-5 shadow-tier-1"
      >
        <h2 id="previous-clinical-vignettes-title" className="text-card-title text-on-surface">
          Previous Questions
        </h2>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Historical clinical vignette questions from previous days
        </p>
      </section>

      <DataTable
        columnCount={4}
        columnWidths={COLUMN_WIDTHS}
        rowCount={questions.length}
        pageSize={CLINICAL_VIGNETTE_PREVIOUS_PAGE_SIZE}
        isInitialLoading={isInitialLoading}
        isPageLoading={isPageLoading}
        isLoading={isLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        onNext={onNext}
        onPrevious={onPrevious}
        emptyMessage="No previous questions found."
        skeletonRows={<PreviousQuestionsSkeletonRows />}
        header={
          <TableHeaderRow>
            <SortableTableHeader
              label="Subject Name"
              field="subjectName"
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            <SortableTableHeader
              label="Question"
              field="questionText"
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            <SortableTableHeader
              label="Created Date"
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
        {questions.map((question) => (
          <PreviousQuestionRow
            key={question.id}
            question={question}
            onDelete={onDelete}
          />
        ))}
      </DataTable>
    </div>
  )
}
