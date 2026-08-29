import { useCallback, useEffect } from 'react'
import type { SelectedGrandTestQuestion } from '@/types/grand-test'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { GrandTestCustomQuestionDetailInline } from './GrandTestCustomQuestionDetailInline'
import { GrandTestQuestionDetailPanel } from './GrandTestQuestionDetailPanel'

interface GrandTestQuestionDetailModalProps {
  isOpen: boolean
  question: SelectedGrandTestQuestion | null
  onClose: () => void
}

function isCustomQuestion(question: SelectedGrandTestQuestion): boolean {
  return question.source === 'custom' || question.isCustom === true
}

export function GrandTestQuestionDetailModal({
  isOpen,
  question,
  onClose,
}: GrandTestQuestionDetailModalProps) {
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
        aria-labelledby="grand-test-question-detail-modal-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-surface-white shadow-tier-2"
      >
        <div className="flex items-start justify-between border-b border-border-subtle bg-surface px-gutter py-5">
          <div className="flex min-w-0 flex-col gap-1 pr-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="grand-test-question-detail-modal-title"
                className="text-h3 text-on-surface"
              >
                {question.questionRefId}
              </h2>
              {isCustomQuestion(question) ? (
                <span className="inline-flex rounded-full bg-info-bg px-2 py-0.5 text-caption font-medium text-on-secondary-fixed">
                  Custom
                </span>
              ) : null}
            </div>
            <p className="text-body-md text-on-surface-variant">
              {question.subjectName} · {question.chapterName}
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

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-gutter py-gutter">
          <p className="whitespace-pre-wrap text-body-md text-on-surface">
            {question.questionText}
          </p>

          {question.customDraft ? (
            <GrandTestCustomQuestionDetailInline draft={question.customDraft} />
          ) : (
            <div className="border-t border-border-subtle pt-4">
              <GrandTestQuestionDetailPanel
                subjectRefId={question.subjectRefId}
                chapterRefId={question.chapterRefId}
                questionRefId={question.questionRefId}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
