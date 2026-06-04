import { MUX_ASSET_STATUS, type VideoLesson } from '@/types/video-lesson'
import { lessonHasMuxVideo } from '@/lib/video-lesson-thumbnail'
import { CircularLoader } from '@/components/ui/CircularLoader'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

interface VideoLessonMuxStatusProps {
  lesson: VideoLesson
  compact?: boolean
}

function resolveStatusLabel(lesson: VideoLesson): string {
  if (lesson.muxAssetStatus === MUX_ASSET_STATUS.processing) {
    return 'Video processing…'
  }

  if (lesson.muxAssetStatus === MUX_ASSET_STATUS.errored) {
    return lesson.muxAssetError?.trim() || 'Video processing failed'
  }

  if (lessonHasMuxVideo(lesson)) {
    return 'Video ready'
  }

  if (lesson.muxAssetStatus === MUX_ASSET_STATUS.idle) {
    return 'No video uploaded'
  }

  return 'No video uploaded'
}

export function VideoLessonMuxStatus({ lesson, compact = false }: VideoLessonMuxStatusProps) {
  const isProcessing = lesson.muxAssetStatus === MUX_ASSET_STATUS.processing
  const isErrored = lesson.muxAssetStatus === MUX_ASSET_STATUS.errored
  const isReady = lessonHasMuxVideo(lesson)
  const statusLabel = resolveStatusLabel(lesson)

  if (compact) {
    return (
      <div
        className="flex max-w-[280px] items-center gap-2"
        role="status"
        aria-label={`Video status: ${statusLabel}`}
      >
        {isProcessing ? (
          <CircularLoader size="sm" label="Video processing" />
        ) : null}
        {!isProcessing && isReady ? (
          <MaterialIcon name="check_circle" size={18} className="shrink-0 text-primary-action" />
        ) : null}
        {!isProcessing && isErrored ? (
          <MaterialIcon name="error" size={18} className="shrink-0 text-error-red" />
        ) : null}
        {!isProcessing && !isReady && !isErrored ? (
          <MaterialIcon name="videocam_off" size={18} className="shrink-0 text-on-surface-variant" />
        ) : null}
        <span
          className={[
            'text-label-sm',
            isErrored ? 'text-error-red' : 'text-on-surface-variant',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {statusLabel}
        </span>
      </div>
    )
  }

  return (
    <div
      className="flex items-center gap-3 rounded-input border border-border-subtle bg-surface-container-low px-4 py-3"
      role="status"
      aria-label={`Video status: ${statusLabel}`}
    >
      {isProcessing ? (
        <CircularLoader size="sm" label="Video processing on Mux" />
      ) : (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-fixed">
          <MaterialIcon
            name={isErrored ? 'error' : isReady ? 'check_circle' : 'videocam_off'}
            size={20}
            className={isErrored ? 'text-error-red' : 'text-primary-action'}
          />
        </div>
      )}
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-body-md font-medium text-on-surface">
          {isProcessing ? 'Processing video' : isReady ? 'Video ready' : isErrored ? 'Processing failed' : 'No video'}
        </p>
        <p
          className={[
            'text-caption',
            isErrored ? 'text-error-red' : 'text-on-surface-variant',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {statusLabel}
        </p>
      </div>
    </div>
  )
}
