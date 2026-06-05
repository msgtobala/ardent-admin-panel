import { useCallback, useEffect, useState } from 'react'

import { QbankChapterImageUpload } from '@/components/qbank-chapters/QbankChapterImageUpload'
import {
  deleteQbankChapterImageFromUrl,
  uploadQbankChapterImage,
} from '@/lib/qbank-chapter-image-storage'
import {
  createQbankChapter,
  resolveNextQbankChapterSortOrder,
  updateQbankChapter,
} from '@/lib/qbank-chapters'
import type { QbankChapter } from '@/types/qbank-chapter'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { ActiveToggle } from '@/components/banners/ActiveToggle'
import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { TextField } from '@/components/ui/TextField'

interface EditQbankChapterModalProps {
  isOpen: boolean
  subjectId: string
  subjectName: string
  chapter: QbankChapter | null
  onClose: () => void
  onSaved: () => void
}

const textareaClasses =
  'min-h-[100px] w-full resize-y rounded-input border border-border-subtle bg-surface-white px-[13px] py-[10px] text-body-md text-on-surface shadow-tier-1 placeholder:text-on-surface-variant focus:border-primary-action focus:outline-none focus:ring-2 focus:ring-focus-ring disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-surface-container disabled:text-on-surface-variant disabled:opacity-70 disabled:shadow-none'

function normalizeImageUrl(imageUrl: string | null | undefined): string | null {
  const trimmed = imageUrl?.trim()
  return trimmed || null
}

