export type ThumbnailCompressMode = 'none' | 'lossless-png' | 'lossless-webp'

export interface ThumbnailGenerationConfig {
  thumbnailWidth: number
  /** Null = omit time; Mux uses a frame from the middle of the video. */
  thumbnailTime: number | null
  compress: ThumbnailCompressMode
}

export const DEFAULT_THUMBNAIL_WIDTH = 640
export const DEFAULT_THUMBNAIL_COMPRESS: ThumbnailCompressMode = 'lossless-png'
export const MIN_THUMBNAIL_WIDTH = 100
export const MAX_THUMBNAIL_WIDTH = 1920
export const MIN_THUMBNAIL_TIME_SECONDS = 0
export const MAX_THUMBNAIL_TIME_SECONDS = 86_400
export const THUMBNAIL_TIME_AUTO_PLACEHOLDER = 'Auto (middle of video)'

export const THUMBNAIL_COMPRESS_OPTIONS: Array<{
  value: ThumbnailCompressMode
  label: string
}> = [
  { value: 'lossless-png', label: 'Lossless PNG (default)' },
  { value: 'lossless-webp', label: 'Lossless WebP' },
  { value: 'none', label: 'No compression' },
]

export function createDefaultThumbnailGenerationConfig(): ThumbnailGenerationConfig {
  return {
    thumbnailWidth: DEFAULT_THUMBNAIL_WIDTH,
    thumbnailTime: null,
    compress: DEFAULT_THUMBNAIL_COMPRESS,
  }
}

export function normalizeThumbnailGenerationConfig(
  config: ThumbnailGenerationConfig,
): ThumbnailGenerationConfig {
  return {
    thumbnailWidth: Number.isFinite(config.thumbnailWidth)
      ? config.thumbnailWidth
      : DEFAULT_THUMBNAIL_WIDTH,
    thumbnailTime:
      config.thumbnailTime === null || config.thumbnailTime === undefined
        ? null
        : Number.isFinite(config.thumbnailTime)
          ? config.thumbnailTime
          : null,
    compress: config.compress ?? DEFAULT_THUMBNAIL_COMPRESS,
  }
}

export function validateThumbnailGenerationConfig(
  config: ThumbnailGenerationConfig,
): string | undefined {
  const normalized = normalizeThumbnailGenerationConfig(config)

  if (
    normalized.thumbnailWidth < MIN_THUMBNAIL_WIDTH ||
    normalized.thumbnailWidth > MAX_THUMBNAIL_WIDTH
  ) {
    return `Width must be between ${MIN_THUMBNAIL_WIDTH} and ${MAX_THUMBNAIL_WIDTH}.`
  }

  if (normalized.thumbnailTime !== null) {
    if (
      normalized.thumbnailTime < MIN_THUMBNAIL_TIME_SECONDS ||
      normalized.thumbnailTime > MAX_THUMBNAIL_TIME_SECONDS
    ) {
      return `Time must be between ${MIN_THUMBNAIL_TIME_SECONDS} and ${MAX_THUMBNAIL_TIME_SECONDS} seconds.`
    }
  }

  if (!THUMBNAIL_COMPRESS_OPTIONS.some((option) => option.value === normalized.compress)) {
    return 'Select a valid compression option.'
  }

  return undefined
}
