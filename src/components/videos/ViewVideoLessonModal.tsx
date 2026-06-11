import { useEffect } from 'react'
import type { VideoLessonPreviewItem } from '@/types/video-lesson-preview'
import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { VideoLessonPlayer } from '@/components/videos/VideoLessonPlayer'

interface ViewVideoLessonModalProps {
  isOpen: boolean
  lesson: VideoLessonPreviewItem | null
  subtitle?: string
  onClose: () => void
}

export function ViewVideoLessonModal({
  isOpen,
  lesson,
  subtitle = 'Video preview',
  onClose,
}: ViewVideoLessonModalProps) {
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen || !lesson) return null

  const lessonLabel = lesson.lessonName.trim() || lesson.lessonRefId

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close video preview"
        className="absolute inset-0 cursor-pointer bg-on-surface/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-lesson-modal-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-[720px] flex-col overflow-hidden rounded-xl bg-surface-white shadow-tier-2"
      >
        <div className="flex items-start justify-between border-b border-border-subtle bg-surface px-gutter py-5">
          <div className="flex min-w-0 flex-col gap-2 pr-4">
            <h2 id="video-lesson-modal-title" className="text-h3 text-on-surface">
              {lessonLabel}
            </h2>
            <p className="text-body-md text-on-surface-variant">
              {lesson.subjectName.trim() || subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-full p-2 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <MaterialIcon name="close" size={20} className="text-on-surface" />
          </button>
        </div>

        <div className="overflow-y-auto px-gutter py-gutter">
          <VideoLessonPlayer
            key={`${lesson.subjectRefId}-${lesson.lessonRefId}`}
            subjectId={lesson.subjectRefId}
            lessonId={lesson.lessonRefId}
            lessonLabel={lessonLabel}
            autoLoad
          />
        </div>

        <div className="flex items-center justify-end border-t border-border-subtle bg-surface-container-low px-gutter py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
