import { useEffect } from 'react'
import { MaterialIcon } from '../ui/MaterialIcon'

interface BannerImageModalProps {
  imageUrl: string
  title: string
  isOpen: boolean
  onClose: () => void
}

export function BannerImageModal({
  imageUrl,
  title,
  isOpen,
  onClose,
}: BannerImageModalProps) {
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

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-gutter"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close banner preview"
        className="absolute inset-0 cursor-pointer bg-on-surface/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="banner-image-modal-title"
        className="relative z-10 flex max-h-[90vh] max-w-4xl flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface-white shadow-tier-2"
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-gutter py-4">
          <h2
            id="banner-image-modal-title"
            className="truncate pr-4 text-card-title text-on-surface"
          >
            Banner preview
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-lg p-2 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <MaterialIcon name="close" size={24} className="text-on-surface" />
          </button>
        </div>
        <div className="flex items-center justify-center overflow-auto p-gutter">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="max-h-[70vh] w-auto max-w-full rounded-input object-contain"
            />
          ) : (
            <p className="text-body-md text-on-surface-variant">
              No banner image available.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
