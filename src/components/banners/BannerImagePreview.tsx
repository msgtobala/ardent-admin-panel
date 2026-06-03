interface BannerImagePreviewProps {
  imageUrl: string
  altText: string
}

export function BannerImagePreview({ imageUrl, altText }: BannerImagePreviewProps) {
  if (!imageUrl) {
    return (
      <div
        aria-hidden
        className="h-14 w-24 shrink-0 rounded-input border border-border-subtle bg-surface-container"
      />
    )
  }

  return (
    <div className="h-14 w-24 shrink-0 overflow-hidden rounded-input border border-border-subtle bg-surface-container">
      <img
        src={imageUrl}
        alt={altText || 'Banner preview'}
        className="h-full w-full object-cover"
      />
    </div>
  )
}
