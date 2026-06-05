import { useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from 'react'
import { validateQbankQuestionImageFile } from '@/lib/qbank-question-image-storage'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

export interface PendingCorrectAnswerImage {
  id: string
  file: File
  previewUrl: string
}

interface QbankCorrectAnswerImagesUploadProps {
  persistedImages: string[]
  pendingFiles: PendingCorrectAnswerImage[]
  error?: string
  disabled?: boolean
  onAddFiles: (files: File[]) => void
  onRemovePersisted: (url: string) => void
  onRemovePending: (id: string) => void
}

export function QbankCorrectAnswerImagesUpload({
  persistedImages,
  pendingFiles,
  error,
  disabled = false,
  onAddFiles,
  onRemovePersisted,
  onRemovePending,
}: QbankCorrectAnswerImagesUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [localError, setLocalError] = useState<string | undefined>()

  const displayError = error ?? localError
  const hasImages = persistedImages.length > 0 || pendingFiles.length > 0

  function handleFilesSelected(selectedFiles: FileList | null) {
    if (!selectedFiles || selectedFiles.length === 0) return

    const validFiles: File[] = []
    let firstValidationError: string | undefined

    for (const file of Array.from(selectedFiles)) {
      const validationError = validateQbankQuestionImageFile(file)
      if (validationError) {
        firstValidationError ??= validationError
        continue
      }
      validFiles.push(file)
    }

    if (firstValidationError && validFiles.length === 0) {
      setLocalError(firstValidationError)
      return
    }

    setLocalError(firstValidationError)
    onAddFiles(validFiles)
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    handleFilesSelected(event.target.files)
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
    handleFilesSelected(event.dataTransfer.files)
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

  function renderDeleteButton(
    ariaLabel: string,
    onClick: () => void,
  ) {
    return (
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        onClick={onClick}
        className="absolute top-2 right-2 flex size-8 cursor-pointer items-center justify-center rounded-full bg-on-surface/70 text-surface-white transition hover:bg-error-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
      >
        <MaterialIcon name="delete" size={18} />
      </button>
    )
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <span className="text-label-sm font-semibold text-on-surface">Correct Answer Images</span>

      {hasImages ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {persistedImages.map((imageUrl, index) => (
            <div
              key={imageUrl}
              className="flex flex-col gap-2 rounded-input border border-border-subtle bg-surface-white p-3"
            >
              <div className="relative">
                <img
                  src={imageUrl}
                  alt={`Correct answer image ${index + 1}`}
                  className="max-h-40 w-full rounded-input object-contain"
                />
                {renderDeleteButton(
                  `Delete correct answer image ${index + 1}`,
                  () => onRemovePersisted(imageUrl),
                )}
              </div>
            </div>
          ))}

          {pendingFiles.map((pendingFile) => (
            <div
              key={pendingFile.id}
              className="flex flex-col gap-2 rounded-input border border-border-subtle bg-surface-white p-3"
            >
              <div className="relative">
                <img
                  src={pendingFile.previewUrl}
                  alt={pendingFile.file.name}
                  className="max-h-40 w-full rounded-input object-contain"
                />
                {renderDeleteButton(
                  `Delete pending correct answer image ${pendingFile.file.name}`,
                  () => onRemovePending(pendingFile.id),
                )}
              </div>
              <p className="truncate text-caption text-on-surface-variant">{pendingFile.file.name}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload correct answer images"
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
          multiple
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
        <p className="mt-1 text-caption text-on-surface-variant">
          PNG, JPG, and JPEG (Max. 5MB each). Select multiple files at once.
        </p>
      </div>

      {displayError ? (
        <p className="text-label-sm text-error-red" role="alert">
          {displayError}
        </p>
      ) : null}
    </div>
  )
}
