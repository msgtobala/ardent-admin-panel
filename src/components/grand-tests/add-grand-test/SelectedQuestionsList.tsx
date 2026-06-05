import { useState } from 'react'
import type { SelectedGrandTestQuestion } from '@/types/grand-test'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { GrandTestQuestionDetailPanel } from './GrandTestQuestionDetailPanel'

interface SelectedQuestionsListProps {
  questions: SelectedGrandTestQuestion[]
  disabled?: boolean
  listMaxHeightClass?: string
  onRemove: (documentId: string) => void
}

const removeButtonClassName =
  'cursor-pointer rounded-lg p-2 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-50'

const detailsButtonClassName =
  'cursor-pointer rounded-lg px-2 py-1 text-label-sm font-medium text-primary transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-50'

export function SelectedQuestionsList({
  questions,
  disabled = false,
  listMaxHeightClass = 'max-h-80',
  onRemove,
}: SelectedQuestionsListProps) {
  const [expandedDetailId, setExpandedDetailId] = useState<string | null>(null)

  if (questions.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border-subtle px-4 py-6 text-center text-body-md text-on-surface-variant">
        No questions added yet. Check questions above and click Add selected.
      </p>
    )
  }

  function handleToggleDetails(documentId: string) {
    setExpandedDetailId((previous) => (previous === documentId ? null : documentId))
  }

  return (
    <ul
      className={[
        'flex flex-col gap-2 overflow-y-auto rounded-xl border border-border-subtle bg-surface-container-low p-3',
        listMaxHeightClass,
      ].join(' ')}
    >
      {questions.map((question, index) => {
        const isExpanded = expandedDetailId === question.documentId

        return (
          <li
            key={question.documentId}
            className="rounded-lg border border-border-subtle bg-surface-white px-3 py-3"
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-label-sm font-semibold text-primary"
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-label-sm font-semibold text-primary">
                  {question.questionRefId}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-body-md text-on-surface">
                  {question.questionText}
                </p>
                <p className="mt-2 text-label-sm text-on-surface-variant">
                  {question.subjectName} · {question.chapterName}
                </p>
                <button
                  type="button"
                  disabled={disabled}
                  aria-expanded={isExpanded}
                  onClick={() => handleToggleDetails(question.documentId)}
                  className={`${detailsButtonClassName} mt-2 inline-flex items-center gap-1`}
                >
                  <MaterialIcon
                    name={isExpanded ? 'expand_less' : 'expand_more'}
                    size={16}
                  />
                  {isExpanded ? 'Hide details' : 'View complete details'}
                </button>
              </div>
              <button
                type="button"
                aria-label={`Remove question ${question.questionRefId}`}
                onClick={() => onRemove(question.documentId)}
                disabled={disabled}
                className={removeButtonClassName}
              >
                <MaterialIcon name="close" size={16} className="text-on-surface-variant" />
              </button>
            </div>

            {isExpanded ? (
              <div className="mt-3 pl-9">
                <GrandTestQuestionDetailPanel
                  subjectRefId={question.subjectRefId}
                  chapterRefId={question.chapterRefId}
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
