import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { SelectField } from '@/components/ui/SelectField'
import {
  createDefaultThumbnailGenerationConfig,
  DEFAULT_THUMBNAIL_WIDTH,
  THUMBNAIL_TIME_AUTO_PLACEHOLDER,
  MAX_THUMBNAIL_TIME_SECONDS,
  MAX_THUMBNAIL_WIDTH,
  MIN_THUMBNAIL_TIME_SECONDS,
  MIN_THUMBNAIL_WIDTH,
  THUMBNAIL_COMPRESS_OPTIONS,
  normalizeThumbnailGenerationConfig,
  validateThumbnailGenerationConfig,
  type ThumbnailGenerationConfig,
} from '@/types/thumbnail-generation'

export type GenerateThumbnailModalAction =
  | {
      type: 'single'
      lessonLabel: string
    }
  | {
      type: 'bulk'
      lessonCount: number
    }

interface GenerateThumbnailConfigModalProps {
  action: GenerateThumbnailModalAction
  isSubmitting: boolean
  onClose: () => void
  onConfirm: (config: ThumbnailGenerationConfig) => void
}

export function GenerateThumbnailConfigModal({
  action,
  isSubmitting,
  onClose,
  onConfirm,
}: GenerateThumbnailConfigModalProps) {
  const [config, setConfig] = useState<ThumbnailGenerationConfig>(() =>
    createDefaultThumbnailGenerationConfig(),
  )
  const [error, setError] = useState<string | undefined>()

  const handleClose = useCallback(() => {
    if (isSubmitting) return
    onClose()
  }, [isSubmitting, onClose])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') handleClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleClose])

  function handleSubmit() {
    const normalizedConfig = normalizeThumbnailGenerationConfig(config)
    const validationError = validateThumbnailGenerationConfig(normalizedConfig)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(undefined)
    onConfirm(normalizedConfig)
  }

  const description =
    action.type === 'single'
      ? `Generate a thumbnail for ${action.lessonLabel}.`
      : `Generate thumbnails for ${action.lessonCount} lesson${action.lessonCount === 1 ? '' : 's'} missing a thumbnail.`

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-[2px]"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close thumbnail configuration dialog"
        className="absolute inset-0 cursor-pointer bg-on-surface/40"
        onClick={handleClose}
        disabled={isSubmitting}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="generate-thumbnail-config-modal-title"
        className="relative z-10 flex w-full max-w-[480px] flex-col overflow-hidden rounded-xl bg-surface-white shadow-tier-2"
      >
        <div className="flex items-start justify-between border-b border-border-subtle bg-surface px-gutter py-5">
          <div className="flex flex-col gap-2 pr-4">
            <h2
              id="generate-thumbnail-config-modal-title"
              className="text-h3 text-on-surface"
            >
              Thumbnail Settings
            </h2>
            <p className="text-body-md text-on-surface-variant">{description}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close"
            className="cursor-pointer rounded-full p-2 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            <MaterialIcon name="close" size={20} className="text-on-surface" />
          </button>
        </div>

        <div className="flex flex-col gap-gutter px-gutter py-gutter">
          <div className="flex flex-col gap-2">
            <label htmlFor="thumbnail-width-input" className="text-label-sm text-on-surface">
              Thumbnail width (px, default {DEFAULT_THUMBNAIL_WIDTH})
            </label>
            <input
              id="thumbnail-width-input"
              type="number"
              min={MIN_THUMBNAIL_WIDTH}
              max={MAX_THUMBNAIL_WIDTH}
              step={1}
              value={config.thumbnailWidth}
              disabled={isSubmitting}
              onChange={(event) => {
                const nextValue = Number.parseInt(event.target.value, 10)
                setConfig((prev) => ({
                  ...prev,
                  thumbnailWidth: Number.isFinite(nextValue) ? nextValue : prev.thumbnailWidth,
                }))
              }}
              className="h-[38px] w-full rounded-input border border-border-subtle bg-surface-white px-[13px] py-[10px] text-body-md text-on-surface shadow-tier-1 focus:border-primary-action focus:outline-none focus:ring-2 focus:ring-focus-ring"
            />
            <p className="text-caption text-on-surface-variant">
              Height scales proportionally from Mux.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="thumbnail-time-input" className="text-label-sm text-on-surface">
              Frame time (seconds, optional)
            </label>
            <input
              id="thumbnail-time-input"
              type="number"
              min={MIN_THUMBNAIL_TIME_SECONDS}
              max={MAX_THUMBNAIL_TIME_SECONDS}
              step={0.1}
              value={config.thumbnailTime ?? ''}
              placeholder={THUMBNAIL_TIME_AUTO_PLACEHOLDER}
              disabled={isSubmitting}
              onChange={(event) => {
                const raw = event.target.value
                if (raw.trim() === '') {
                  setConfig((prev) => ({
                    ...prev,
                    thumbnailTime: null,
                  }))
                  return
                }

                const nextValue = Number.parseFloat(raw)
                setConfig((prev) => ({
                  ...prev,
                  thumbnailTime: Number.isFinite(nextValue) ? nextValue : null,
                }))
              }}
              className="h-[38px] w-full rounded-input border border-border-subtle bg-surface-white px-[13px] py-[10px] text-body-md text-on-surface shadow-tier-1 focus:border-primary-action focus:outline-none focus:ring-2 focus:ring-focus-ring"
            />
            <p className="text-caption text-on-surface-variant">
              If left empty, Mux uses a frame from the middle of the video. Enter a
              value (e.g. 0 or 5) to capture a specific timestamp.
            </p>
          </div>

          <SelectField
            id="thumbnail-compress-select"
            label="Compression"
            value={config.compress}
            options={THUMBNAIL_COMPRESS_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            disabled={isSubmitting}
            onChange={(value) => {
              setConfig((prev) => ({
                ...prev,
                compress: value as ThumbnailGenerationConfig['compress'],
              }))
            }}
          />

          {error ? (
            <p className="text-label-sm text-error-red" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-end border-t border-border-subtle bg-surface-container-low px-gutter py-4">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="ml-4 shadow-tier-1"
          >
            {isSubmitting ? 'Generating...' : 'Generate'}
          </Button>
        </div>
      </div>
    </div>
  )
}
