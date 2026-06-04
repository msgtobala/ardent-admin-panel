import { useCallback, useEffect, useState } from 'react'
import { createVideoLesson, updateVideoLesson } from '@/lib/video-lessons'
import type { VideoLesson } from '@/types/video-lesson'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { ActiveToggle } from '@/components/banners/ActiveToggle'
import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { TextField } from '@/components/ui/TextField'
import { VideoLessonVideoUpload } from '@/components/videos/VideoLessonVideoUpload'

interface EditVideoLessonModalProps {
  isOpen: boolean
  lesson: VideoLesson | null
  subjectId?: string
  defaultModuleName?: string
  onClose: () => void
  onSaved: () => void
}

const textareaClasses =
  'min-h-[100px] w-full resize-y rounded-input border border-border-subtle bg-surface-white px-[13px] py-[10px] text-body-md text-on-surface shadow-tier-1 placeholder:text-on-surface-variant focus:border-primary-action focus:outline-none focus:ring-2 focus:ring-focus-ring'

function getInitialFormState(
  lesson: VideoLesson | null,
  defaultModuleName?: string,
) {
  return {
    lessonName: lesson?.lessonName ?? '',
    moduleName: lesson?.moduleName ?? defaultModuleName ?? '',
    description: lesson?.description ?? '',
    sortOrder: lesson?.sortOrder?.toString() ?? '0',
    isActive: lesson?.isActive ?? false,
    isFree: lesson?.isFree ?? false,
    muxAssetId: lesson?.muxAssetId ?? '',
    muxPlaybackId: lesson?.muxPlaybackId ?? '',
    facultyId: lesson?.facultyId ?? '',
    thumbnailImage: lesson?.thumbnailImage ?? '',
    duration: lesson?.duration ? String(lesson.duration) : '0',
  }
}

