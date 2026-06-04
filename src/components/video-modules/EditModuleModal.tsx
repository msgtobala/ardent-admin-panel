import { useCallback, useEffect, useState } from 'react'
import { renameVideoLessonModule } from '@/lib/video-lessons'
import type { VideoModuleListItem } from '@/types/video-module'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { TextField } from '@/components/ui/TextField'

interface EditModuleModalProps {
  isOpen: boolean
  subjectId: string
  module: VideoModuleListItem | null
  onClose: () => void
  onSaved: () => void
}

export function EditModuleModal({
  isOpen,
  subjectId,
  module,
  onClose,
  onSaved,
}: EditModuleModalProps) {
  const { showSnackbar } = useSnackbar()
  const [moduleName, setModuleName] = useState('')
  const [moduleNameError, setModuleNameError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const originalName = module?.name.trim() ?? ''

  const handleClose = useCallback(() => {
    if (isSubmitting) return
    onClose()
  }, [isSubmitting, onClose])

  useEffect(() => {
    if (!isOpen) return

    setModuleName(module?.name ?? '')
    setModuleNameError(undefined)
    setFormError(undefined)
    setIsSubmitting(false)
  }, [isOpen, module])

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
    const trimmed = moduleName.trim()

    if (!trimmed) {
      setModuleNameError('Module name is required')
      return false
    }

    if (trimmed === originalName) {
      setModuleNameError('Enter a different module name')
      return false
    }

    setModuleNameError(undefined)
    return true
  }

  async function handleSave() {
    if (!module || !validate()) return

    setFormError(undefined)
    setIsSubmitting(true)

    try {
      const updatedCount = await renameVideoLessonModule(
        subjectId,
        module.name,
        moduleName.trim(),
      )

      if (updatedCount === 0) {
        showSnackbar('No lessons were updated for this module.')
      } else {
        showSnackbar(
          `Module renamed across ${updatedCount} lesson${updatedCount === 1 ? '' : 's'}.`,
        )
      }

      onSaved()
      onClose()
    } catch {
      const errorMessage = 'Failed to rename module. Please try again.'
      showSnackbar(errorMessage)
      setFormError(errorMessage)
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !module) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close edit module dialog"
        className="absolute inset-0 cursor-pointer bg-on-surface/40"
        onClick={handleClose}
        disabled={isSubmitting}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-module-modal-title"
        className="relative z-10 flex w-full max-w-[480px] flex-col overflow-hidden rounded-xl bg-surface-white shadow-tier-2"
      >
        <div className="flex items-start justify-between border-b border-border-subtle bg-surface px-gutter py-5">
          <div className="flex flex-col gap-2 pr-4">
            <h2 id="edit-module-modal-title" className="text-h3 text-on-surface">
              Edit Module
            </h2>
            <p className="text-body-md text-on-surface-variant">
              Updates the module name on all {module.lessonCount} lesson
              {module.lessonCount === 1 ? '' : 's'} using &quot;{module.name}&quot;.
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
          className="flex flex-col gap-gutter px-gutter py-gutter"
          onSubmit={(event) => {
            event.preventDefault()
            handleSave()
          }}
          noValidate
        >
          <TextField
            id="edit-module-name"
            label="Module Name"
            value={moduleName}
            required
            error={moduleNameError}
            disabled={isSubmitting}
            onChange={(event) => {
              setModuleName(event.currentTarget.value)
              if (moduleNameError) setModuleNameError(undefined)
            }}
          />

          {formError ? (
            <p className="text-label-sm text-error-red" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-3 border-t border-border-subtle pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="shadow-tier-1">
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
