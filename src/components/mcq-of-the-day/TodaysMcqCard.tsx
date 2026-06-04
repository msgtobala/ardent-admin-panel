import {
  appendScheduleHelpText,
  getMcqOfTheDayScheduleHelpText,
} from '@/config/nuggets-daily-scheduler'
import { formatTodayDate, getTodayDateIso } from '@/lib/format-display-date'
import type { ResolvedMcqOfTheDayQuestion } from '@/types/mcq-of-the-day'
import { CopyIdButton } from '@/components/ui/CopyIdButton'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

const TODAYS_QUESTION_HELP_TEXT = appendScheduleHelpText(
  'Active MCQ shown to students today.',
  getMcqOfTheDayScheduleHelpText(),
)

interface TodaysMcqCardProps {
  question: ResolvedMcqOfTheDayQuestion | null
  isLoading: boolean
  onView: () => void
}

interface DetailFieldProps {
  label: string
  value: string
  copyId?: string
  copySuccessMessage?: string
}

function DetailField({ label, value, copyId, copySuccessMessage }: DetailFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-label-sm text-on-surface-variant">{label}</span>
      <div className="flex items-start gap-1">
        <p className="min-w-0 flex-1 text-body-md !text-black">{value || '—'}</p>
        {copyId && copySuccessMessage ? (
          <CopyIdButton
            value={copyId}
            ariaLabel={`Copy ${label.toLowerCase()} id ${copyId}`}
            successMessage={copySuccessMessage}
          />
        ) : null}
      </div>
    </div>
  )
}

function StatField({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-label-sm text-on-surface-variant">{label}</span>
      <p className="text-body-md !text-black">{value.toLocaleString()}</p>
    </div>
  )
}

const viewButtonClassName =
  'cursor-pointer rounded-lg p-2 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-50'

export function TodaysMcqCard({ question, isLoading, onView }: TodaysMcqCardProps) {
  const canView = Boolean(question) && !isLoading

  return (
    <section
      aria-labelledby="todays-mcq-title"
      className="overflow-hidden rounded-xl border border-border-subtle bg-surface-white shadow-tier-1"
    >
      <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-gutter py-5">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div
            aria-hidden
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-fixed"
          >
            <MaterialIcon name="quiz" size={20} className="text-primary" />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <h2 id="todays-mcq-title" className="text-card-title text-on-surface">
              Today&apos;s Question
            </h2>
            <time
              dateTime={getTodayDateIso()}
              className="text-label-sm font-medium !text-black"
            >
              {formatTodayDate()}
            </time>
            <p className="text-body-md text-on-surface-variant">{TODAYS_QUESTION_HELP_TEXT}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onView}
          disabled={!canView}
          aria-label="View complete question details"
          title="View complete question details"
          className={viewButtonClassName}
        >
          <MaterialIcon name="visibility" size={20} className="text-on-surface-variant" />
        </button>
      </div>

      <div className="flex flex-col gap-4 px-gutter py-gutter">
        {isLoading ? (
          <p className="text-body-md text-on-surface-variant">Loading today&apos;s question...</p>
        ) : !question ? (
          <p className="text-body-md text-on-surface-variant">No question is set for today.</p>
        ) : (
          <>
            <DetailField
              label="Subject Name"
              value={question.subjectName}
              copyId={question.subjectRefId}
              copySuccessMessage="Subject id copied to clipboard"
            />
            <DetailField
              label="Chapter Name"
              value={question.chapterName}
              copyId={question.chapterRefId}
              copySuccessMessage="Chapter id copied to clipboard"
            />
            <DetailField
              label="Question"
              value={question.questionText}
              copyId={question.questionRefId}
              copySuccessMessage="Question id copied to clipboard"
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <StatField
                label="Students Answered Correctly"
                value={question.correctAnswerCount}
              />
              <StatField
                label="Students Answered Incorrectly"
                value={question.wrongAnswerCount}
              />
              <StatField label="Students Attended" value={question.studentsAttendedCount} />
            </div>
          </>
        )}
      </div>
    </section>
  )
}
