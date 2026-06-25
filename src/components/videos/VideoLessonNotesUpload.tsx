import { useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from 'react'
import {
  getVideoLessonNotesDownloadUrl,
  validateVideoLessonNotesFile,
} from '@/lib/video-lesson-notes-storage'
import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

interface VideoLessonNotesUploadProps {
  file: File | null
  existingNotesPath: string | null
  notesRemoved: boolean
  error?: string
  disabled?: boolean
  deferUploadUntilSave?: boolean
  onFileChange: (file: File | null) => void
  onRemove?: () => void
  onUndoRemove?: () => void
}

function getNotesFileName(storagePath: string): string {
  const segments = storagePath.split('/')
  return segments[segments.length - 1] || 'notes.pdf'
}

export function VideoLessonNotesUpload({
  file,
  existingNotesPath,
  notesRemoved,
  error,
  disabled = false,
  deferUploadUntilSave = false,
  onFileChange,
  onRemove,
  onUndoRemove,
}: VideoLessonNotesUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [localError, setLocalError] = useState<string | undefined>()
  const [isViewingPdf, setIsViewingPdf] = useState(false)
  const [viewError, setViewError] = useState<string | undefined>()

  const displayError = error ?? localError ?? viewError
  const hasExistingNotes = Boolean(existingNotesPath?.trim()) && !notesRemoved
  const showAttachedState = hasExistingNotes && !file
  const notesFileName = existingNotesPath ? getNotesFileName(existingNotesPath) : 'notes.pdf'

  function handleFileSelected(selectedFile: File | null) {
    if (!selectedFile) {
      setLocalError(undefined)
      setViewError(undefined)
      onFileChange(null)
      return
    }

    const validationError = validateVideoLessonNotesFile(selectedFile)
    if (validationError) {
      setLocalError(validationError)
      onFileChange(null)
      return
    }

    setLocalError(undefined)
    setViewError(undefined)
    onFileChange(selectedFile)
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null
    handleFileSelected(selectedFile)
    event.target.value = ''
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    if (disabled) return
    setIsDragging(true)
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    if (disabled) return

    const droppedFile = event.dataTransfer.files?.[0] ?? null
    handleFileSelected(droppedFile)
  }

  function handleClick() {
    if (disabled) return
    inputRef.current?.click()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      inputRef.current?.click()
    }
  }

  async function handleViewPdf() {
    if (!existingNotesPath?.trim() || disabled || isViewingPdf) return

    setViewError(undefined)
    setIsViewingPdf(true)

    try {
      const downloadUrl = await getVideoLessonNotesDownloadUrl(existingNotesPath)
      window.open(downloadUrl, '_blank', 'noopener,noreferrer')
    } catch (viewPdfError) {
      const message =
        viewPdfError instanceof Error
          ? viewPdfError.message
          : 'Failed to open notes PDF. Please try again.'
      setViewError(message)
    } finally {
      setIsViewingPdf(false)
    }
  }

  const statusMessage = file
    ? deferUploadUntilSave
      ? `${file.name} — uploads when you save`
      : file.name
    : showAttachedState
      ? 'Notes attached'
      : 'Click to upload or drag and drop'

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex flex-col gap-1">
        <span className="text-label-sm font-semibold text-on-surface">Lesson Notes (PDF)</span>
        <p className="text-caption text-on-surface-variant">
          {deferUploadUntilSave
            ? 'Choose a PDF now. It uploads when you save the lesson.'
            : 'Upload PDF notes for this lesson. Files are stored privately.'}
        </p>
      </div>

      {notesRemoved ? (
        <div
          className="flex items-center justify-between gap-3 rounded-input border border-border-subtle bg-surface-container-low px-4 py-3"
          role="status"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-error-container">
              <MaterialIcon name="delete" size={20} className="text-error-red" />
            </div>
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="text-body-md font-medium text-on-surface">Notes marked for removal</p>
              <p className="text-caption text-on-surface-variant">
                The PDF will be deleted from storage when you save.
              </p>
            </div>
          </div>
          {onUndoRemove ? (
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={onUndoRemove}
              className="shrink-0 px-3 py-2 text-body-md"
            >
              Undo
            </Button>
          ) : null}
        </div>
      ) : null}

      {showAttachedState ? (
        <div
          className="flex items-center justify-between gap-3 rounded-input border border-border-subtle bg-surface-container-low px-4 py-3"
          role="status"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-fixed">
              <MaterialIcon name="description" size={20} className="text-primary-action" />
            </div>
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="text-body-md font-medium text-on-surface">Notes attached</p>
              <p className="truncate text-caption text-on-surface-variant">{notesFileName}</p>
              <p className="truncate text-caption text-on-surface-variant">{existingNotesPath}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={disabled || isViewingPdf}
              onClick={() => {
                void handleViewPdf()
              }}
              className="gap-1.5 px-3 py-2 text-body-md"
              aria-label="View lesson notes PDF"
            >
              <MaterialIcon
                name={isViewingPdf ? 'hourglass_top' : 'open_in_new'}
                size={16}
              />
              {isViewingPdf ? 'Opening...' : 'View PDF'}
            </Button>
            {onRemove ? (
              <Button
                type="button"
                variant="outline"
                disabled={disabled}
                onClick={onRemove}
                className="gap-1.5 px-3 py-2 text-body-md text-error-red"
                aria-label="Remove lesson notes"
              >
                <MaterialIcon name="delete" size={16} />
                Remove notes
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload lesson notes PDF"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition',
          'border-outline-variant bg-surface-container-low',
          isDragging ? 'border-primary-action bg-row-hover' : '',
          disabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-row-hover',
          displayError && !viewError ? 'border-error-red' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          disabled={disabled}
          onChange={handleInputChange}
        />

        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-primary-fixed">
          <MaterialIcon name="cloud_upload" size={24} className="text-primary-action" />
        </div>

        <p className="text-body-md font-semibold text-on-surface">{statusMessage}</p>
        <p className="mt-1 text-caption text-on-surface-variant">PDF only (Max. 25MB)</p>
      </div>

      {file && onRemove ? (
        <button
          type="button"
          disabled={disabled}
          aria-label="Remove selected notes PDF"
          onClick={onRemove}
          className="self-start cursor-pointer rounded-lg px-2 py-1.5 text-label-sm text-on-surface-variant transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="inline-flex items-center gap-1.5">
            <MaterialIcon name="delete" size={16} />
            Remove PDF
          </span>
        </button>
      ) : null}

      {displayError ? (
        <p className="text-label-sm text-error-red" role="alert">
          {displayError}
        </p>
      ) : null}
    </div>
  )
}