function revokePreviewUrlIfBlob(url: string | null) {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

function getInitialFormState(chapter: QbankChapter | null) {
  return {
    chapterName: chapter?.chapterName ?? '',
    description: chapter?.description ?? '',
    isActive: chapter?.isActive ?? false,
    isFree: chapter?.isFree ?? false,
    moduleName: chapter?.moduleName ?? '',
    sortOrder: chapter != null ? String(chapter.sortOrder) : '',
    imageUrl: normalizeImageUrl(chapter?.imageUrl),
  }
}

export function EditQbankChapterModal({
  isOpen,
  subjectId,
  subjectName,
  chapter,
  onClose,
  onSaved,
}: EditQbankChapterModalProps) {
  const { showSnackbar } = useSnackbar()
  const isAddMode = chapter == null

  const [chapterName, setChapterName] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(false)
  const [isFree, setIsFree] = useState(false)
  const [moduleName, setModuleName] = useState('')
  const [sortOrder, setSortOrder] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const [imageRemoved, setImageRemoved] = useState(false)
  const [removedImageUrl, setRemovedImageUrl] = useState<string | null>(null)
  const [chapterNameError, setChapterNameError] = useState<string | undefined>()
  const [moduleNameError, setModuleNameError] = useState<string | undefined>()
  const [sortOrderError, setSortOrderError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(false)

  const handleClose = useCallback(() => {
    if (isSubmitting) return
    onClose()
  }, [isSubmitting, onClose])

  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') handleClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleClose])

  useEffect(() => {
    if (!isOpen) {
      setPreviewUrl((prev) => {
        revokePreviewUrlIfBlob(prev)
        return null
      })
      setChapterName('')
      setDescription('')
      setIsActive(false)
      setIsFree(false)
      setModuleName('')
      setSortOrder('')
      setFile(null)
      setExistingImageUrl(null)
      setImageRemoved(false)
      setRemovedImageUrl(null)
      setChapterNameError(undefined)
      setModuleNameError(undefined)
      setSortOrderError(undefined)
      setFormError(undefined)
      setIsSubmitting(false)
      setIsLoadingDefaults(false)
      return
    }

    if (isAddMode) {
      setPreviewUrl((prev) => {
        revokePreviewUrlIfBlob(prev)
        return null
      })
      setChapterName('')
      setDescription('')
      setIsActive(false)
      setIsFree(false)
      setModuleName(subjectName.trim())
      setSortOrder('')
      setFile(null)
      setExistingImageUrl(null)
      setImageRemoved(false)
      setRemovedImageUrl(null)
      setChapterNameError(undefined)
      setModuleNameError(undefined)
      setSortOrderError(undefined)
      setFormError(undefined)
      setIsSubmitting(false)

      const trimmedSubjectId = subjectId.trim()
      if (!trimmedSubjectId) {
        setIsLoadingDefaults(false)
        return
      }

      let isCancelled = false
      setIsLoadingDefaults(true)

      async function loadAddDefaults() {
        try {
          const nextSortOrder = await resolveNextQbankChapterSortOrder(trimmedSubjectId)
          if (!isCancelled) setSortOrder(String(nextSortOrder))
        } catch {
          if (!isCancelled) {
            setFormError('Failed to load default sort order. Please try again.')
          }
        } finally {
          if (!isCancelled) setIsLoadingDefaults(false)
        }
      }

      void loadAddDefaults()

      return () => {
        isCancelled = true
      }
    }

    if (!chapter) return

    const initial = getInitialFormState(chapter)
    setChapterName(initial.chapterName)
    setDescription(initial.description)
    setIsActive(initial.isActive)
    setIsFree(initial.isFree)
    setModuleName(initial.moduleName)
    setSortOrder(initial.sortOrder)
    setFile(null)
    setExistingImageUrl(initial.imageUrl)
    setPreviewUrl(initial.imageUrl)
    setImageRemoved(false)
    setRemovedImageUrl(null)
    setChapterNameError(undefined)
    setModuleNameError(undefined)
    setSortOrderError(undefined)
    setFormError(undefined)
    setIsSubmitting(false)
    setIsLoadingDefaults(false)
  }, [isOpen, isAddMode, chapter, subjectId, subjectName])

  function resolveModuleNameForSave(): string {
    const trimmed = moduleName.trim()
    if (isAddMode) return trimmed || subjectName.trim()
    return trimmed
  }

  function handleRemoveImage() {
    const persistedUrl =
      existingImageUrl ??
      (previewUrl && !previewUrl.startsWith('blob:') ? previewUrl : null)

    setRemovedImageUrl(persistedUrl)
    setPreviewUrl((prev) => {
      revokePreviewUrlIfBlob(prev)
      return null
    })
    setFile(null)
    setExistingImageUrl(null)
    setImageRemoved(true)
  }

  function handleImageFileChange(
    selectedFile: File | null,
    selectedPreviewUrl: string | null,
  ) {
    if (selectedFile && selectedPreviewUrl) {
      setImageRemoved(false)
      setRemovedImageUrl(null)
      setPreviewUrl((prev) => {
        if (prev && prev !== selectedPreviewUrl) revokePreviewUrlIfBlob(prev)
        return selectedPreviewUrl
      })
      setFile(selectedFile)
      return
    }

    setFile(null)
    setPreviewUrl((prev) => {
      if (prev?.startsWith('blob:')) revokePreviewUrlIfBlob(prev)
      return imageRemoved ? null : existingImageUrl
    })
  }

  function validate(): boolean {
    let valid = true
    const trimmedChapterName = chapterName.trim()
    const trimmedModuleName = moduleName.trim()
    const parsedSortOrder = Number(sortOrder.trim())

    if (!trimmedChapterName) {
      setChapterNameError('Chapter name is required')
      valid = false
    } else {
      setChapterNameError(undefined)
    }

    if (!isAddMode && !trimmedModuleName) {
      setModuleNameError('Module name is required')
      valid = false
    } else {
      setModuleNameError(undefined)
    }

    if (!Number.isFinite(parsedSortOrder)) {
      setSortOrderError('Sort order must be a valid number')
      valid = false
    } else {
      setSortOrderError(undefined)
    }

    return valid
  }

  async function handleSave() {
    if (!validate()) return
    if (!isAddMode && !chapter) return

    const trimmedSubjectId = subjectId.trim()
    if (!trimmedSubjectId) {
      setFormError(
        isAddMode
          ? 'Select a qbank subject before creating a chapter.'
          : 'Select a qbank subject before saving chapter changes.',
      )
      return
    }

    setFormError(undefined)
    setIsSubmitting(true)

    const normalizedSortOrder = Number(sortOrder.trim())
    const resolvedModuleName = resolveModuleNameForSave()
    const sharedInput = {
      chapterName: chapterName.trim(),
      description: description.trim(),
      moduleName: resolvedModuleName,
      sortOrder: normalizedSortOrder,
      isActive,
      isFree,
    }

    try {
      if (isAddMode) {
        await createQbankChapter(
          trimmedSubjectId,
          subjectName,
          { ...sharedInput, imageUrl: null },
          file,
        )

        showSnackbar('Qbank chapter created successfully')
        onSaved()
        onClose()
        return
      }

      if (!chapter) return

      if (imageRemoved && removedImageUrl) {
        await deleteQbankChapterImageFromUrl(removedImageUrl)
      }

      const imageUrl = imageRemoved
        ? null
        : file
          ? await uploadQbankChapterImage(file, {
              subjectId: trimmedSubjectId,
              chapterId: chapter.id,
              moduleName: resolvedModuleName,
            })
          : existingImageUrl

      await updateQbankChapter(trimmedSubjectId, chapter.id, {
        ...sharedInput,
        imageUrl,
      })

      showSnackbar('Qbank chapter updated successfully')
      onSaved()
      onClose()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : isAddMode
            ? 'Failed to create qbank chapter. Please try again.'
            : 'Failed to update qbank chapter. Please try again.'
      showSnackbar(message)
      setFormError(message)
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null
  if (!isAddMode && !chapter) return null

  const chapterLabel = isAddMode
    ? subjectName.trim() || subjectId.trim() || 'new chapter'
    : chapter.chapterName.trim() || chapter.id
  const isFormBusy = isSubmitting || isLoadingDefaults

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]"
      role="presentation"
    >
      <button
        type="button"
        aria-label={isAddMode ? 'Close add chapter dialog' : 'Close edit chapter dialog'}
        className="absolute inset-0 cursor-pointer bg-on-surface/40"
        onClick={handleClose}
        disabled={isSubmitting}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-qbank-chapter-modal-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-[720px] flex-col overflow-hidden rounded-xl bg-surface-white shadow-tier-2"
      >
        <div className="flex items-start justify-between border-b border-border-subtle bg-surface px-gutter py-5">
          <div className="flex flex-col gap-2 pr-4">
            <h2 id="edit-qbank-chapter-modal-title" className="text-h3 text-on-surface">
              {isAddMode ? 'Add Chapter' : 'Edit Chapter'}
            </h2>
            <p className="text-body-md text-on-surface-variant">
              {isAddMode
                ? `Create a new chapter for ${chapterLabel}`
                : `Update chapter details for ${chapterLabel}`}
            </p>
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

        <div className="flex flex-col gap-gutter overflow-y-auto px-gutter py-gutter">
          <TextField
            id="qbank-chapter-name"
            label="Chapter Name"
            value={chapterName}
            disabled={isFormBusy}
            error={chapterNameError}
            onChange={(event) => {
              setChapterName(event.target.value)
              if (chapterNameError) setChapterNameError(undefined)
            }}
          />

          <div className="flex flex-col gap-1">
            <label htmlFor="qbank-chapter-description" className="text-label-sm text-on-surface">
              Description
            </label>
            <textarea
              id="qbank-chapter-description"
              value={description}
              disabled={isFormBusy}
              onChange={(event) => setDescription(event.target.value)}
              className={textareaClasses}
            />
          </div>

          <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2">
            <TextField
              id="qbank-chapter-module-name"
              label="Module Name"
              value={moduleName}
              disabled={isFormBusy}
              error={moduleNameError}
              placeholder={
                isAddMode ? 'Defaults to subject name if empty' : undefined
              }
              onChange={(event) => {
                setModuleName(event.target.value)
                if (moduleNameError) setModuleNameError(undefined)
              }}
            />
            <TextField
              id="qbank-chapter-sort-order"
              label="Sort Order"
              value={sortOrder}
              disabled={isFormBusy}
              error={sortOrderError}
              onChange={(event) => {
                setSortOrder(event.target.value)
                if (sortOrderError) setSortOrderError(undefined)
              }}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:gap-8">
            <div className="flex items-center gap-3">
              <ActiveToggle
                isActive={isActive}
                disabled={isFormBusy}
                ariaLabel={`Toggle active status for ${chapterLabel}`}
                onChange={setIsActive}
              />
              <span className="text-body-md text-on-surface">Active</span>
            </div>
            <div className="flex items-center gap-3">
              <ActiveToggle
                isActive={isFree}
                disabled={isFormBusy}
                ariaLabel={`Toggle free status for ${chapterLabel}`}
                onChange={setIsFree}
              />
              <span className="text-body-md text-on-surface">Free</span>
            </div>
          </div>

          <QbankChapterImageUpload
            file={file}
            previewUrl={previewUrl}
            disabled={isFormBusy}
            onFileChange={handleImageFileChange}
            onRemove={isAddMode ? undefined : handleRemoveImage}
          />

          {formError ? (
            <p className="text-body-md text-error-red" role="alert">
              {formError}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-end border-t border-border-subtle bg-surface-container-low px-gutter py-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={isFormBusy}
            className="ml-4 shadow-tier-1"
          >
            {isSubmitting
              ? isAddMode
                ? 'Creating...'
                : 'Saving...'
              : isAddMode
                ? 'Create chapter'
                : 'Save changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
