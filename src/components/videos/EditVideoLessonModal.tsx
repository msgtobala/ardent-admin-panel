import { useCallback, useEffect, useState } from 'react'
import { uploadVideoLessonFile } from '@/lib/mux-video-upload'
import type { ExternalVideoUploadState } from '@/types/mux-video-upload'
import {
  createVideoLesson,
  updateVideoLesson,
  updateVideoLessonNotes,
} from '@/lib/video-lessons'
import {
  deleteVideoLessonNotesFromPath,
  uploadVideoLessonNotes,
} from '@/lib/video-lesson-notes-storage'
import { MUX_ASSET_STATUS, type VideoLesson } from '@/types/video-lesson'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { ActiveToggle } from '@/components/banners/ActiveToggle'
import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import type { SelectOption } from '@/components/ui/SelectField'
import { TextField } from '@/components/ui/TextField'
import { VideoLessonModuleField } from '@/components/videos/VideoLessonModuleField'
import { GenerateThumbnailConfigModal } from '@/components/videos/generate-thumbnail/GenerateThumbnailConfigModal'
import { generateVideoLessonThumbnail } from '@/lib/generate-video-lesson-thumbnail'
import { lessonHasMuxVideo } from '@/lib/video-lesson-thumbnail'
import type { ThumbnailGenerationConfig } from '@/types/thumbnail-generation'
import { VideoLessonMuxStatus } from '@/components/videos/VideoLessonMuxStatus'
import { VideoLessonPlayer } from '@/components/videos/VideoLessonPlayer'
import { VideoLessonThumbnailPreview } from '@/components/videos/VideoLessonThumbnailPreview'
import { VideoLessonNotesUpload } from '@/components/videos/VideoLessonNotesUpload'
import { VideoLessonVideoUpload } from '@/components/videos/VideoLessonVideoUpload'

interface EditVideoLessonModalProps {
  isOpen: boolean
  lesson: VideoLesson | null
  subjectId?: string
  moduleNameOptions: SelectOption[]
  onClose: () => void
  onSaved: () => void
}

const textareaClasses =
  'min-h-[100px] w-full resize-y rounded-input border border-border-subtle bg-surface-white px-[13px] py-[10px] text-body-md text-on-surface shadow-tier-1 placeholder:text-on-surface-variant focus:border-primary-action focus:outline-none focus:ring-2 focus:ring-focus-ring'

function getInitialFormState(lesson: VideoLesson | null) {
  return {
    lessonName: lesson?.lessonName ?? '',
    moduleName: lesson?.moduleName ?? '',
    description: lesson?.description ?? '',
    isActive: lesson?.isActive ?? false,
    isFree: lesson?.isFree ?? false,
  }
}

