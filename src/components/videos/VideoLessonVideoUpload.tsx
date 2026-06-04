import { useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from 'react'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

interface VideoLessonVideoUploadProps {
  lessonName: string
  hasExistingVideo: boolean
  disabled?: boolean
}

const COMING_SOON_MESSAGE = 'Video upload is coming soon'

export function VideoLessonVideoUpload({
  lessonName,
  hasExistingVideo,
  disabled = false,
}: VideoLessonVideoUploadProps) {
  const { showSnackbar } = useSnackbar()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  function handleComingSoon() {
    if (disabled) return
    showSnackbar(COMING_SOON_MESSAGE)
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    event.target.value = ''
    handleComingSoon()
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
    handleComingSoon()
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

  const lessonLabel = lessonName.trim() || 'this lesson'

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex flex-col gap-1">
        <span className="text-label-sm font-semibold text-on-surface">Upload Video</span>
        <p className="text-caption text-on-surface-variant">
          Replace the lesson video file. Upload will be enabled in a future update.
        </p>
      </div>

      {hasExistingVideo ? (
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
              This lesson already has a video. Choose a new file below to replace it.
            </p>
          </div>
        </div>
      ) : null}

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={`Upload video for ${lessonLabel}`}
        aria-describedby="video-lesson-upload-hint"
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
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
          className="sr-only"
          disabled={disabled}
          onChange={handleInputChange}
        />

        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-primary-fixed">
          <MaterialIcon name="cloud_upload" size={24} className="text-primary-action" />
        </div>
        <p className="text-body-md font-semibold text-on-surface">
          Click to upload or drag and drop
        </p>
        <p id="video-lesson-upload-hint" className="mt-1 text-caption text-on-surface-variant">
          MP4, MOV, or WebM (max. 500MB) — coming soon
        </p>
      </div>
    </div>
  )
}
