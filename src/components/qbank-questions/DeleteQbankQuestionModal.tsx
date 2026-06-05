import { useCallback, useEffect, useState } from 'react'

import type { QbankQuestionListItem } from '@/types/qbank-question-list-item'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

interface DeleteQbankQuestionModalProps {
  isOpen: boolean
  question: QbankQuestionListItem | null
  onClose: () => void
  onConfirm: () => Promise<void>
}

function getQuestionDisplayLabel(question: QbankQuestionListItem): string {
  const questionText = question.questionText.trim()
  if (!questionText || questionText === '—') {
    return question.questionRefId.trim() || question.documentId
  }

  return questionText.length > 80 ? `${questionText.slice(0, 80)}…` : questionText
}

export function DeleteQbankQuestionModal({
  isOpen,
  question,
  onClose,
  onConfirm,
}: DeleteQbankQuestionModalProps) {
  const { showSnackbar } = useSnackbar()
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    if (!isOpen) {
      setIsDeleting(false)
      setError(undefined)
    }
  }, [isOpen])

  const handleClose = useCallback(() => {
    if (isDeleting) return
    onClose()
  }, [isDeleting, onClose])

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

  async function handleConfirmDelete() {
    setError(undefined)
    setIsDeleting(true)

    try {
      await onConfirm()
      showSnackbar('Qbank question deleted successfully')
      onClose()
    } catch {
      const errorMessage = 'Failed to delete qbank question. Please try again.'
      showSnackbar(errorMessage)
      setError(errorMessage)
      setIsDeleting(false)
    }
  }

  if (!isOpen || !question) return null

  const questionId = question.questionRefId.trim() || question.documentId
  const questionLabel = getQuestionDisplayLabel(question)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close delete qbank question dialog"
        className="absolute inset-0 cursor-pointer bg-on-surface/40"
        onClick={handleClose}
        disabled={isDeleting}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-qbank-question-modal-title"
        className="relative z-10 flex w-full max-w-[480px] flex-col overflow-hidden rounded-xl bg-surface-white shadow-tier-2"
      >
        <div className="flex items-start justify-between border-b border-border-subtle bg-surface px-gutter py-5">
          <div className="flex flex-col gap-2 pr-4">
            <h2 id="delete-qbank-question-modal-title" className="text-h3 text-on-surface">
              Delete Qbank Question
            </h2>
            <p className="text-body-md text-on-surface-variant">
              This action cannot be undone.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isDeleting}
            aria-label="Close"
            className="cursor-pointer rounded-full p-2 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            <MaterialIcon name="close" size={20} className="text-on-surface" />
          </button>
        </div>

        <div className="px-gutter py-gutter">
          <p className="text-body-md text-on-surface">
            Are you sure you want to delete question{' '}
            <span className="font-semibold">{questionId}</span>
            {questionLabel !== questionId ? (
              <>
                {' '}
                (<span className="font-semibold">{questionLabel}</span>)
              </>
            ) : null}
            ? Associated images will also be removed.
          </p>
          {error ? (
            <p className="mt-4 text-label-sm text-error-red" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-end border-t border-border-subtle bg-surface-container-low px-gutter py-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleConfirmDelete()}
            disabled={isDeleting}
            className="ml-4 shadow-tier-1"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  )
}
