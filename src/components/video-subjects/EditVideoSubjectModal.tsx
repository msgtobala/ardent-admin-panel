import { useCallback, useEffect, useState } from 'react'
import { uploadVideoSubjectIcon } from '@/lib/video-subject-icon-storage'
import { updateVideoSubject } from '@/lib/video-subjects'
import type { VideoSubject } from '@/types/video-subject'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { TextField } from '@/components/ui/TextField'
import { VideoSubjectIconUpload } from './VideoSubjectIconUpload'

interface EditVideoSubjectModalProps {
  isOpen: boolean
  subject: VideoSubject | null
  onClose: () => void
  onSaved: () => void
}

const textareaClasses =
  'min-h-[100px] w-full resize-y rounded-input border border-border-subtle bg-surface-white px-[13px] py-[10px] text-body-md text-on-surface shadow-tier-1 placeholder:text-on-surface-variant focus:border-primary-action focus:outline-none focus:ring-2 focus:ring-focus-ring disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-surface-container disabled:text-on-surface-variant disabled:opacity-70 disabled:shadow-none'

function revokePreviewUrlIfBlob(url: string | null) {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

function getInitialFormState(subject: VideoSubject | null) {
  return {
    subjectName: subject?.subjectName ?? '',
    description: subject?.description ?? '',
    file: null as File | null,
    previewUrl: subject?.icon ?? null,
  }
}

export function EditVideoSubjectModal({
  isOpen,
  subject,
  onClose,
  onSaved,
}: EditVideoSubjectModalProps) {
  const { showSnackbar } = useSnackbar()
  const [subjectName, setSubjectName] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [subjectNameError, setSubjectNameError] = useState<string | undefined>()
  const [iconError, setIconError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleClose = useCallback(() => {
    if (isSubmitting) return
    onClose()
  }, [isSubmitting, onClose])

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

  useEffect(() => {
    if (!isOpen || !subject) {
      setPreviewUrl((prev) => {
        revokePreviewUrlIfBlob(prev)
        return null
      })
      setSubjectName('')
      setDescription('')
      setFile(null)
      setSubjectNameError(undefined)
      setIconError(undefined)
      setFormError(undefined)
      setIsSubmitting(false)
      return
    }

    const initial = getInitialFormState(subject)
    setPreviewUrl((prev) => {
      revokePreviewUrlIfBlob(prev)
      return initial.previewUrl
    })
    setSubjectName(initial.subjectName)
    setDescription(initial.description)
    setFile(initial.file)
    setSubjectNameError(undefined)
    setIconError(undefined)
    setFormError(undefined)
    setIsSubmitting(false)
  }, [isOpen, subject])

  function validate(): boolean {
    let valid = true

    if (!subjectName.trim()) {
      setSubjectNameError('Subject name is required')
      valid = false
    } else {
      setSubjectNameError(undefined)
    }

    const hasExistingIcon = Boolean(subject?.icon?.trim())
    if (!file && !hasExistingIcon) {
      setIconError('Subject icon is required')
      valid = false
    } else {
      setIconError(undefined)
    }

    return valid
  }

  function handleIconFileChange(
    selectedFile: File | null,
    selectedPreviewUrl: string | null,
  ) {
    setPreviewUrl((prev) => {
      if (prev && prev !== selectedPreviewUrl) revokePreviewUrlIfBlob(prev)
      return selectedPreviewUrl
    })
    setFile(selectedFile)

    if (selectedFile) {
      setIconError(undefined)
    }
  }

  async function handleSave() {
    if (!subject || !validate()) return

    setFormError(undefined)
    setIsSubmitting(true)

    try {
      const iconUrl = file
        ? await uploadVideoSubjectIcon(file, subject.id)
        : subject.icon

      await updateVideoSubject(subject.id, {
        icon: iconUrl,
        subjectName,
        description,
      })

      showSnackbar('Video subject updated successfully')
      onSaved()
      onClose()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to update video subject. Please try again.'
      showSnackbar(message)
      setFormError(message)
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !subject) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close edit video subject dialog"
        className="absolute inset-0 cursor-pointer bg-on-surface/40"
        onClick={handleClose}
        disabled={isSubmitting}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-video-subject-modal-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-[672px] flex-col overflow-hidden rounded-xl bg-surface-white shadow-tier-2"
      >
        <div className="flex items-start justify-between border-b border-border-subtle bg-surface px-gutter py-5">
          <div className="flex flex-col gap-2 pr-4">
            <h2 id="edit-video-subject-modal-title" className="text-h3 text-on-surface">
              Edit Video Subject
            </h2>
            <p className="text-body-md text-on-surface-variant">
              Update the icon, subject name, and description
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

        <form
          className="flex flex-col gap-gutter overflow-y-auto px-gutter py-gutter"
          onSubmit={(event) => {
            event.preventDefault()
            handleSave()
          }}
          noValidate
        >
          <VideoSubjectIconUpload
            subjectName={subjectName || subject.subjectName}
            file={file}
            previewUrl={previewUrl}
            error={iconError}
            disabled={isSubmitting}
            onFileChange={handleIconFileChange}
          />

          <TextField
            id="video-subject-name"
            label="Subject Name"
            value={subjectName}
            disabled={isSubmitting}
            required
            error={subjectNameError}
            onChange={(event) => {
              setSubjectName(event.target.value)
              if (subjectNameError) setSubjectNameError(undefined)
            }}
          />

          <div className="flex w-full flex-col gap-1">
            <label htmlFor="video-subject-description" className="text-label-sm text-on-surface">
              Description
            </label>
            <textarea
              id="video-subject-description"
              value={description}
              disabled={isSubmitting}
              placeholder="Enter subject description"
              className={textareaClasses}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          {formError ? (
            <p className="text-label-sm text-error-red" role="alert">
              {formError}
            </p>
          ) : null}
        </form>

        <div className="flex items-center justify-end border-t border-border-subtle bg-surface-container-low px-gutter py-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="ml-4 shadow-tier-1"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
