interface BannerImagePreviewProps {
  imageUrl: string
  altText: string
  onClick?: () => void
}

const previewFrameClassName =
  'h-14 w-24 shrink-0 overflow-hidden rounded-input border border-border-subtle bg-surface-container'

export function BannerImagePreview({
  imageUrl,
  altText,
  onClick,
}: BannerImagePreviewProps) {
  if (!imageUrl) {
    return (
      <div
        aria-hidden
        className={previewFrameClassName}
      />
    )
  }

  const image = (
    <img
      src={imageUrl}
      alt={altText || 'Banner preview'}
      className="h-full w-full object-cover"
    />
  )

  if (!onClick) {
    return <div className={previewFrameClassName}>{image}</div>
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`View banner image: ${altText || 'Banner preview'}`}
      className={`${previewFrameClassName} cursor-pointer transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring`}
    >
      {image}
    </button>
  )
}