export function EditVideoLessonModal({
  isOpen,
  lesson,
  subjectId,
  moduleNameOptions,
  onClose,
  onSaved,
}: EditVideoLessonModalProps) {
  const { showSnackbar } = useSnackbar()
  const isAddMode = isOpen && !lesson && Boolean(subjectId)

  const [lessonName, setLessonName] = useState('')
  const [moduleName, setModuleNameField] = useState('')
  const [description, setDescription] = useState('')
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
  const [formError, setFormError] = useState<string | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [thumbnailImage, setThumbnailImage] = useState('')
  const [isThumbnailConfigOpen, setIsThumbnailConfigOpen] = useState(false)
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false)
  const [pendingNotesFile, setPendingNotesFile] = useState<File | null>(null)
  const [notesRemoved, setNotesRemoved] = useState(false)
  const [isNotesUploading, setIsNotesUploading] = useState(false)
  const [savedNotesPath, setSavedNotesPath] = useState('')

  const uploadSubjectId = lesson?.subjectId ?? subjectId ?? ''
  const uploadLessonId = lesson?.id ?? createdLessonId ?? ''
  const existingNotesPath = notesRemoved ? null : savedNotesPath.trim() || null
  const isFormBusy = isSubmitting || isVideoUploading || isGeneratingThumbnail || isNotesUploading
  const isAwaitingUploadAfterCreate = Boolean(
    isAddMode &&
      createdLessonId &&
      pendingVideoFile &&
      !hasVideoLinked &&
      isVideoUploading,
  )

  useEffect(() => {
    if (!isOpen) return

    const initial = getInitialFormState(lesson)
    setLessonName(initial.lessonName)
    setModuleNameField(initial.moduleName)
    setDescription(initial.description)
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
    setFormError(undefined)
    setIsSubmitting(false)
    setThumbnailImage(lesson?.thumbnailImage ?? '')
    setIsThumbnailConfigOpen(false)
    setIsGeneratingThumbnail(false)
    setPendingNotesFile(null)
    setNotesRemoved(false)
    setIsNotesUploading(false)
    setSavedNotesPath(lesson?.notes?.trim() ?? '')
  }, [isOpen, lesson])

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

    return valid
  }

  async function syncLessonNotesChanges(
    targetSubjectId: string,
    targetLessonId: string,
    storedNotesPath: string | null,
  ): Promise<void> {
    const hasNotesChanges = notesRemoved || Boolean(pendingNotesFile)
    if (!hasNotesChanges) return

    setIsNotesUploading(true)

    try {
      if (notesRemoved && storedNotesPath) {
        await deleteVideoLessonNotesFromPath(storedNotesPath)
        await updateVideoLessonNotes(targetSubjectId, targetLessonId, '')
        setNotesRemoved(false)
        setSavedNotesPath('')
        return
      }

      if (pendingNotesFile) {
        const storagePath = await uploadVideoLessonNotes(pendingNotesFile, {
          subjectId: targetSubjectId,
          lessonId: targetLessonId,
        })
        await updateVideoLessonNotes(targetSubjectId, targetLessonId, storagePath)
        setPendingNotesFile(null)
        setSavedNotesPath(storagePath)
      }
    } finally {
      setIsNotesUploading(false)
    }
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
    }

    try {
      if (isAddMode && subjectId && !createdLessonId) {
        const newLessonId = await createVideoLesson(subjectId, sharedInput)
        setCreatedLessonId(newLessonId)
        onSaved()

        try {
          await syncLessonNotesChanges(subjectId, newLessonId, null)
        } catch (notesError) {
          const message =
            notesError instanceof Error
              ? notesError.message
              : 'Notes upload failed. Please try again.'
          setFormError(message)
          showSnackbar(message)
          return
        }

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
        try {
          await syncLessonNotesChanges(
            lesson.subjectId,
            lesson.id,
            savedNotesPath.trim() || null,
          )
        } catch (notesError) {
          const message =
            notesError instanceof Error
              ? notesError.message
              : notesRemoved
                ? 'Failed to remove notes. Please try again.'
                : 'Notes upload failed. Please try again.'
          setFormError(message)
          showSnackbar(message)
          return
        }

        await updateVideoLesson(lesson.subjectId, lesson.id, sharedInput)
        showSnackbar('Video lesson updated successfully')
        onSaved()
        onClose()
        return
      }

      if (isAddMode && createdLessonId && subjectId) {
        try {
          await syncLessonNotesChanges(subjectId, createdLessonId, null)
        } catch (notesError) {
          const message =
            notesError instanceof Error
              ? notesError.message
              : 'Notes upload failed. Please try again.'
          setFormError(message)
          showSnackbar(message)
          return
        }

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
      showSnackbar(
        'Video lesson created and uploaded. A thumbnail will be generated automatically when processing finishes.',
      )
      onClose()
      return
    }

    showSnackbar(
      'Video uploaded successfully. A thumbnail will be generated automatically when processing finishes.',
    )
  }

  function handleVideoUploadingChange(isUploading: boolean) {
    setIsVideoUploading(isUploading)
    if (isUploading) {
      setHasVideoLinked(false)
    }
  }

  function openThumbnailConfigModal() {
    if (!lesson || isFormBusy) return
    setIsThumbnailConfigOpen(true)
  }

  function closeThumbnailConfigModal() {
    if (isGeneratingThumbnail) return
    setIsThumbnailConfigOpen(false)
  }

  async function handleConfirmThumbnailGenerate(config: ThumbnailGenerationConfig) {
    if (!lesson) return

    setIsGeneratingThumbnail(true)

    try {
      const nextThumbnailImage = await generateVideoLessonThumbnail(
        lesson.subjectId,
        lesson.id,
        config,
      )
      setThumbnailImage(nextThumbnailImage)
      onSaved()
      showSnackbar('Thumbnail generated successfully')
      setIsThumbnailConfigOpen(false)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to generate thumbnail. Please try again.'
      showSnackbar(message)
    } finally {
      setIsGeneratingThumbnail(false)
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
  const showThumbnailGenerate =
    !isAddMode &&
    lesson &&
    lessonHasMuxVideo(lesson) &&
    !isReplacingOrUploadingVideo &&
    lesson.muxAssetStatus !== MUX_ASSET_STATUS.processing
  const hasThumbnail = Boolean(thumbnailImage.trim())

  return (
    <>
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

            <VideoLessonModuleField
              id="video-lesson-module-name"
              value={moduleName}
              options={moduleNameOptions}
              required
              error={moduleNameError}
              disabled={isFormBusy || isAwaitingUploadAfterCreate}
              onChange={(nextValue) => {
                setModuleNameField(nextValue)
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

          <VideoLessonNotesUpload
            file={pendingNotesFile}
            existingNotesPath={existingNotesPath}
            notesRemoved={notesRemoved}
            disabled={isFormBusy || isAwaitingUploadAfterCreate}
            deferUploadUntilSave={isAddMode && !createdLessonId}
            onFileChange={(file) => {
              setPendingNotesFile(file)
              if (file) setNotesRemoved(false)
            }}
            onRemove={() => {
              if (pendingNotesFile) {
                setPendingNotesFile(null)
                return
              }

              if (savedNotesPath.trim()) {
                setNotesRemoved(true)
              }
            }}
            onUndoRemove={() => setNotesRemoved(false)}
          />

          {!isAddMode && lesson ? (
            <VideoLessonThumbnailPreview
              key={`${lesson.id}-${thumbnailImage}`}
              thumbnailUrl={thumbnailImage}
              lessonName={lesson.lessonName}
              headerAction={
                showThumbnailGenerate ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isFormBusy}
                    onClick={openThumbnailConfigModal}
                    className="gap-1.5 px-3 py-2 text-body-md"
                    aria-label={
                      hasThumbnail
                        ? `Regenerate thumbnail for ${lessonLabel}`
                        : `Generate thumbnail for ${lessonLabel}`
                    }
                  >
                    <MaterialIcon
                      name={isGeneratingThumbnail ? 'hourglass_top' : 'auto_awesome'}
                      size={16}
                    />
                    {isGeneratingThumbnail
                      ? 'Generating...'
                      : hasThumbnail
                        ? 'Regenerate'
                        : 'Generate'}
                  </Button>
                ) : null
              }
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

    {isThumbnailConfigOpen && lesson ? (
      <GenerateThumbnailConfigModal
        action={{
          type: 'single',
          lessonLabel,
        }}
        isSubmitting={isGeneratingThumbnail}
        onClose={closeThumbnailConfigModal}
        onConfirm={handleConfirmThumbnailGenerate}
      />
    ) : null}
    </>
  )
}
