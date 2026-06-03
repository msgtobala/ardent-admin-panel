import { useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from 'react'
import { validateBannerImageFile } from '@/lib/banner-storage'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

interface BannerImageUploadProps {
  file: File | null
  previewUrl: string | null
  error?: string
  disabled?: boolean
  onFileChange: (file: File | null, previewUrl: string | null) => void
}

export function BannerImageUpload({
  file,
  previewUrl,
  error,
  disabled = false,
  onFileChange,
}: BannerImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [localError, setLocalError] = useState<string | undefined>()

  const displayError = error ?? localError

  function handleFileSelected(selectedFile: File | null) {
    if (!selectedFile) {
      setLocalError(undefined)
      onFileChange(null, null)
      return
    }

    const validationError = validateBannerImageFile(selectedFile)
    if (validationError) {
      setLocalError(validationError)
      onFileChange(null, null)
      return
    }

    setLocalError(undefined)
    const objectUrl = URL.createObjectURL(selectedFile)
    onFileChange(selectedFile, objectUrl)
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null
    handleFileSelected(selectedFile)
    event.target.value = ''
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

    const droppedFile = event.dataTransfer.files?.[0] ?? null
    handleFileSelected(droppedFile)
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

  return (
    <div className="flex w-full flex-col gap-1">
      <span className="text-label-sm font-semibold text-on-surface">
        Upload Banner Image
      </span>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload banner image"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-[34px] transition',
          'border-outline-variant bg-surface-container-low',
          isDragging ? 'border-primary-action bg-row-hover' : '',
          disabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-row-hover',
          displayError ? 'border-error-red' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="sr-only"
          disabled={disabled}
          onChange={handleInputChange}
        />

        {previewUrl ? (
          <div className="flex w-full flex-col items-center gap-3">
            <img
              src={previewUrl}
              alt={file?.name ?? 'Banner preview'}
              className="max-h-40 w-auto max-w-full rounded-input object-contain"
            />
            <p className="text-body-md font-semibold text-on-surface">
              {file?.name ?? 'Current banner image'}
            </p>
            <p className="text-caption text-on-surface-variant">
              Click or drag to replace
            </p>
          </div>
        ) : (
          <>
            <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-primary-fixed">
              <MaterialIcon
                name="cloud_upload"
                size={24}
                className="text-primary-action"
              />
            </div>
            <p className="text-body-md font-semibold text-on-surface">
              Click to upload or drag and drop
            </p>
            <p className="mt-1 text-caption text-on-surface-variant">
              PNG, JPG, and JPEG (Max. 5MB)
            </p>
          </>
        )}
      </div>
      {displayError ? (
        <p className="text-label-sm text-error-red" role="alert">
          {displayError}
        </p>
      ) : null}
    </div>
  )
}
