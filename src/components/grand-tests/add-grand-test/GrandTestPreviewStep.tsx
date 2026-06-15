import { useState } from 'react'
import { formatDisplayDate } from '@/lib/format-display-date'
import type { SelectedGrandTestQuestion } from '@/types/grand-test'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { GrandTestStatusBadge } from '@/components/grand-tests/GrandTestStatusBadge'
import { GrandTestFormSection } from './GrandTestFormSection'
import { GrandTestQuestionDetailModal } from './GrandTestQuestionDetailModal'

interface GrandTestPreviewStepProps {
  title: string
  testStart: Date | null
  testExpiry: Date | null
  duration: number
  questionsCount: number
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

const viewButtonClassName =
  'cursor-pointer rounded-lg px-2 py-1 text-label-sm font-medium text-primary transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring'

function PreviewField({ label, value }: PreviewFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-label-sm text-on-surface-variant">{label}</span>
      <p className="text-body-md text-black!">{value}</p>
    </div>
  )
}

export function GrandTestPreviewStep({
  title,
  testStart,
  testExpiry,
  duration,
  questionsCount,
  isFree,
  isActive,
  correctMark,
  negativeMark,
  selectedQuestions,
}: GrandTestPreviewStepProps) {
  const [detailQuestion, setDetailQuestion] = useState<SelectedGrandTestQuestion | null>(null)
  const countsMatch = questionsCount === selectedQuestions.length

  return (
    <div className="flex flex-col gap-gutter">
      <section className="rounded-xl border border-border-subtle bg-surface-white p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <h3 className="text-section-title text-on-surface">{title || 'Untitled test'}</h3>
            {testStart && testExpiry ? (
              <GrandTestStatusBadge testStart={testStart} testExpiry={testExpiry} />
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-3 py-1 text-label-sm text-on-surface">
              <MaterialIcon name="schedule" size={16} aria-hidden />
              {duration > 0 ? `${duration} min` : '—'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-3 py-1 text-label-sm text-on-surface">
              <MaterialIcon name="quiz" size={16} aria-hidden />
              {questionsCount > 0 ? `${questionsCount} questions` : '—'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-3 py-1 text-label-sm text-on-surface">
              <MaterialIcon name="grade" size={16} aria-hidden />
              +{correctMark} / {negativeMark}
            </span>
          </div>
        </div>
      </section>

      <GrandTestFormSection title="Basic details">
        <div className="grid gap-4 sm:grid-cols-2">
          <PreviewField label="Test Name" value={title || '—'} />
          <PreviewField
            label="Duration"
            value={duration > 0 ? `${duration} minutes` : '—'}
          />
          <PreviewField
            label="Number of Questions"
            value={questionsCount > 0 ? String(questionsCount) : '—'}
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
          <PreviewField
            label="Status"
            value={isActive ? 'Active' : 'Inactive'}
          />
        </div>
      </GrandTestFormSection>

      <GrandTestFormSection title="Questions">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-body-md text-on-surface-variant">
            Review the questions included in this test before saving.
          </p>
          {!countsMatch ? (
            <span className="inline-flex rounded-full bg-warning-bg px-3 py-1 text-label-sm font-medium text-tertiary">
              {questionsCount} declared · {selectedQuestions.length} selected
            </span>
          ) : (
            <span className="inline-flex rounded-full bg-success-bg px-3 py-1 text-label-sm font-medium text-success-green">
              {selectedQuestions.length} questions
            </span>
          )}
        </div>

        {selectedQuestions.length === 0 ? (
          <p className="text-body-md text-on-surface-variant">No questions selected.</p>
        ) : (
          <ol className="flex max-h-[min(32rem,60vh)] flex-col gap-2 overflow-y-auto">
            {selectedQuestions.map((question, index) => (
              <li
                key={question.documentId}
                className="rounded-lg border border-border-subtle bg-surface-white px-3 py-3"
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-label-sm font-semibold text-primary">
                        {index + 1}. {question.questionRefId}
                      </p>
                      {question.isCustom ? (
                        <span className="inline-flex rounded-full bg-info-bg px-2 py-0.5 text-caption font-medium text-on-secondary-fixed">
                          Custom
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-body-md text-on-surface">
                      {question.questionText}
                    </p>
                    <p className="mt-2 text-label-sm text-on-surface-variant">
                      {question.subjectName} · {question.chapterName}
                    </p>
                    <button
                      type="button"
                      onClick={() => setDetailQuestion(question)}
                      className={`${viewButtonClassName} mt-2 inline-flex items-center gap-1`}
                    >
                      <MaterialIcon name="visibility" size={16} />
                      View details
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </GrandTestFormSection>

      <GrandTestQuestionDetailModal
        isOpen={detailQuestion !== null}
        question={detailQuestion}
        onClose={() => setDetailQuestion(null)}
      />
    </div>
  )
}
