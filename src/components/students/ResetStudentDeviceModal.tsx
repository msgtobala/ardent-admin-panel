import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { formatDeviceLoginTimestamp } from '@/lib/format-date'
import { fetchStudentDeviceDetails } from '@/lib/students'
import {
  getAuthenticationMethodDisplay,
  getStudentDisplayName,
} from '@/lib/student-utils'
import type { Student, StudentDeviceDetails } from '@/types/student'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

interface ResetStudentDeviceModalProps {
  isOpen: boolean
  student: Student | null
  onClose: () => void
  onConfirm: () => Promise<void>
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-label-sm font-medium text-on-surface-variant">
        {label}
      </span>
      <span className="whitespace-pre-wrap wrap-break-word text-body-md text-on-surface">
        {value}
      </span>
    </div>
  )
}

function DetailFieldSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="h-3 w-24 animate-pulse rounded bg-surface-container" />
      <div className="h-4 w-full animate-pulse rounded bg-surface-container" />
    </div>
  )
}

function DetailsSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface px-4 py-4">
      <h3 className="text-label-sm font-medium text-on-surface-variant">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  )
}

export function ResetStudentDeviceModal({
  isOpen,
  student,
  onClose,
  onConfirm,
}: ResetStudentDeviceModalProps) {
  const { showSnackbar } = useSnackbar()
  const [deviceDetails, setDeviceDetails] = useState<StudentDeviceDetails | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [loadError, setLoadError] = useState<string | undefined>()
  const [isResetting, setIsResetting] = useState(false)
  const [resetError, setResetError] = useState<string | undefined>()

  useEffect(() => {
    if (!isOpen || !student) return

    let cancelled = false
    const studentUid = student.uid

    async function loadDeviceDetails() {
      setIsLoadingDetails(true)
      setLoadError(undefined)
      setDeviceDetails(null)

      try {
        const details = await fetchStudentDeviceDetails(studentUid)
        if (cancelled) return
        setDeviceDetails(details)
        if (!details) {
          setLoadError('No registered device details were found for this student.')
        }
      } catch {
        if (cancelled) return
        setLoadError('Failed to load device details. Please try again.')
      } finally {
        if (!cancelled) {
          setIsLoadingDetails(false)
        }
      }
    }

    void loadDeviceDetails()

    return () => {
      cancelled = true
    }
  }, [isOpen, student])

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
    setResetError(undefined)
    setIsResetting(true)

    try {
      await onConfirm()
      showSnackbar('Device reset successfully')
      onClose()
    } catch {
      const errorMessage = 'Failed to reset device. Please try again.'
      showSnackbar(errorMessage)
      setResetError(errorMessage)
      setIsResetting(false)
    }
  }

  if (!isOpen || !student) return null

  const displayName = getStudentDisplayName(student)
  const authMethod = getAuthenticationMethodDisplay(student.authenticationMethod)
  const canReset = !isLoadingDetails && !loadError && deviceDetails != null && !isResetting

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
        className="relative z-10 flex max-h-[90vh] w-full max-w-[640px] flex-col overflow-hidden rounded-xl bg-surface-white shadow-tier-2"
      >
        <div className="flex items-start justify-between border-b border-border-subtle bg-surface px-gutter py-5">
          <div className="flex flex-col gap-2 pr-4">
            <h2 id="reset-student-device-modal-title" className="text-h3 text-on-surface">
              Reset registered device
            </h2>
            <p className="text-body-md text-on-surface-variant">
              Review this student&apos;s details below. Resetting clears their linked
              device so they can sign in from a new one.
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

        <div className="flex flex-col gap-5 overflow-y-auto px-gutter py-gutter">
          <DetailsSection title="Student details">
            <DetailField label="Name" value={displayName} />
            <DetailField label="Email" value={student.email || '—'} />
            <DetailField label="Phone" value={student.phone?.trim() || '—'} />
            <DetailField label="Authentication" value={authMethod.label} />
            <DetailField label="Plan" value={student.planName || '—'} />
            <DetailField label="UID" value={student.uid} />
          </DetailsSection>

          <DetailsSection title="Registered device">
            {isLoadingDetails ? (
              <>
                <DetailFieldSkeleton />
                <DetailFieldSkeleton />
                <DetailFieldSkeleton />
              </>
            ) : deviceDetails ? (
              <>
                <DetailField label="Device" value={deviceDetails.deviceName} />
                <DetailField label="Platform" value={deviceDetails.platform} />
                <DetailField
                  label="Last used"
                  value={formatDeviceLoginTimestamp(deviceDetails.loginTimestamp)}
                />
              </>
            ) : (
              <div className="sm:col-span-2">
                <p className="text-body-md text-on-surface-variant">—</p>
              </div>
            )}
          </DetailsSection>

          {loadError ? (
            <p className="text-label-sm text-error-red" role="alert">
              {loadError}
            </p>
          ) : null}
          {resetError ? (
            <p className="text-label-sm text-error-red" role="alert">
              {resetError}
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
            disabled={!canReset}
            className="ml-4 shadow-tier-1"
          >
            {isResetting ? 'Resetting...' : 'Reset device'}
          </Button>
        </div>
      </div>
    </div>
  )
}
