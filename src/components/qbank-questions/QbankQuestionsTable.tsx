import type { QbankQuestionListItem } from '@/types/qbank-question-list-item'

import { QBANK_QUESTIONS_PAGE_SIZE } from '@/hooks/useQbankQuestionsPage'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import {
  DataTable,
  TableCell,
  TableErrorState,
  TableHeaderRow,
  TableHeadCell,
  TableRow,
} from '@/components/ui/table'

interface QbankQuestionsTableProps {
  questions: QbankQuestionListItem[]
  currentPage: number
  totalPages: number
  isLoading: boolean
  isInitialLoading: boolean
  hasSubjectSelected: boolean
  hasChapterSelected: boolean
  error?: string
  errorIndexUrl?: string
  hasNext: boolean
  hasPrevious: boolean
  onNext: () => void
  onPrevious: () => void
  onRetry: () => void
  onQuestionClick: (question: QbankQuestionListItem) => void
  onEdit: (question: QbankQuestionListItem) => void
  onDelete: (question: QbankQuestionListItem) => void
}

const COLUMN_COUNT = 7

const COLUMN_WIDTHS = [
  'w-[72px]',
  'w-[140px]',
  'w-[120px]',
  'w-[200px]',
  'w-[160px]',
  'w-[90px]',
  'w-[120px]',
]

const actionButtonClassName =
  'cursor-pointer rounded-lg p-2 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring'

function QbankQuestionsSkeletonRows() {
  return Array.from({ length: QBANK_QUESTIONS_PAGE_SIZE }).map((_, index) => (
    <TableRow key={`qbank-question-skeleton-${index}`} aria-hidden>
      {Array.from({ length: COLUMN_COUNT }).map((__, cellIndex) => (
        <TableCell key={`qbank-question-skeleton-${index}-${cellIndex}`}>
          <div className="h-4 w-full max-w-[120px] animate-pulse rounded bg-surface-container" />
        </TableCell>
      ))}
    </TableRow>
  ))
}

function QbankQuestionRow({
  question,
  onQuestionClick,
  onEdit,
  onDelete,
}: {
  question: QbankQuestionListItem
  onQuestionClick: (question: QbankQuestionListItem) => void
  onEdit: (question: QbankQuestionListItem) => void
  onDelete: (question: QbankQuestionListItem) => void
}) {
  const correctDisplay =
    question.correctAnswerSummary ||
    question.correctAnswer?.option?.trim() ||
    '—'

  return (
    <TableRow
      className="cursor-pointer transition hover:bg-row-hover"
      onClick={() => onQuestionClick(question)}
    >
      <TableCell className="text-center text-body-md text-text-black">
        {question.sortOrder ?? '—'}
      </TableCell>
      <TableCell className="text-body-md text-text-black">
        <span className="block truncate">{question.chapterName || '—'}</span>
      </TableCell>
      <TableCell className="text-body-md text-text-black">
        <span className="block truncate">{question.questionRefId || '—'}</span>
      </TableCell>
      <TableCell className="font-medium text-text-black">
        <span className="line-clamp-1" title={question.questionText || undefined}>
          {question.questionText || '—'}
        </span>
      </TableCell>
      <TableCell className="text-body-md text-text-black">
        <span className="line-clamp-2" title={correctDisplay}>
          {correctDisplay}
        </span>
      </TableCell>
      <TableCell className="text-center text-body-md text-text-black">
        {question.answerOptionsCount > 0
          ? `${question.answerOptionsCount} options`
          : '—'}
      </TableCell>
      <TableCell className="px-3">
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            aria-label={`Edit question ${question.questionRefId}`}
            title="Edit question"
            onClick={(event) => {
              event.stopPropagation()
              onEdit(question)
            }}
            className={actionButtonClassName}
          >
            <MaterialIcon name="edit" size={16} className="text-on-surface-variant" />
          </button>
          <button
            type="button"
            aria-label={`Delete question ${question.questionRefId}`}
            title="Delete question"
            onClick={(event) => {
              event.stopPropagation()
              onDelete(question)
            }}
            className={actionButtonClassName}
          >
            <MaterialIcon name="delete" size={16} className="text-primary-action" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function QbankQuestionsTable({
  questions,
  currentPage,
  totalPages,
  isLoading,
  isInitialLoading,
  hasSubjectSelected,
  hasChapterSelected,
  error,
  errorIndexUrl,
  hasNext,
  hasPrevious,
  onNext,
  onPrevious,
  onRetry,
  onQuestionClick,
  onEdit,
  onDelete,
}: QbankQuestionsTableProps) {
  if (!hasSubjectSelected) {
    return (
      <section className="rounded-xl border border-border-subtle bg-surface-white px-gutter py-10 shadow-tier-1">
        <p className="text-center text-body-md text-on-surface-variant">
          Select a qbank subject to view questions.
        </p>
      </section>
    )
  }

  if (!hasChapterSelected) {
    return (
      <section className="rounded-xl border border-border-subtle bg-surface-white px-gutter py-10 shadow-tier-1">
        <p className="text-center text-body-md text-on-surface-variant">
          Select a chapter to view questions.
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
    ? 'Loading questions...'
    : 'No questions found for this chapter.'

  return (
    <section className="rounded-xl border border-border-subtle bg-surface-white shadow-tier-1">
      <DataTable
        columnCount={COLUMN_COUNT}
        columnWidths={COLUMN_WIDTHS}
        minWidth={880}
        header={
          <TableHeaderRow>
            <TableHeadCell className="text-center">Order</TableHeadCell>
            <TableHeadCell>Chapter</TableHeadCell>
            <TableHeadCell>Question ID</TableHeadCell>
            <TableHeadCell>Question</TableHeadCell>
            <TableHeadCell>Correct</TableHeadCell>
            <TableHeadCell className="text-center">Options</TableHeadCell>
            <TableHeadCell align="center" className="px-3">
              Actions
            </TableHeadCell>
          </TableHeaderRow>
        }
        skeletonRows={<QbankQuestionsSkeletonRows />}
        emptyMessage={emptyMessage}
        rowCount={questions.length}
        pageSize={QBANK_QUESTIONS_PAGE_SIZE}
        isInitialLoading={isInitialLoading}
        isPageLoading={isLoading && !isInitialLoading}
        isLoading={isLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        onNext={onNext}
        onPrevious={onPrevious}
      >
        {questions.map((question) => (
          <QbankQuestionRow
            key={`${question.chapterId}-${question.documentId}`}
            question={question}
            onQuestionClick={onQuestionClick}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </DataTable>
    </section>
  )
}
