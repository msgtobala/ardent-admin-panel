import { useEffect, useState } from 'react'
import { fetchFullQbankQuestionDetails } from '@/lib/qbank-references'
import {
  isCorrectAnswerOption,
  resolveCorrectAnswerChoice,
  resolveCorrectAnswerDescription,
} from '@/lib/qbank-question-display'
import type { FullQbankQuestionDetails } from '@/types/qbank-question'
import { CircularLoader } from '@/components/ui/CircularLoader'

interface GrandTestQuestionDetailPanelProps {
  subjectRefId: string
  chapterRefId: string
  questionRefId: string
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-label-sm text-on-surface-variant">{label}</span>
      <p className="whitespace-pre-wrap text-body-md !text-black">{value || '—'}</p>
    </div>
  )
}

export function GrandTestQuestionDetailPanel({
  subjectRefId,
  chapterRefId,
  questionRefId,
}: GrandTestQuestionDetailPanelProps) {
  const [details, setDetails] = useState<FullQbankQuestionDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    let isCancelled = false

    async function loadDetails() {
      setIsLoading(true)
      setError(undefined)
      setDetails(null)

      try {
        const fullDetails = await fetchFullQbankQuestionDetails(
          subjectRefId,
          chapterRefId,
          questionRefId,
        )

        if (isCancelled) return

        if (!fullDetails) {
          setError('Question details could not be found.')
          return
        }

        setDetails(fullDetails)
      } catch {
        if (!isCancelled) {
          setError('Failed to load question details.')
        }
      } finally {
        if (!isCancelled) setIsLoading(false)
      }
    }

    void loadDetails()

    return () => {
      isCancelled = true
    }
  }, [subjectRefId, chapterRefId, questionRefId])

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 py-2">
        <CircularLoader size="sm" label="Loading question details" />
      </div>
    )
  }

  if (error) {
    return <p className="text-label-sm text-error-red">{error}</p>
  }

  if (!details) return null

  const correctOptionKey = details.correctAnswer?.option ?? ''
  const correctAnswerText = resolveCorrectAnswerChoice(
    details.answerOptions,
    correctOptionKey,
  )
  const correctAnswerDescription = resolveCorrectAnswerDescription(
    details.correctAnswer?.description ?? '',
    correctOptionKey,
    correctAnswerText,
  )

  return (
    <div className="flex flex-col gap-3 border-t border-border-subtle pt-3">
      {details.questionImage ? (
        <div className="flex flex-col gap-1">
          <span className="text-label-sm text-on-surface-variant">Question Image</span>
          <img
            src={details.questionImage}
            alt="Question illustration"
            className="max-h-48 w-auto max-w-full rounded-input border border-border-subtle object-contain"
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <span className="text-label-sm text-on-surface-variant">Answer Options</span>
        {details.answerOptions.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {details.answerOptions.map((answerOption, optionIndex) => {
              const isCorrect = isCorrectAnswerOption(
                answerOption,
                optionIndex,
                correctOptionKey,
              )

              return (
                <li
                  key={`${answerOption.option}-${answerOption.choice}`}
                  className={[
                    'rounded-input border px-3 py-2 text-body-md !text-black',
                    isCorrect
                      ? 'border-success-green bg-success-bg font-medium'
                      : 'border-border-subtle bg-surface-white',
                  ].join(' ')}
                >
                  <span className="font-semibold">{answerOption.option}. </span>
                  {answerOption.choice}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-body-md !text-black">—</p>
        )}
      </div>

      <DetailField label="Correct Answer" value={correctAnswerText} />
      <DetailField label="Correct Answer Description" value={correctAnswerDescription} />
    </div>
  )
}
