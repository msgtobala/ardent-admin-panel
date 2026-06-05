import { useCallback, useEffect } from 'react'

import type { QbankChapter } from '@/types/qbank-chapter'
import { StatusBadge } from '@/components/banners/StatusBadge'
import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

interface ViewQbankChapterModalProps {
  isOpen: boolean
  chapter: QbankChapter | null
  onClose: () => void
}

interface DetailRowProps {
  label: string
  value: string
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-label-sm text-on-surface-variant">{label}</span>
      <p className="min-w-0 whitespace-pre-wrap text-body-md !text-black">
        {value || '—'}
      </p>
    </div>
  )
}

export function ViewQbankChapterModal({
  isOpen,
  chapter,
  onClose,
}: ViewQbankChapterModalProps) {
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

  if (!isOpen || !chapter) return null

  const chapterLabel = chapter.chapterName.trim() || chapter.id

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close chapter details dialog"
        className="absolute inset-0 cursor-pointer bg-on-surface/40"
        onClick={handleClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="view-qbank-chapter-modal-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-[720px] flex-col overflow-hidden rounded-xl bg-surface-white shadow-tier-2"
      >
        <div className="flex items-start justify-between border-b border-border-subtle bg-surface px-gutter py-5">
          <div className="flex flex-col gap-2 pr-4">
            <h2 id="view-qbank-chapter-modal-title" className="text-h3 text-on-surface">
              Chapter Details
            </h2>
            <p className="text-body-md text-on-surface-variant">
              Full qbank chapter details for {chapterLabel}
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
          <DetailRow label="Chapter Name" value={chapter.chapterName} />
          <DetailRow label="Description" value={chapter.description} />
          {chapter.imageUrl ? (
            <div className="flex flex-col gap-1">
              <span className="text-label-sm text-on-surface-variant">Image</span>
              <img
                src={chapter.imageUrl}
                alt={`${chapterLabel} illustration`}
                className="max-h-64 w-auto max-w-full rounded-input border border-border-subtle object-contain"
              />
            </div>
          ) : (
            <DetailRow label="Image" value="" />
          )}
          <div className="flex flex-col gap-1">
            <span className="text-label-sm text-on-surface-variant">Active</span>
            <div>
              <StatusBadge isActive={chapter.isActive} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-label-sm text-on-surface-variant">Free</span>
            <div>
              <StatusBadge isActive={chapter.isFree} />
            </div>
          </div>
          <DetailRow label="Module Name" value={chapter.moduleName} />
          <DetailRow label="Questions Count" value={String(chapter.questionsCount)} />
          <DetailRow label="Sort Order" value={String(chapter.sortOrder)} />
          <DetailRow
            label="Students Completed"
            value={String(chapter.studentsCompleted)}
          />
          <DetailRow
            label="Students Progressing"
            value={String(chapter.studentsProgressing)}
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
