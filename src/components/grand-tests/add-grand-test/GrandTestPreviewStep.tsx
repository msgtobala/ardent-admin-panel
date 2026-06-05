import { useState } from 'react'
import { formatDisplayDate } from '@/lib/format-display-date'
import type { SelectedGrandTestQuestion } from '@/types/grand-test'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { GrandTestStatusBadge } from '@/components/grand-tests/GrandTestStatusBadge'
import { GrandTestQuestionDetailPanel } from './GrandTestQuestionDetailPanel'

interface GrandTestPreviewStepProps {
  title: string
  testStart: Date | null
  testExpiry: Date | null
  duration: number
  isFree: boolean
  isActive: boolean
  correctMark: number
  negativeMark: number
  selectedQuestions: SelectedGrandTestQuestion[]
}

interface PreviewFieldProps {
  label: string
  value: string
}

const detailsButtonClassName =
  'cursor-pointer rounded-lg px-2 py-1 text-label-sm font-medium text-primary transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring'

function PreviewField({ label, value }: PreviewFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-label-sm text-on-surface-variant">{label}</span>
      <p className="text-body-md !text-black">{value}</p>
    </div>
  )
}

export function GrandTestPreviewStep({
  title,
  testStart,
  testExpiry,
  duration,
  isFree,
  isActive,
  correctMark,
  negativeMark,
  selectedQuestions,
}: GrandTestPreviewStepProps) {
  const [expandedDetailId, setExpandedDetailId] = useState<string | null>(null)

  function handleToggleDetails(documentId: string) {
    setExpandedDetailId((previous) => (previous === documentId ? null : documentId))
  }

  return (
    <div className="flex flex-col gap-gutter">
      <section className="rounded-xl border border-border-subtle bg-surface-container-low p-4">
        <h3 className="mb-4 text-card-title text-on-surface">Basic details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <PreviewField label="Test Name" value={title || '—'} />
          <PreviewField
            label="Duration"
            value={duration > 0 ? `${duration} minutes` : '—'}
          />
          <PreviewField
            label="Start Date & Time"
            value={testStart ? formatDisplayDate(testStart) : '—'}
          />
          <PreviewField
            label="End Date & Time"
            value={testExpiry ? formatDisplayDate(testExpiry) : '—'}
          />
          <PreviewField label="Correct Mark" value={String(correctMark)} />
          <PreviewField label="Negative Mark" value={String(negativeMark)} />
          <PreviewField label="Free Access" value={isFree ? 'Free' : 'Paid'} />
          <PreviewField label="Status" value={isActive ? 'Active' : 'Inactive'} />
        </div>
        {testStart && testExpiry ? (
          <div className="mt-4">
            <GrandTestStatusBadge testStart={testStart} testExpiry={testExpiry} />
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-border-subtle bg-surface-container-low p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-card-title text-on-surface">Questions</h3>
          <span className="rounded-full bg-primary-fixed px-3 py-1 text-label-sm font-semibold text-primary">
            {selectedQuestions.length} selected
          </span>
        </div>

        {selectedQuestions.length === 0 ? (
          <p className="text-body-md text-on-surface-variant">No questions selected.</p>
        ) : (
          <ol className="flex max-h-[min(32rem,60vh)] flex-col gap-2 overflow-y-auto">
            {selectedQuestions.map((question, index) => {
              const isExpanded = expandedDetailId === question.documentId

              return (
                <li
                  key={question.documentId}
                  className="rounded-lg border border-border-subtle bg-surface-white px-3 py-3"
                >
                  <p className="text-label-sm font-semibold text-primary">
                    {index + 1}. {question.questionRefId}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-body-md text-on-surface">
                    {question.questionText}
                  </p>
                  <p className="mt-2 text-label-sm text-on-surface-variant">
                    {question.subjectName} · {question.chapterName}
                  </p>
                  <button
                    type="button"
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

                  {isExpanded ? (
                    <div className="mt-3 border-t border-border-subtle pt-3">
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
          </ol>
        )}
      </section>
    </div>
  )
}
