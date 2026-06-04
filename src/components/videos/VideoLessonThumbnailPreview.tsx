import { useEffect, useState } from 'react'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

interface VideoLessonThumbnailPreviewProps {
  thumbnailUrl: string
  lessonName: string
}

export function VideoLessonThumbnailPreview({
  thumbnailUrl,
  lessonName,
}: VideoLessonThumbnailPreviewProps) {
  const [hasImageError, setHasImageError] = useState(false)
  const trimmedUrl = thumbnailUrl.trim()
  const lessonLabel = lessonName.trim() || 'this lesson'
  const showImage = Boolean(trimmedUrl) && !hasImageError

  useEffect(() => {
    setHasImageError(false)
  }, [trimmedUrl])

  return (
    <section
      className="flex flex-col gap-3"
      aria-labelledby="video-lesson-thumbnail-heading"
    >
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-full bg-primary-fixed">
          <MaterialIcon name="image" size={18} className="text-primary-action" />
        </div>
        <h3 id="video-lesson-thumbnail-heading" className="text-label-sm font-semibold text-on-surface">
          Thumbnail
        </h3>
      </div>

      <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface-container-low shadow-tier-1">
        <div className="relative aspect-video w-full bg-on-surface/5">
          {showImage ? (
            <img
              src={trimmedUrl}
              alt={`Thumbnail preview for ${lessonLabel}`}
              className="size-full object-cover object-center"
              onError={() => setHasImageError(true)}
            />
          ) : (
            <div
              className="flex size-full flex-col items-center justify-center gap-2 px-6 py-10 text-center"
              role="status"
            >
              <div className="flex size-12 items-center justify-center rounded-full bg-surface-white shadow-tier-1">
                <MaterialIcon
                  name="hide_image"
                  size={24}
                  className="text-on-surface-variant"
                />
              </div>
              <p className="text-body-md font-medium text-on-surface">No thumbnail</p>
              <p className="max-w-xs text-caption text-on-surface-variant">
                {hasImageError
                  ? 'The thumbnail could not be loaded.'
                  : 'A thumbnail will appear here once one is available for this lesson.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
