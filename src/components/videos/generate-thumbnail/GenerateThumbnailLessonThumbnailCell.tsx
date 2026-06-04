import { useEffect, useState } from 'react'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

interface GenerateThumbnailLessonThumbnailCellProps {
  thumbnailUrl: string
  lessonLabel: string
}

export function GenerateThumbnailLessonThumbnailCell({
  thumbnailUrl,
  lessonLabel,
}: GenerateThumbnailLessonThumbnailCellProps) {
  const [hasImageError, setHasImageError] = useState(false)
  const trimmedUrl = thumbnailUrl.trim()
  const showImage = Boolean(trimmedUrl) && !hasImageError

  useEffect(() => {
    setHasImageError(false)
  }, [trimmedUrl])

  return (
    <div className="aspect-video w-full max-w-[200px] overflow-hidden rounded-input border border-border-subtle bg-surface-container-low">
      {showImage ? (
        <img
          src={trimmedUrl}
          alt={`Thumbnail for ${lessonLabel}`}
          className="size-full object-cover object-center"
          onError={() => setHasImageError(true)}
        />
      ) : (
        <div
          className="flex size-full flex-col items-center justify-center gap-1 px-2 py-4 text-center"
          role="status"
        >
          <MaterialIcon name="hide_image" size={20} className="text-on-surface-variant" />
          <span className="text-caption text-on-surface-variant">No thumbnail</span>
        </div>
      )}
    </div>
  )
}
