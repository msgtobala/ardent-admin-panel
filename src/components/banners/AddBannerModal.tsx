import { useCallback, useEffect, useState } from 'react'
import { uploadBannerImage } from '@/lib/banner-storage'
import { createBanner, updateBanner } from '@/lib/banners'
import type { Banner } from '@/types/banner'
import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { ActiveToggle } from './ActiveToggle'
import { BannerImageUpload } from './BannerImageUpload'

interface AddBannerModalProps {
  isOpen: boolean
  banner?: Banner | null
  onClose: () => void
  onSaved: () => void
}

const URL_PATTERN = /^https?:\/\/.+/i

const initialFormState = {
  link: '',
  isActive: true,
  file: null as File | null,
  previewUrl: null as string | null,
}

function revokePreviewUrlIfBlob(url: string | null) {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

export function AddBannerModal({
  isOpen,
  banner,
  onClose,
  onSaved,
}: AddBannerModalProps) {
  const isEditMode = banner != null

  const [link, setLink] = useState(banner?.link ?? initialFormState.link)
  const [isActive, setIsActive] = useState(
    banner?.isActive ?? initialFormState.isActive,
  )
  const [file, setFile] = useState<File | null>(initialFormState.file)
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    banner?.imageUrl ?? initialFormState.previewUrl,
  )
  const [linkError, setLinkError] = useState<string | undefined>()
  const [imageError, setImageError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  function resetForm() {
    setPreviewUrl((prev) => {
      revokePreviewUrlIfBlob(prev)
      return null
    })
    setLink(initialFormState.link)
    setIsActive(initialFormState.isActive)
    setFile(initialFormState.file)
    setLinkError(undefined)
    setImageError(undefined)
    setFormError(undefined)
    setIsSubmitting(false)
  }

  const handleClose = useCallback(() => {
    if (isSubmitting) return
    resetForm()
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

  function validate(): boolean {
    let valid = true
    const trimmedLink = link.trim()

    if (trimmedLink && !URL_PATTERN.test(trimmedLink)) {
      setLinkError('Enter a valid URL starting with http:// or https://')
      valid = false
    } else {
      setLinkError(undefined)
    }

    const hasExistingImage = isEditMode && Boolean(banner?.imageUrl)
    if (!file && !hasExistingImage) {
      setImageError('Banner image is required')
      valid = false
    } else {
      setImageError(undefined)
    }

    return valid
  }

  function handleFileChange(
    selectedFile: File | null,
    selectedPreviewUrl: string | null,
  ) {
    setPreviewUrl((prev) => {
      if (prev && prev !== selectedPreviewUrl) revokePreviewUrlIfBlob(prev)
      return selectedPreviewUrl
    })
    setFile(selectedFile)

    if (selectedFile) {
      setImageError(undefined)
    }
  }

  async function handleSave() {
    if (!validate()) return

    setFormError(undefined)
    setIsSubmitting(true)

    try {
      const trimmedLink = link.trim()

      if (isEditMode && banner) {
        const imageUrl = file
          ? await uploadBannerImage(file)
          : banner.imageUrl

        await updateBanner(banner.id, {
          link: trimmedLink,
          imageUrl,
          isActive,
        })
      } else {
        const imageUrl = await uploadBannerImage(file!)
        await createBanner({
          link: trimmedLink,
          imageUrl,
          isActive,
        })
      }

      resetForm()
      onSaved()
      onClose()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to save banner. Please try again.'
      setFormError(message)
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]"
      role="presentation"
    >
      <button
        type="button"
        aria-label={isEditMode ? 'Close edit banner dialog' : 'Close add banner dialog'}
        className="absolute inset-0 cursor-pointer bg-on-surface/40"
        onClick={handleClose}
        disabled={isSubmitting}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-banner-modal-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-[672px] flex-col overflow-hidden rounded-xl bg-surface-white shadow-tier-2"
      >
        <div className="flex items-start justify-between border-b border-border-subtle bg-surface px-gutter py-5">
          <div className="flex flex-col gap-2 pr-4">
            <h2 id="add-banner-modal-title" className="text-h3 text-on-surface">
              {isEditMode ? 'Edit Banner' : 'Add New Banner'}
            </h2>
            <p className="text-body-md text-on-surface-variant">
              {isEditMode
                ? 'Update the promotional banner details for the Ardent MDS Plus app'
                : 'Configure a new promotional banner for the Ardent MDS Plus app'}
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

        <form
          className="flex flex-col gap-gutter overflow-y-auto px-gutter py-gutter"
          onSubmit={(event) => {
            event.preventDefault()
            handleSave()
          }}
          noValidate
        >
          <div className="flex w-full flex-col gap-1">
            <label htmlFor="banner-link" className="text-label-sm text-on-surface">
              Banner URL Link <span className="font-normal text-on-surface-variant">(optional)</span>
            </label>
            <div className="relative">
              <MaterialIcon
                name="link"
                size={18}
                className="pointer-events-none absolute left-[13px] top-1/2 -translate-y-1/2 text-on-surface-variant"
              />
              <input
                id="banner-link"
                type="text"
                inputMode="url"
                autoComplete="url"
                placeholder="https://ardentmds.com/campaign/..."
                value={link}
                disabled={isSubmitting}
                aria-invalid={linkError ? true : undefined}
                aria-describedby={linkError ? 'banner-link-error' : undefined}
                onChange={(event) => {
                  setLink(event.target.value)
                  if (linkError) setLinkError(undefined)
                  if (formError) setFormError(undefined)
                }}
                className={[
                  'h-[38px] w-full rounded-input border border-border-subtle bg-surface-white py-[10px] pl-10 pr-[13px] text-body-md text-on-surface shadow-tier-1 placeholder:text-on-surface-variant focus:border-primary-action focus:outline-none focus:ring-2 focus:ring-focus-ring',
                  linkError ? 'border-error-red' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              />
            </div>
            {linkError ? (
              <p id="banner-link-error" className="text-label-sm text-error-red" role="alert">
                {linkError}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 py-2">
            <span className="text-label-sm font-semibold text-on-surface">
              Banner Status
            </span>
            <div className="flex items-center gap-3">
              <ActiveToggle
                isActive={isActive}
                disabled={isSubmitting}
                ariaLabel="Banner active status"
                onChange={setIsActive}
              />
              <span className="text-body-md text-on-surface">
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <BannerImageUpload
            file={file}
            previewUrl={previewUrl}
            error={imageError}
            disabled={isSubmitting}
            onFileChange={handleFileChange}
          />

          {formError ? (
            <p className="text-label-sm text-error-red" role="alert">
              {formError}
            </p>
          ) : null}
        </form>

        <div className="flex items-center justify-end border-t border-border-subtle bg-surface-container-low px-gutter py-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Close
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="ml-4 shadow-tier-1"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  )
}