export function EditVideoLessonModal({
  isOpen,
  lesson,
  subjectId,
  defaultModuleName,
  onClose,
  onSaved,
}: EditVideoLessonModalProps) {
  const { showSnackbar } = useSnackbar()
  const isAddMode = isOpen && !lesson && Boolean(subjectId)

  const [lessonName, setLessonName] = useState('')
  const [moduleName, setModuleNameField] = useState('')
  const [description, setDescription] = useState('')
  const [sortOrder, setSortOrderField] = useState('0')
  const [isActive, setIsActive] = useState(false)
  const [isFree, setIsFree] = useState(false)
  const [muxAssetId, setMuxAssetId] = useState('')
  const [muxPlaybackId, setMuxPlaybackId] = useState('')
  const [facultyId, setFacultyId] = useState('')
  const [thumbnailImage, setThumbnailImage] = useState('')
  const [duration, setDuration] = useState('0')
  const [lessonNameError, setLessonNameError] = useState<string | undefined>()
  const [moduleNameError, setModuleNameError] = useState<string | undefined>()
  const [sortOrderError, setSortOrderError] = useState<string | undefined>()
  const [muxAssetIdError, setMuxAssetIdError] = useState<string | undefined>()
  const [muxPlaybackIdError, setMuxPlaybackIdError] = useState<string | undefined>()
  const [durationError, setDurationError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const initial = getInitialFormState(lesson, defaultModuleName)
    setLessonName(initial.lessonName)
    setModuleNameField(initial.moduleName)
    setDescription(initial.description)
    setSortOrderField(initial.sortOrder)
    setIsActive(initial.isActive)
    setIsFree(initial.isFree)
    setMuxAssetId(initial.muxAssetId)
    setMuxPlaybackId(initial.muxPlaybackId)
    setFacultyId(initial.facultyId)
    setThumbnailImage(initial.thumbnailImage)
    setDuration(initial.duration)
    setLessonNameError(undefined)
    setModuleNameError(undefined)
    setSortOrderError(undefined)
    setMuxAssetIdError(undefined)
    setMuxPlaybackIdError(undefined)
    setDurationError(undefined)
    setFormError(undefined)
    setIsSubmitting(false)
  }, [isOpen, lesson, defaultModuleName])

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

  function validate(): boolean {
    let valid = true
    const trimmedLessonName = lessonName.trim()
    const trimmedModuleName = moduleName.trim()
    const parsedSortOrder = Number(sortOrder)
    const parsedDuration = Number(duration)

    if (!trimmedLessonName) {
      setLessonNameError('Lesson name is required')
      valid = false
    } else {
      setLessonNameError(undefined)
    }

    if (!trimmedModuleName) {
      setModuleNameError('Module name is required')
      valid = false
    } else {
      setModuleNameError(undefined)
    }

    if (!Number.isFinite(parsedSortOrder) || parsedSortOrder < 0) {
      setSortOrderError('Sort order must be a non-negative number')
      valid = false
    } else {
      setSortOrderError(undefined)
    }

    if (isAddMode) {
      if (!muxAssetId.trim()) {
        setMuxAssetIdError('Mux asset id is required')
        valid = false
      } else {
        setMuxAssetIdError(undefined)
      }

      if (!muxPlaybackId.trim()) {
        setMuxPlaybackIdError('Mux playback id is required')
        valid = false
      } else {
        setMuxPlaybackIdError(undefined)
      }

      if (!Number.isFinite(parsedDuration) || parsedDuration < 0) {
        setDurationError('Duration must be a non-negative number (seconds)')
        valid = false
      } else {
        setDurationError(undefined)
      }
    }

    return valid
  }

  async function handleSave() {
    if (!validate()) return

    setFormError(undefined)
    setIsSubmitting(true)

    const sharedInput = {
      lessonName: lessonName.trim(),
      moduleName: moduleName.trim(),
      description: description.trim(),
      isActive,
      isFree,
      sortOrder: Number(sortOrder),
    }

    try {
      if (isAddMode && subjectId) {
        await createVideoLesson(subjectId, {
          ...sharedInput,
          muxAssetId: muxAssetId.trim(),
          muxPlaybackId: muxPlaybackId.trim(),
          facultyId: facultyId.trim(),
          thumbnailImage: thumbnailImage.trim(),
          duration: Number(duration),
        })
        showSnackbar('Video lesson created successfully')
      } else if (lesson) {
        await updateVideoLesson(lesson.subjectId, lesson.id, sharedInput)
        showSnackbar('Video lesson updated successfully')
      } else {
        return
      }

      onSaved()
      onClose()
    } catch {
      setFormError(
        isAddMode
          ? 'Failed to create video lesson. Please try again.'
          : 'Failed to update video lesson. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null
  if (!isAddMode && !lesson) return null

  const lessonLabel = lesson?.lessonName.trim() || lessonName.trim() || 'new lesson'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]"
      role="presentation"
    >
      <button
        type="button"
        aria-label={
          isAddMode ? 'Close add video lesson dialog' : 'Close edit video lesson dialog'
        }
        className="absolute inset-0 cursor-pointer bg-on-surface/40"
        onClick={handleClose}
        disabled={isSubmitting}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-lesson-modal-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-[720px] flex-col overflow-hidden rounded-xl bg-surface-white shadow-tier-2"
      >
        <div className="flex items-start justify-between border-b border-border-subtle bg-surface px-gutter py-5">
          <div className="flex flex-col gap-2 pr-4">
            <h2 id="video-lesson-modal-title" className="text-h3 text-on-surface">
              {isAddMode ? 'Add Video Lesson' : 'Edit Video Lesson'}
            </h2>
            <p className="text-body-md text-on-surface-variant">
              {isAddMode
                ? 'Create a new lesson for the selected subject with Mux playback details.'
                : 'Update lesson metadata or upload a new video file.'}
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
          <TextField
            id="video-lesson-name"
            label="Lesson Name"
            value={lessonName}
            required
            error={lessonNameError}
            disabled={isSubmitting}
            onChange={(event) => {
              setLessonName(event.target.value)
              if (lessonNameError) setLessonNameError(undefined)
            }}
          />

          <TextField
            id="video-lesson-module-name"
            label="Module Name"
            value={moduleName}
            required
            error={moduleNameError}
            disabled={isSubmitting}
            onChange={(event) => {
              setModuleNameField(event.currentTarget.value)
              if (moduleNameError) setModuleNameError(undefined)
            }}
          />

          <div className="flex flex-col gap-1">
            <label htmlFor="video-lesson-description" className="text-label-sm text-on-surface">
              Description
            </label>
            <textarea
              id="video-lesson-description"
              value={description}
              disabled={isSubmitting}
              onChange={(event) => setDescription(event.target.value)}
              className={textareaClasses}
            />
          </div>

          <TextField
            id="video-lesson-sort-order"
            label="Sort Order"
            value={sortOrder}
            type="number"
            required
            error={sortOrderError}
            disabled={isSubmitting}
            onChange={(event) => {
              setSortOrderField(event.currentTarget.value)
              if (sortOrderError) setSortOrderError(undefined)
            }}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:gap-8">
            <div className="flex items-center gap-3">
              <ActiveToggle
                isActive={isActive}
                disabled={isSubmitting}
                ariaLabel={`Toggle active status for ${lessonLabel}`}
                onChange={setIsActive}
              />
              <span className="text-body-md text-on-surface">Active</span>
            </div>
            <div className="flex items-center gap-3">
              <ActiveToggle
                isActive={isFree}
                disabled={isSubmitting}
                ariaLabel={`Toggle free status for ${lessonLabel}`}
                onChange={setIsFree}
              />
              <span className="text-body-md text-on-surface">Free</span>
            </div>
          </div>

          {!isAddMode && lesson ? (
            <VideoLessonVideoUpload
              lessonName={lesson.lessonName}
              hasExistingVideo={Boolean(lesson.muxPlaybackId?.trim())}
              disabled={isSubmitting}
            />
          ) : null}

          {isAddMode ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  id="video-lesson-mux-playback-id"
                  label="Mux Playback ID"
                  value={muxPlaybackId}
                  required
                  error={muxPlaybackIdError}
                  disabled={isSubmitting}
                  onChange={(event) => {
                    setMuxPlaybackId(event.target.value)
                    if (muxPlaybackIdError) setMuxPlaybackIdError(undefined)
                  }}
                />
                <TextField
                  id="video-lesson-mux-asset-id"
                  label="Mux Asset ID"
                  value={muxAssetId}
                  required
                  error={muxAssetIdError}
                  disabled={isSubmitting}
                  onChange={(event) => {
                    setMuxAssetId(event.target.value)
                    if (muxAssetIdError) setMuxAssetIdError(undefined)
                  }}
                />
                <TextField
                  id="video-lesson-duration"
                  label="Duration (seconds)"
                  value={duration}
                  type="number"
                  required
                  error={durationError}
                  disabled={isSubmitting}
                  onChange={(event) => {
                    setDuration(event.target.value)
                    if (durationError) setDurationError(undefined)
                  }}
                />
                <TextField
                  id="video-lesson-faculty-id"
                  label="Faculty ID"
                  value={facultyId}
                  disabled={isSubmitting}
                  onChange={(event) => setFacultyId(event.target.value)}
                />
              </div>
              <TextField
                id="video-lesson-thumbnail"
                label="Thumbnail Image URL"
                value={thumbnailImage}
                disabled={isSubmitting}
                onChange={(event) => setThumbnailImage(event.target.value)}
              />
            </>
          ) : null}

          {formError ? (
            <p className="text-body-md text-error-red" role="alert">
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
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="ml-4 shadow-tier-1"
          >
            {isSubmitting ? 'Saving...' : isAddMode ? 'Add Lesson' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  )
}
