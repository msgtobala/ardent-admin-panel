import { useEffect, useState } from 'react'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

interface VideoSubjectIconProps {
  iconUrl: string
  subjectName: string
  size?: number
}

const BLACK_ICON_FILTER = 'brightness(0) saturate(100%)'

const iconContainerClassName =
  'flex shrink-0 items-center justify-center rounded-button bg-primary-fixed'

export function VideoSubjectIcon({
  iconUrl,
  subjectName,
  size = 44,
}: VideoSubjectIconProps) {
  const [hasError, setHasError] = useState(false)
  const trimmedUrl = iconUrl.trim()
  const label = subjectName.trim() ? `${subjectName} icon` : 'Subject icon'

  useEffect(() => {
    setHasError(false)
  }, [trimmedUrl])

  const iconSize = Math.round(size * 0.64)
  const containerStyle = { width: size, height: size }

  if (!trimmedUrl || hasError) {
    return (
      <div
        className={iconContainerClassName}
        style={containerStyle}
        aria-hidden
      >
        <MaterialIcon name="topic" size={20} className="text-text-black" />
      </div>
    )
  }

  return (
    <div className={iconContainerClassName} style={containerStyle}>
      <img
        src={trimmedUrl}
        alt={label}
        width={iconSize}
        height={iconSize}
        className="object-contain"
        style={{
          width: iconSize,
          height: iconSize,
          filter: BLACK_ICON_FILTER,
        }}
        onError={() => setHasError(true)}
      />
    </div>
  )
}
