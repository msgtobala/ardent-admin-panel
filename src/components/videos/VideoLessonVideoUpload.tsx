import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from 'react'
import { uploadVideoLessonFile, validateVideoLessonFile } from '@/lib/mux-video-upload'
import type {
  ExternalVideoUploadState,
  VideoLessonUploadPhase,
} from '@/types/mux-video-upload'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { CircularLoader } from '@/components/ui/CircularLoader'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

interface VideoLessonVideoUploadProps {
  subjectId: string
  lessonId: string
  lessonName: string
  hasExistingVideo: boolean
  previousMuxAssetId?: string
  disabled?: boolean
  pendingFile?: File | null
  onPendingFileChange?: (file: File | null) => void
  onUploadingChange?: (isUploading: boolean) => void
  onUploadComplete?: () => void
  /** When the parent runs upload (add-lesson flow), keeps progress UI in sync. */
  externalUpload?: ExternalVideoUploadState | null
}

export function VideoLessonVideoUpload({
  subjectId,
  lessonId,
  lessonName,
  hasExistingVideo,
  previousMuxAssetId,
  disabled = false,
  pendingFile = null,
  onPendingFileChange,
  onUploadingChange,
  onUploadComplete,
  externalUpload = null,
}: VideoLessonVideoUploadProps) {
  const { showSnackbar } = useSnackbar()
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadAbortRef = useRef(false)
  const [isDragging, setIsDragging] = useState(false)
  const [localError, setLocalError] = useState<string | undefined>()
  const [phase, setPhase] = useState<VideoLessonUploadPhase>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFileName, setSelectedFileName] = useState<string | undefined>()

  const hasLessonId = Boolean(lessonId.trim())
  const canDeferSelection = Boolean(onPendingFileChange) && !hasLessonId
  const canUploadNow = Boolean(subjectId.trim() && lessonId.trim())
  const displayPhase: VideoLessonUploadPhase = externalUpload?.phase ?? phase
  const displayProgress = externalUpload?.progress ?? uploadProgress
  const displayFileName =
    externalUpload?.fileName ?? selectedFileName ?? pendingFile?.name
  const isBusy =
    displayPhase === 'preparing' ||
    displayPhase === 'uploading' ||
    displayPhase === 'processing'
  const canPickFile = Boolean(subjectId.trim()) && (canUploadNow || canDeferSelection)
  const isInteractionDisabled = disabled || !canPickFile || isBusy

  useEffect(() => {
    onUploadingChange?.(isBusy)
  }, [isBusy, onUploadingChange])

  useEffect(() => {
    if (externalUpload) return

    uploadAbortRef.current = false
    setPhase('idle')
    setUploadProgress(0)
    setLocalError(undefined)
    setSelectedFileName(undefined)
  }, [subjectId, lessonId, externalUpload])

  useEffect(() => {
    if (!pendingFile || phase === 'selected') {
      setSelectedFileName(pendingFile?.name)
      if (pendingFile && !hasLessonId) {
        setPhase('selected')
      }
    }
  }, [pendingFile, hasLessonId, phase])

  const handleUploadFile = useCallback(
    async (file: File) => {
      if (!canUploadNow || disabled || isBusy) return

      const validationError = validateVideoLessonFile(file)
      if (validationError) {
        setLocalError(validationError)
        setPhase('error')
        return
      }

      setLocalError(undefined)
      setSelectedFileName(file.name)
      setUploadProgress(0)
      setPhase('preparing')

      try {
        setPhase('uploading')
        await uploadVideoLessonFile({
          subjectId: subjectId.trim(),
          lessonId: lessonId.trim(),
          previousMuxAssetId,
          file,
          onProgress: (percent) => {
            if (uploadAbortRef.current) return
            setUploadProgress(percent)
          },
          onUploadComplete: () => {
            if (uploadAbortRef.current) return
            setPhase('processing')
          },
        })

        if (uploadAbortRef.current) return

        setPhase('success')
        setUploadProgress(100)
        onPendingFileChange?.(null)
        showSnackbar(
          previousMuxAssetId?.trim()
            ? 'Video replaced successfully'
            : 'Video uploaded successfully',
        )
        onUploadComplete?.()
      } catch (uploadError) {
        if (uploadAbortRef.current) return

        const message =
          uploadError instanceof Error
            ? uploadError.message
            : 'Video upload failed. Please try again.'
        setLocalError(message)
        setPhase('error')
      }
    },
    [
      canUploadNow,
      disabled,
      isBusy,
      lessonId,
      onPendingFileChange,
      onUploadComplete,
      showSnackbar,
      subjectId,
      previousMuxAssetId,
    ],
  )

  function handleFileSelected(selectedFile: File | null) {
    if (!selectedFile || isInteractionDisabled) return

    const validationError = validateVideoLessonFile(selectedFile)
    if (validationError) {
      setLocalError(validationError)
      setPhase('error')
      return
    }

    setLocalError(undefined)
    setSelectedFileName(selectedFile.name)

    if (canUploadNow) {
      void handleUploadFile(selectedFile)
      return
    }

    if (canDeferSelection) {
      onPendingFileChange?.(selectedFile)
      setPhase('selected')
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null
    handleFileSelected(selectedFile)
    event.target.value = ''
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    if (isInteractionDisabled) return
    setIsDragging(true)
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    if (isInteractionDisabled) return

    const droppedFile = event.dataTransfer.files?.[0] ?? null
    handleFileSelected(droppedFile)
  }

  function handleClick() {
    if (isInteractionDisabled) return
    inputRef.current?.click()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (isInteractionDisabled) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      inputRef.current?.click()
    }
  }

  function handleClearPendingFile() {
    if (isBusy || disabled) return
    onPendingFileChange?.(null)
    setSelectedFileName(undefined)
    setLocalError(undefined)
    setPhase('idle')
  }

  const lessonLabel = lessonName.trim() || 'this lesson'
  const displayError = externalUpload?.errorMessage ?? localError

  let statusMessage = 'Click to upload or drag and drop'
  if (displayPhase === 'selected') {
    statusMessage = displayFileName
      ? `${displayFileName} — uploads when you save`
      : 'Video selected — uploads when you save'
  } else if (!canPickFile) {
    statusMessage = 'Select a subject before choosing a video'
  } else if (displayPhase === 'preparing') {
    statusMessage = 'Preparing upload...'
  } else if (displayPhase === 'uploading') {
    statusMessage = `Uploading ${displayProgress}%`
  } else if (displayPhase === 'processing') {
    statusMessage = 'Processing video on Mux...'
  } else if (displayPhase === 'success') {
    statusMessage = 'Video is ready for playback'
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex flex-col gap-1">
        <span className="text-label-sm font-semibold text-on-surface">Upload Video</span>
        <p className="text-caption text-on-surface-variant">
          {canDeferSelection && !hasLessonId
            ? 'Choose a video file now. It uploads when you click Add Video.'
            : previousMuxAssetId?.trim()
              ? 'Replace the lesson video. The previous Mux asset is removed after the new video is ready.'
              : 'Upload the first video for this lesson. Mux will link it when processing finishes.'}
        </p>
      </div>

      {previousMuxAssetId?.trim() && hasExistingVideo && phase !== 'success' ? (
        <div
          className="flex items-center gap-3 rounded-input border border-border-subtle bg-surface-container-low px-4 py-3"
          role="status"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-fixed">
            <MaterialIcon name="videocam" size={20} className="text-primary-action" />
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="text-body-md font-medium text-on-surface">Video linked</p>
            <p className="text-caption text-on-surface-variant">
              Choose a new file below to replace the current video.
            </p>
          </div>
        </div>
      ) : null}

      {displayPhase === 'selected' && !externalUpload ? (
        <div
          className="flex items-center justify-between gap-3 rounded-input border border-border-subtle bg-surface-container-low px-4 py-3"
          role="status"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-fixed">
              <MaterialIcon name="movie" size={20} className="text-primary-action" />
            </div>
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="text-body-md font-medium text-on-surface">Video ready to upload</p>
              <p className="truncate text-caption text-on-surface-variant">
                {displayFileName ?? 'Selected file'} for {lessonLabel}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClearPendingFile}
            disabled={disabled || isBusy}
            aria-label="Remove selected video file"
            className="shrink-0 cursor-pointer rounded-full p-2 text-on-surface-variant transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            <MaterialIcon name="close" size={18} />
          </button>
        </div>
      ) : null}

      {displayPhase === 'success' ? (
        <div
          className="flex items-center gap-3 rounded-input border border-border-subtle bg-surface-container-low px-4 py-3"
          role="status"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-fixed">
            <MaterialIcon name="check_circle" size={20} className="text-primary-action" />
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="text-body-md font-medium text-on-surface">Upload complete</p>
            <p className="text-caption text-on-surface-variant">
              {displayFileName
                ? `${displayFileName} is linked to ${lessonLabel}.`
                : `Video is linked to ${lessonLabel}.`}
            </p>
          </div>
        </div>
      ) : null}

      {displayPhase !== 'success' ? (
        <div
          role="button"
          tabIndex={isInteractionDisabled ? -1 : 0}
          aria-label={`Upload video for ${lessonLabel}`}
          aria-describedby="video-lesson-upload-hint"
          aria-busy={isBusy}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={[
            'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition',
            'border-outline-variant bg-surface-container-low',
            isDragging ? 'border-primary-action bg-row-hover' : '',
            isInteractionDisabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-row-hover',
            displayError && displayPhase === 'error' ? 'border-error-red' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
            className="sr-only"
            disabled={isInteractionDisabled}
            onChange={handleInputChange}
          />

          {isBusy ? (
            <CircularLoader size="md" label={statusMessage} className="mb-3" />
          ) : (
            <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-primary-fixed">
              <MaterialIcon name="cloud_upload" size={24} className="text-primary-action" />
            </div>
          )}

          <p className="text-body-md font-semibold text-on-surface">{statusMessage}</p>
          <p id="video-lesson-upload-hint" className="mt-1 text-caption text-on-surface-variant">
            MP4, MOV, or WebM (max. 500MB)
          </p>

          {displayPhase === 'uploading' ? (
            <div className="mt-4 h-2 w-full max-w-xs overflow-hidden rounded-full bg-surface-white">
              <div
                className="h-full rounded-full bg-primary-action transition-all duration-200"
                style={{ width: `${displayProgress}%` }}
                role="progressbar"
                aria-valuenow={displayProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Upload progress"
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {displayError ? (
        <p className="text-label-sm text-error-red" role="alert">
          {displayError}
        </p>
      ) : null}
    </div>
  )
}
