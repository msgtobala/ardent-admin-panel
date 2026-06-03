import { useCallback, useEffect, useState } from 'react'
import type { Faculty } from '@/types/faculty'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

interface DeleteFacultyModalProps {
  isOpen: boolean
  faculty: Faculty | null
  onClose: () => void
  onConfirm: () => Promise<void>
}

function getFacultyDisplayName(faculty: Faculty): string {
  if (faculty.displayName.trim()) return faculty.displayName
  return [faculty.firstName, faculty.lastName].filter(Boolean).join(' ') || 'this faculty'
}

export function DeleteFacultyModal({
  isOpen,
  faculty,
  onClose,
  onConfirm,
}: DeleteFacultyModalProps) {
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
      showSnackbar('Faculty deleted successfully')
      onClose()
    } catch {
      const errorMessage = 'Failed to delete faculty. Please try again.'
      showSnackbar(errorMessage)
      setError(errorMessage)
      setIsDeleting(false)
    }
  }

  if (!isOpen || !faculty) return null

  const displayName = getFacultyDisplayName(faculty)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close delete faculty dialog"
        className="absolute inset-0 cursor-pointer bg-on-surface/40"
        onClick={handleClose}
        disabled={isDeleting}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-faculty-modal-title"
        className="relative z-10 flex w-full max-w-[480px] flex-col overflow-hidden rounded-xl bg-surface-white shadow-tier-2"
      >
        <div className="flex items-start justify-between border-b border-border-subtle bg-surface px-gutter py-5">
          <div className="flex flex-col gap-2 pr-4">
            <h2 id="delete-faculty-modal-title" className="text-h3 text-on-surface">
              Delete Faculty
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
            Are you sure you want to delete{' '}
            <span className="font-semibold">{displayName}</span>? This will
            permanently remove their faculty profile.
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
            onClick={handleConfirmDelete}
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
