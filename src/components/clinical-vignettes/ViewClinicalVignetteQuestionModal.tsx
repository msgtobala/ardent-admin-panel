import { useCallback, useEffect, useState } from 'react'
import { fetchFullQbankQuestionDetails } from '@/lib/qbank-references'
import { formatDisplayDate } from '@/lib/format-display-date'
import {
  isCorrectAnswerOption,
  resolveCorrectAnswerChoice,
  resolveCorrectAnswerDescription,
} from '@/lib/qbank-question-display'
import type { ResolvedClinicalVignetteQuestion } from '@/types/clinical-vignette'
import type { FullQbankQuestionDetails } from '@/types/qbank-question'
import { Button } from '@/components/ui/Button'
import { CopyIdButton } from '@/components/ui/CopyIdButton'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

interface ViewClinicalVignetteQuestionModalProps {
  isOpen: boolean
  question: ResolvedClinicalVignetteQuestion | null
  onClose: () => void
}

interface DetailRowProps {
  label: string
  value: string
  copyId?: string
  copySuccessMessage?: string
}

function DetailRow({ label, value, copyId, copySuccessMessage }: DetailRowProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-label-sm text-on-surface-variant">{label}</span>
      <div className="flex items-start gap-1">
        <p className="min-w-0 flex-1 whitespace-pre-wrap text-body-md !text-black">
          {value || '—'}
        </p>
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

export function ViewClinicalVignetteQuestionModal({
  isOpen,
  question,
  onClose,
}: ViewClinicalVignetteQuestionModalProps) {
  const [details, setDetails] = useState<FullQbankQuestionDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const handleClose = useCallback(() => {
    if (isLoading) return
    onClose()
  }, [isLoading, onClose])

  useEffect(() => {
    if (!isOpen) {
      setDetails(null)
      setError(undefined)
      setIsLoading(false)
      return
    }

    if (!question) return

    const activeQuestion = question
    let isCancelled = false

    async function loadDetails() {
      setIsLoading(true)
      setError(undefined)
      setDetails(null)

      try {
        const fullDetails = await fetchFullQbankQuestionDetails(
          activeQuestion.subjectRefId,
          activeQuestion.chapterRefId,
          activeQuestion.questionRefId,
        )

        if (isCancelled) return

        if (!fullDetails) {
          setError('Question details could not be found in the qbank.')
          return
        }

        setDetails(fullDetails)
      } catch {
        if (isCancelled) return
        setError('Failed to load question details. Please try again.')
      } finally {
        if (!isCancelled) setIsLoading(false)
      }
    }

    loadDetails()

    return () => {
      isCancelled = true
    }
  }, [isOpen, question])

  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') handleClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleClose])

  if (!isOpen || !question) return null

  const correctOptionKey = details?.correctAnswer?.option ?? ''
  const rawCorrectDescription = details?.correctAnswer?.description ?? ''
  const answerOptions = details?.answerOptions ?? []
  const correctAnswerText = resolveCorrectAnswerChoice(answerOptions, correctOptionKey)
  const correctAnswerDescription = resolveCorrectAnswerDescription(
    rawCorrectDescription,
    correctOptionKey,
    correctAnswerText,
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close question details dialog"
        className="absolute inset-0 cursor-pointer bg-on-surface/40"
        onClick={handleClose}
        disabled={isLoading}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="view-clinical-vignette-modal-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-[720px] flex-col overflow-hidden rounded-xl bg-surface-white shadow-tier-2"
      >
        <div className="flex items-start justify-between border-b border-border-subtle bg-surface px-gutter py-5">
          <div className="flex flex-col gap-2 pr-4">
            <h2 id="view-clinical-vignette-modal-title" className="text-h3 text-on-surface">
              Question Details
            </h2>
            <p className="text-body-md text-on-surface-variant">
              Complete qbank question for today&apos;s clinical vignette
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            aria-label="Close"
            className="cursor-pointer rounded-full p-2 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            <MaterialIcon name="close" size={20} className="text-on-surface" />
          </button>
        </div>

        <div className="flex flex-col gap-gutter overflow-y-auto px-gutter py-gutter">
          {isLoading ? (
            <p className="text-body-md text-on-surface-variant">Loading question details...</p>
          ) : error ? (
            <p className="text-body-md text-error-red" role="alert">
              {error}
            </p>
          ) : (
            <>
              <DetailRow
                label="Subject Name"
                value={question.subjectName}
                copyId={question.subjectRefId}
                copySuccessMessage="Subject id copied to clipboard"
              />
              <DetailRow
                label="Chapter Name"
                value={question.chapterName}
                copyId={question.chapterRefId}
                copySuccessMessage="Chapter id copied to clipboard"
              />
              <DetailRow
                label="Question ID"
                value={details?.questionRefId ?? question.questionRefId}
                copyId={question.questionRefId}
                copySuccessMessage="Question id copied to clipboard"
              />
              <DetailRow
                label="Question"
                value={details?.questionText ?? question.questionText}
              />
              {details?.questionImage ? (
                <div className="flex flex-col gap-1">
                  <span className="text-label-sm text-on-surface-variant">Question Image</span>
                  <img
                    src={details.questionImage}
                    alt="Question illustration"
                    className="max-h-64 w-auto max-w-full rounded-input border border-border-subtle object-contain"
                  />
                </div>
              ) : null}
              <DetailRow
                label="Created Date"
                value={formatDisplayDate(question.createdAt)}
              />
              <div className="flex flex-col gap-2">
                <span className="text-label-sm text-on-surface-variant">Answer Options</span>
                {details && details.answerOptions.length > 0 ? (
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
              <DetailRow label="Correct Answer" value={correctAnswerText} />
              <DetailRow
                label="Correct Answer Description"
                value={correctAnswerDescription}
              />
            </>
          )}
        </div>

        <div className="flex items-center justify-end border-t border-border-subtle bg-surface-container-low px-gutter py-4">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
