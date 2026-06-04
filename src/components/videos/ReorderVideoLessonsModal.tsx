import { useCallback, useEffect, useState } from 'react'
import {
  buildVideoLessonSortOrderUpdates,
  moveVideoLessonInList,
} from '@/lib/video-lesson-reorder'
import {
  fetchVideoLessons,
  updateVideoLessonsSortOrder,
} from '@/lib/video-lessons'
import type { VideoLesson } from '@/types/video-lesson'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

interface ReorderVideoLessonsModalProps {
  isOpen: boolean
  subjectId: string
  subjectName: string
  onClose: () => void
  onSaved: () => void
}

const reorderButtonClassName =
  'cursor-pointer rounded-lg p-2 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-40'

export function ReorderVideoLessonsModal({
  isOpen,
  subjectId,
  subjectName,
  onClose,
  onSaved,
}: ReorderVideoLessonsModalProps) {
  const { showSnackbar } = useSnackbar()
  const [orderedLessons, setOrderedLessons] = useState<VideoLesson[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadError, setLoadError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | undefined>()
  const [hasChanges, setHasChanges] = useState(false)

  const handleClose = useCallback(() => {
    if (isSubmitting) return
    onClose()
  }, [isSubmitting, onClose])

  useEffect(() => {
    if (!isOpen || !subjectId.trim()) return

    let isCancelled = false

    async function loadLessons() {
      setIsLoading(true)
      setLoadError(undefined)
      setFormError(undefined)
      setHasChanges(false)

      try {
        const lessons = await fetchVideoLessons(subjectId)
        if (!isCancelled) setOrderedLessons(lessons)
      } catch {
        if (!isCancelled) {
          setLoadError('Failed to load video lessons for reordering. Please try again.')
          setOrderedLessons([])
        }
      } finally {
        if (!isCancelled) setIsLoading(false)
      }
    }

    loadLessons()

    return () => {
      isCancelled = true
    }
  }, [isOpen, subjectId])

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

  function handleMoveLesson(index: number, direction: 'up' | 'down') {
    setOrderedLessons((prev) => moveVideoLessonInList(prev, index, direction))
    setHasChanges(true)
    setFormError(undefined)
  }

  async function handleSave() {
    if (!hasChanges || !subjectId.trim()) return

    setFormError(undefined)
    setIsSubmitting(true)

    try {
      await updateVideoLessonsSortOrder(
        subjectId,
        buildVideoLessonSortOrderUpdates(orderedLessons),
      )
      showSnackbar('Video lesson order saved successfully')
      onSaved()
      onClose()
    } catch {
      const errorMessage = 'Failed to save video lesson order. Please try again.'
      showSnackbar(errorMessage)
      setFormError(errorMessage)
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const subjectLabel = subjectName.trim() || subjectId

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close reorder video lessons dialog"
        className="absolute inset-0 cursor-pointer bg-on-surface/40"
        onClick={handleClose}
        disabled={isSubmitting}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reorder-video-lessons-modal-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-[672px] flex-col overflow-hidden rounded-xl bg-surface-white shadow-tier-2"
      >
        <div className="flex items-start justify-between border-b border-border-subtle bg-surface px-gutter py-5">
          <div className="flex flex-col gap-2 pr-4">
            <h2 id="reorder-video-lessons-modal-title" className="text-h3 text-on-surface">
              Edit Sort Order
            </h2>
            <p className="text-body-md text-on-surface-variant">
              Reorder lessons for {subjectLabel} using the arrows. Changes apply to
              the app display order.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close"
            className="cursor-pointer rounded-full p-2 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            <MaterialIcon name="close" size={20} className="text-on-surface" />
          </button>
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto px-gutter py-gutter">
          {isLoading ? (
            <p className="text-body-md text-on-surface-variant">Loading lessons...</p>
          ) : loadError ? (
            <p className="text-body-md text-error-red" role="alert">
              {loadError}
            </p>
          ) : orderedLessons.length === 0 ? (
            <p className="text-body-md text-on-surface-variant">
              No video lessons available to reorder for this subject.
            </p>
          ) : (
            orderedLessons.map((lesson, index) => {
              const canMoveUp = index > 0
              const canMoveDown = index < orderedLessons.length - 1
              const lessonLabel = lesson.lessonName.trim() || lesson.id

              return (
                <div
                  key={lesson.id}
                  className="flex items-center gap-3 rounded-xl border border-border-subtle bg-surface-white px-4 py-3"
                >
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      aria-label={`Move ${lessonLabel} up`}
                      disabled={!canMoveUp || isSubmitting}
                      onClick={() => handleMoveLesson(index, 'up')}
                      className={reorderButtonClassName}
                    >
                      <MaterialIcon
                        name="arrow_upward"
                        size={16}
                        className="text-on-surface-variant"
                      />
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${lessonLabel} down`}
                      disabled={!canMoveDown || isSubmitting}
                      onClick={() => handleMoveLesson(index, 'down')}
                      className={reorderButtonClassName}
                    >
                      <MaterialIcon
                        name="arrow_downward"
                        size={16}
                        className="text-on-surface-variant"
                      />
                    </button>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body-md font-medium text-text-black">
                      {lessonLabel}
                    </p>
                    {lesson.moduleName.trim() ? (
                      <p className="truncate text-caption text-on-surface-variant">
                        {lesson.moduleName}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-label-sm font-semibold text-on-surface-variant">
                    #{index + 1}
                  </span>
                </div>
              )
            })
          )}

          {formError ? (
            <p className="text-label-sm text-error-red" role="alert">
              {formError}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-end border-t border-border-subtle bg-surface-container-low px-gutter py-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Close
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting || isLoading || !hasChanges || !!loadError}
            className="ml-4 shadow-tier-1"
          >
            {isSubmitting ? 'Saving...' : 'Save order'}
          </Button>
        </div>
      </div>
    </div>
  )
}
