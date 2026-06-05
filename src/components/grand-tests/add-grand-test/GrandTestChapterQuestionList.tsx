import type { QbankQuestionOption } from '@/lib/qbank-references'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { GrandTestQuestionDetailPanel } from './GrandTestQuestionDetailPanel'

interface GrandTestChapterQuestionListProps {
  questions: QbankQuestionOption[]
  selectedIds: string[]
  expandedDetailId: string | null
  alreadyAddedIds: Set<string>
  subjectRefId: string
  chapterRefId: string
  disabled?: boolean
  listMaxHeightClass?: string
  onToggleSelect: (documentId: string) => void
  onToggleDetails: (documentId: string) => void
}

const checkboxClassName =
  'mt-1 size-4 shrink-0 cursor-pointer accent-primary-action disabled:cursor-not-allowed'

const detailsButtonClassName =
  'cursor-pointer rounded-lg px-2 py-1 text-label-sm font-medium text-primary transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-50'

export function GrandTestChapterQuestionList({
  questions,
  selectedIds,
  expandedDetailId,
  alreadyAddedIds,
  subjectRefId,
  chapterRefId,
  disabled = false,
  listMaxHeightClass = 'max-h-80',
  onToggleSelect,
  onToggleDetails,
}: GrandTestChapterQuestionListProps) {
  if (questions.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border-subtle px-4 py-6 text-center text-body-md text-on-surface-variant">
        No questions found in this chapter.
      </p>
    )
  }

  return (
    <ul
      className={[
        'flex flex-col gap-2 overflow-y-auto rounded-xl border border-border-subtle bg-surface-container-low p-3',
        listMaxHeightClass,
      ].join(' ')}
    >
      {questions.map((question) => {
        const isSelected = selectedIds.includes(question.documentId)
        const isAlreadyAdded = alreadyAddedIds.has(question.documentId)
        const isExpanded = expandedDetailId === question.documentId

        return (
          <li
            key={question.documentId}
            className={[
              'rounded-lg border bg-surface-white px-3 py-3',
              isSelected ? 'border-primary-action' : 'border-border-subtle',
              isAlreadyAdded ? 'opacity-60' : '',
            ].join(' ')}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id={`grand-test-question-${question.documentId}`}
                checked={isSelected}
                disabled={disabled || isAlreadyAdded}
                aria-label={`Select question ${question.questionRefId}`}
                className={checkboxClassName}
                onChange={() => onToggleSelect(question.documentId)}
              />
              <div className="min-w-0 flex-1">
                <label
                  htmlFor={`grand-test-question-${question.documentId}`}
                  className="cursor-pointer"
                >
                  <p className="text-label-sm font-semibold text-primary">
                    {question.questionRefId}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-body-md text-on-surface">
                    {question.questionText}
                  </p>
                </label>
                {isAlreadyAdded ? (
                  <p className="mt-2 text-label-sm text-on-surface-variant">
                    Already added to this test
                  </p>
                ) : null}
                <button
                  type="button"
                  disabled={disabled}
                  aria-expanded={isExpanded}
                  onClick={() => onToggleDetails(question.documentId)}
                  className={`${detailsButtonClassName} mt-2 inline-flex items-center gap-1`}
                >
                  <MaterialIcon
                    name={isExpanded ? 'expand_less' : 'expand_more'}
                    size={16}
                  />
                  {isExpanded ? 'Hide details' : 'View complete details'}
                </button>
              </div>
            </div>

            {isExpanded ? (
              <div className="mt-3 pl-7">
                <GrandTestQuestionDetailPanel
                  subjectRefId={subjectRefId}
                  chapterRefId={chapterRefId}
                  questionRefId={question.questionRefId}
                />
              </div>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
