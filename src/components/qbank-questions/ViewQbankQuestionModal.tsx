import { useCallback, useEffect } from 'react'

import {
  isCorrectAnswerOption,
  resolveCorrectAnswerChoice,
  resolveCorrectAnswerDescription,
} from '@/lib/qbank-question-display'
import type { QbankQuestionListItem } from '@/types/qbank-question-list-item'
import { StatusBadge } from '@/components/banners/StatusBadge'
import { Button } from '@/components/ui/Button'
import { CopyIdButton } from '@/components/ui/CopyIdButton'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

interface ViewQbankQuestionModalProps {
  isOpen: boolean
  question: QbankQuestionListItem | null
  subjectName: string
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

export function ViewQbankQuestionModal({
  isOpen,
  question,
  subjectName,
  onClose,
}: ViewQbankQuestionModalProps) {
  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

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

  const correctOptionKey = question.correctAnswer?.option ?? ''
  const rawCorrectDescription = question.correctAnswer?.description ?? ''
  const correctAnswerText = resolveCorrectAnswerChoice(question.answerOptions, correctOptionKey)
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
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="view-qbank-question-modal-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-[720px] flex-col overflow-hidden rounded-xl bg-surface-white shadow-tier-2"
      >
        <div className="flex items-start justify-between border-b border-border-subtle bg-surface px-gutter py-5">
          <div className="flex flex-col gap-2 pr-4">
            <h2 id="view-qbank-question-modal-title" className="text-h3 text-on-surface">
              Question Details
            </h2>
            <p className="text-body-md text-on-surface-variant">
              Full qbank question from the selected chapters
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="cursor-pointer rounded-full p-2 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <MaterialIcon name="close" size={20} className="text-on-surface" />
          </button>
        </div>

        <div className="flex flex-col gap-gutter overflow-y-auto px-gutter py-gutter">
          <DetailRow label="Subject Name" value={subjectName} />
          <DetailRow
            label="Chapter Name"
            value={question.chapterName}
            copyId={question.chapterId}
            copySuccessMessage="Chapter id copied to clipboard"
          />
          <DetailRow
            label="Question ID"
            value={question.questionRefId}
            copyId={question.questionRefId}
            copySuccessMessage="Question id copied to clipboard"
          />
          <DetailRow
            label="Document ID"
            value={question.documentId}
            copyId={question.documentId}
            copySuccessMessage="Document id copied to clipboard"
          />
          <DetailRow label="Question" value={question.questionText} />
          {question.questionImage ? (
            <div className="flex flex-col gap-1">
              <span className="text-label-sm text-on-surface-variant">Question Image</span>
              <img
                src={question.questionImage}
                alt="Question illustration"
                className="max-h-64 w-auto max-w-full rounded-input border border-border-subtle object-contain"
              />
            </div>
          ) : null}
          <div className="flex flex-col gap-2">
            <span className="text-label-sm text-on-surface-variant">Answer Options</span>
            {question.answerOptions.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {question.answerOptions.map((answerOption, optionIndex) => {
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
          {question.correctAnswerImages.length > 0 ? (
            <div className="flex flex-col gap-2">
              <span className="text-label-sm text-on-surface-variant">
                Correct Answer Images
              </span>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {question.correctAnswerImages.map((imageUrl) => (
                  <img
                    key={imageUrl}
                    src={imageUrl}
                    alt="Correct answer illustration"
                    className="max-h-64 w-auto max-w-full rounded-input border border-border-subtle object-contain"
                  />
                ))}
              </div>
            </div>
          ) : null}
          <DetailRow label="Reference" value={question.referenceSummary ?? ''} />
          <div className="flex flex-col gap-1">
            <span className="text-label-sm text-on-surface-variant">Status</span>
            <div>
              <StatusBadge isActive={question.isActive} />
            </div>
          </div>
          <DetailRow
            label="Sort Order"
            value={question.sortOrder !== null ? String(question.sortOrder) : ''}
          />
        </div>

        <div className="flex items-center justify-end border-t border-border-subtle bg-surface-container-low px-gutter py-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
