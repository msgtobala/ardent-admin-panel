import { useCallback, useEffect, useState } from 'react'
import { uploadVideoLessonFile } from '@/lib/mux-video-upload'
import type { ExternalVideoUploadState } from '@/types/mux-video-upload'
import { createVideoLesson, updateVideoLesson } from '@/lib/video-lessons'
import { MUX_ASSET_STATUS, type VideoLesson } from '@/types/video-lesson'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { ActiveToggle } from '@/components/banners/ActiveToggle'
import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { TextField } from '@/components/ui/TextField'
import { lessonHasMuxVideo } from '@/lib/video-lesson-thumbnail'
import { VideoLessonMuxStatus } from '@/components/videos/VideoLessonMuxStatus'
import { VideoLessonPlayer } from '@/components/videos/VideoLessonPlayer'
import { VideoLessonThumbnailPreview } from '@/components/videos/VideoLessonThumbnailPreview'
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
  const [createdLessonId, setCreatedLessonId] = useState<string | undefined>()
  const [pendingVideoFile, setPendingVideoFile] = useState<File | null>(null)
  const [hasVideoLinked, setHasVideoLinked] = useState(false)
  const [isVideoUploading, setIsVideoUploading] = useState(false)
  const [externalUpload, setExternalUpload] = useState<ExternalVideoUploadState | null>(
    null,
  )
  const [lessonNameError, setLessonNameError] = useState<string | undefined>()
  const [moduleNameError, setModuleNameError] = useState<string | undefined>()
  const [sortOrderError, setSortOrderError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const uploadSubjectId = lesson?.subjectId ?? subjectId ?? ''
  const uploadLessonId = lesson?.id ?? createdLessonId ?? ''
  const isFormBusy = isSubmitting || isVideoUploading
  const isAwaitingUploadAfterCreate = Boolean(
    isAddMode &&
      createdLessonId &&
      pendingVideoFile &&
      !hasVideoLinked &&
      isVideoUploading,
  )

  useEffect(() => {
    if (!isOpen) return

    const initial = getInitialFormState(lesson, defaultModuleName)
    setLessonName(initial.lessonName)
    setModuleNameField(initial.moduleName)
    setDescription(initial.description)
    setSortOrderField(initial.sortOrder)
    setIsActive(initial.isActive)
    setIsFree(initial.isFree)
    setCreatedLessonId(undefined)
    setPendingVideoFile(null)
    setHasVideoLinked(
      lesson?.muxAssetStatus === MUX_ASSET_STATUS.ready ||
        Boolean(lesson?.muxPlaybackId?.trim()),
    )
    setIsVideoUploading(false)
    setExternalUpload(null)
    setLessonNameError(undefined)
    setModuleNameError(undefined)
    setSortOrderError(undefined)
    setFormError(undefined)
    setIsSubmitting(false)
  }, [isOpen, lesson, defaultModuleName])

  const handleClose = useCallback(() => {
    if (isFormBusy) return
    onClose()
  }, [isFormBusy, onClose])

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
      if (isAddMode && subjectId && !createdLessonId) {
        const newLessonId = await createVideoLesson(subjectId, sharedInput)
        setCreatedLessonId(newLessonId)
        onSaved()

        if (pendingVideoFile) {
          const fileName = pendingVideoFile.name
          showSnackbar('Lesson created. Uploading video…')
          setIsVideoUploading(true)
          setExternalUpload({ fileName, phase: 'preparing', progress: 0 })
          try {
            await uploadVideoLessonFile({
              subjectId,
              lessonId: newLessonId,
              file: pendingVideoFile,
              onProgress: (percent) => {
                setExternalUpload({ fileName, phase: 'uploading', progress: percent })
              },
              onUploadComplete: () => {
                setExternalUpload({ fileName, phase: 'processing', progress: 100 })
              },
            })
            setExternalUpload(null)
            handleVideoUploadComplete()
          } catch (uploadError) {
            const message =
              uploadError instanceof Error
                ? uploadError.message
                : 'Video upload failed. Please try again.'
            setExternalUpload({ fileName, phase: 'error', progress: 0, errorMessage: message })
            setFormError(message)
            showSnackbar(message)
          } finally {
            setIsVideoUploading(false)
          }
          return
        }

        showSnackbar('Video lesson created successfully')
        onClose()
        return
      }

      if (lesson) {
        await updateVideoLesson(lesson.subjectId, lesson.id, sharedInput)
        showSnackbar('Video lesson updated successfully')
        onSaved()
        onClose()
        return
      }

      if (isAddMode && createdLessonId && subjectId) {
        await updateVideoLesson(subjectId, createdLessonId, sharedInput)
        showSnackbar('Video lesson updated successfully')
        onSaved()
        onClose()
        return
      }
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

  function handleVideoUploadComplete() {
    setHasVideoLinked(true)
    setPendingVideoFile(null)
    onSaved()

    if (isAddMode) {
      showSnackbar('Video lesson created and video uploaded successfully')
      onClose()
      return
    }

    showSnackbar('Video uploaded successfully')
  }

  function handleVideoUploadingChange(isUploading: boolean) {
    setIsVideoUploading(isUploading)
    if (isUploading) {
      setHasVideoLinked(false)
    }
  }

  if (!isOpen) return null
  if (!isAddMode && !lesson) return null

  const lessonLabel = lesson?.lessonName.trim() || lessonName.trim() || 'new lesson'
  const uploadLessonName = lesson?.lessonName ?? lessonName
  const addModeSubmitLabel = pendingVideoFile ? 'Add Video' : 'Add Lesson'
  const isReplacingOrUploadingVideo = isVideoUploading || Boolean(externalUpload)
  const editModalMuxStatusLesson =
    lesson && isReplacingOrUploadingVideo
      ? { ...lesson, muxAssetStatus: MUX_ASSET_STATUS.processing, muxAssetError: undefined }
      : lesson
  const showEditModalMuxStatus =
    !isAddMode &&
    editModalMuxStatusLesson &&
    (isReplacingOrUploadingVideo ||
      editModalMuxStatusLesson.muxAssetStatus === MUX_ASSET_STATUS.processing)
  const showEditModalPlayer =
    !isAddMode &&
    lesson &&
    lessonHasMuxVideo(lesson) &&
    !isReplacingOrUploadingVideo &&
    lesson.muxAssetStatus !== MUX_ASSET_STATUS.processing

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
        disabled={isFormBusy}
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
                ? 'Add lesson details and choose a video file, then save once to create the lesson and upload.'
                : 'Update lesson metadata, preview the video, or replace the video file.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isFormBusy}
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
          <div className="grid gap-gutter sm:grid-cols-2">
            <TextField
              id="video-lesson-name"
              label="Lesson Name"
              value={lessonName}
              required
              error={lessonNameError}
              disabled={isFormBusy || isAwaitingUploadAfterCreate}
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
              disabled={isFormBusy || isAwaitingUploadAfterCreate}
              onChange={(event) => {
                setModuleNameField(event.currentTarget.value)
                if (moduleNameError) setModuleNameError(undefined)
              }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="video-lesson-description" className="text-label-sm text-on-surface">
              Description
            </label>
            <textarea
              id="video-lesson-description"
              value={description}
              disabled={isFormBusy || isAwaitingUploadAfterCreate}
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
            disabled={isFormBusy || isAwaitingUploadAfterCreate}
            onChange={(event) => {
              setSortOrderField(event.currentTarget.value)
              if (sortOrderError) setSortOrderError(undefined)
            }}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:gap-8">
            <div className="flex items-center gap-3">
              <ActiveToggle
                isActive={isActive}
                disabled={isFormBusy || isAwaitingUploadAfterCreate}
                ariaLabel={`Toggle active status for ${lessonLabel}`}
                onChange={setIsActive}
              />
              <span className="text-body-md text-on-surface">Active</span>
            </div>
            <div className="flex items-center gap-3">
              <ActiveToggle
                isActive={isFree}
                disabled={isFormBusy || isAwaitingUploadAfterCreate}
                ariaLabel={`Toggle free status for ${lessonLabel}`}
                onChange={setIsFree}
              />
              <span className="text-body-md text-on-surface">Free</span>
            </div>
          </div>

          {!isAddMode && lesson ? (
            <VideoLessonThumbnailPreview
              key={lesson.id}
              thumbnailUrl={lesson.thumbnailImage}
              lessonName={lesson.lessonName}
            />
          ) : null}

          {showEditModalMuxStatus ? (
            <VideoLessonMuxStatus lesson={editModalMuxStatusLesson} />
          ) : null}

          {showEditModalPlayer ? (
            <VideoLessonPlayer
              key={`${lesson.subjectId}-${lesson.id}-${lesson.muxPlaybackId}`}
              subjectId={lesson.subjectId}
              lessonId={lesson.id}
              lessonLabel={lessonLabel}
              isLessonActive={isActive}
              autoLoad
            />
          ) : null}

          {isAddMode || lesson ? (
            <VideoLessonVideoUpload
              key={isAddMode ? `add-${uploadSubjectId}` : `${uploadSubjectId}-${uploadLessonId}`}
              subjectId={uploadSubjectId}
              lessonId={uploadLessonId}
              lessonName={uploadLessonName}
              hasExistingVideo={hasVideoLinked}
              previousMuxAssetId={lesson?.muxAssetId}
              pendingFile={isAddMode ? pendingVideoFile : null}
              onPendingFileChange={
                isAddMode && !createdLessonId ? setPendingVideoFile : undefined
              }
              externalUpload={externalUpload}
              disabled={isFormBusy}
              onUploadingChange={handleVideoUploadingChange}
              onUploadComplete={handleVideoUploadComplete}
            />
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
            disabled={isFormBusy}
          >
            Cancel
          </Button>
          {!isAwaitingUploadAfterCreate ? (
            <Button
              type="button"
              onClick={handleSave}
              disabled={isFormBusy}
              className="ml-4 shadow-tier-1"
            >
              {isSubmitting
                ? 'Saving...'
                : isAddMode
                  ? addModeSubmitLabel
                  : 'Save'}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
