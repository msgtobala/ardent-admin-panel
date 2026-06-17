import { useCallback, useEffect, useState } from 'react'
import { getStudentDisplayName } from '@/lib/student-utils'
import type { Student } from '@/types/student'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

interface ResetStudentDeviceModalProps {
  isOpen: boolean
  student: Student | null
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function ResetStudentDeviceModal({
  isOpen,
  student,
  onClose,
  onConfirm,
}: ResetStudentDeviceModalProps) {
  const { showSnackbar } = useSnackbar()
  const [isResetting, setIsResetting] = useState(false)
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    if (!isOpen) {
      setIsResetting(false)
      setError(undefined)
    }
  }, [isOpen])

  const handleClose = useCallback(() => {
    if (isResetting) return
    onClose()
  }, [isResetting, onClose])

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

  async function handleConfirmReset() {
    setError(undefined)
    setIsResetting(true)

    try {
      await onConfirm()
      showSnackbar('Device reset successfully')
      onClose()
    } catch {
      const errorMessage = 'Failed to reset device. Please try again.'
      showSnackbar(errorMessage)
      setError(errorMessage)
      setIsResetting(false)
    }
  }

  if (!isOpen || !student) return null

  const displayName = getStudentDisplayName(student)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close reset device dialog"
        className="absolute inset-0 cursor-pointer bg-on-surface/40"
        onClick={handleClose}
        disabled={isResetting}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-student-device-modal-title"
        className="relative z-10 flex w-full max-w-[480px] flex-col overflow-hidden rounded-xl bg-surface-white shadow-tier-2"
      >
        <div className="flex items-start justify-between border-b border-border-subtle bg-surface px-gutter py-5">
          <div className="flex flex-col gap-2 pr-4">
            <h2 id="reset-student-device-modal-title" className="text-h3 text-on-surface">
              Reset Device
            </h2>
            <p className="text-body-md text-on-surface-variant">
              Clear the registered device for this student.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isResetting}
            aria-label="Close"
            className="cursor-pointer rounded-full p-2 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            <MaterialIcon name="close" size={20} className="text-on-surface" />
          </button>
        </div>

        <div className="px-gutter py-gutter">
          <p className="text-body-md text-on-surface">
            Are you sure you want to reset the device for{' '}
            <span className="font-semibold">{displayName}</span>? This will clear
            their registered device and allow them to sign in from a new device.
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
            disabled={isResetting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirmReset}
            disabled={isResetting}
            className="ml-4 shadow-tier-1"
          >
            {isResetting ? 'Resetting...' : 'Reset'}
          </Button>
        </div>
      </div>
    </div>
  )
}
