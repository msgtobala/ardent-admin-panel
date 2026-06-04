import {
  appendScheduleHelpText,
  getMcqOfTheDayScheduleHelpText,
} from '@/config/nuggets-daily-scheduler'
import { MCQ_OF_THE_DAY_PREVIOUS_PAGE_SIZE } from '@/lib/mcq-of-the-day'
import { formatDisplayDate } from '@/lib/format-display-date'
import type {
  McqOfTheDayPreviousSortField,
  ResolvedMcqOfTheDayQuestion,
  SortDirection,
} from '@/types/mcq-of-the-day'
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

interface PreviousMcqTableProps {
  questions: ResolvedMcqOfTheDayQuestion[]
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
  onView: (question: ResolvedMcqOfTheDayQuestion) => void
  sortField: McqOfTheDayPreviousSortField
  sortDirection: SortDirection
  onSort: (field: McqOfTheDayPreviousSortField) => void
}

const PREVIOUS_QUESTIONS_HELP_TEXT = appendScheduleHelpText(
  'Historical MCQ of the day questions from previous days.',
  getMcqOfTheDayScheduleHelpText(),
)

const COLUMN_WIDTHS = [undefined, undefined, 'w-[200px]', 'w-[100px]']

const actionButtonClassName =
  'cursor-pointer rounded-lg p-2 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring'

function PreviousQuestionsSkeletonRows() {
  return Array.from({ length: MCQ_OF_THE_DAY_PREVIOUS_PAGE_SIZE }).map((_, index) => (
    <TableRow key={`previous-mcq-skeleton-${index}`} aria-hidden>
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
  onView,
}: {
  question: ResolvedMcqOfTheDayQuestion
  onView: (question: ResolvedMcqOfTheDayQuestion) => void
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
            aria-label={`View question details for ${question.questionRefId}`}
            title="View question details"
            onClick={() => onView(question)}
            className={actionButtonClassName}
          >
            <MaterialIcon name="visibility" size={20} className="text-on-surface-variant" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function PreviousMcqTable({
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
  onView,
  sortField,
  sortDirection,
  onSort,
}: PreviousMcqTableProps) {
  if (error) {
    return (
      <div className="flex flex-col gap-gutter">
        <section
          aria-labelledby="previous-mcq-title"
          className="overflow-hidden rounded-xl border border-border-subtle bg-surface-white px-gutter py-5 shadow-tier-1"
        >
          <h2 id="previous-mcq-title" className="text-card-title text-on-surface">
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
        aria-labelledby="previous-mcq-title"
        className="overflow-hidden rounded-xl border border-border-subtle bg-surface-white px-gutter py-5 shadow-tier-1"
      >
        <h2 id="previous-mcq-title" className="text-card-title text-on-surface">
          Previous Questions
        </h2>
        <p className="mt-1 text-body-md text-on-surface-variant">
          {PREVIOUS_QUESTIONS_HELP_TEXT}
        </p>
      </section>

      <DataTable
        columnCount={4}
        columnWidths={COLUMN_WIDTHS}
        rowCount={questions.length}
        pageSize={MCQ_OF_THE_DAY_PREVIOUS_PAGE_SIZE}
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
          <PreviousQuestionRow key={question.id} question={question} onView={onView} />
        ))}
      </DataTable>
    </div>
  )
}
