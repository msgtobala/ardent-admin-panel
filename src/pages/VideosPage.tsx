import { useMemo, useState } from 'react'
import { DeleteVideoLessonModal } from '@/components/videos/DeleteVideoLessonModal'
import { EditVideoLessonModal } from '@/components/videos/EditVideoLessonModal'
import { ReorderVideoLessonsModal } from '@/components/videos/ReorderVideoLessonsModal'
import { VideosLessonsTable } from '@/components/videos/VideosLessonsTable'
import { VideosPageHeader } from '@/components/videos/VideosPageHeader'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { buildVideoLessonModuleOptions } from '@/lib/video-lesson-modules'
import { useVideosPage } from '@/hooks/useVideosPage'
import type { VideoLesson } from '@/types/video-lesson'
import { SelectField, type SelectOption } from '@/components/ui/SelectField'
import { TableErrorState } from '@/components/ui/table'

type VideoLessonModalState =
  | { mode: 'add' }
  | { mode: 'edit'; lesson: VideoLesson }
  | { mode: 'delete'; lesson: VideoLesson }
  | null

export default function VideosPage() {
  const { showSnackbar } = useSnackbar()
  const [modalState, setModalState] = useState<VideoLessonModalState>(null)
  const [isReorderOpen, setIsReorderOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const {
    subjects,
    selectedSubjectId,
    selectedSubject,
    allLessons,
    lessons,
    isLoadingSubjects,
    isLoadingLessons,
    subjectsError,
    lessonsError,
    lessonsIndexUrl,
    currentPage,
    totalPages,
    hasNext,
    hasPrevious,
    handleSubjectChange,
    handleNext,
    handlePrevious,
    handleRetrySubjects,
    handleRetryLessons,
    handleDeleteLesson,
    handleLessonsSaved,
    isLessonsInitialLoading,
    isLessonsPageLoading,
  } = useVideosPage(refreshKey)

  const subjectOptions: SelectOption[] = useMemo(
    () =>
      subjects.map((subject) => ({
        value: subject.id,
        label: subject.subjectName.trim() || subject.id,
      })),
    [subjects],
  )

  function handleAddLesson() {
    if (!selectedSubjectId) {
      showSnackbar('Select a video subject before adding a lesson.')
      return
    }

    setModalState({ mode: 'add' })
  }

  function handleOpenReorderModal() {
    if (!selectedSubjectId) {
      showSnackbar('Select a video subject before editing sort order.')
      return
    }

    setIsReorderOpen(true)
  }

  function handleCloseReorderModal() {
    setIsReorderOpen(false)
  }

  function handleEditLesson(lesson: VideoLesson) {
    setModalState({ mode: 'edit', lesson })
  }

  function handleDeleteLessonClick(lesson: VideoLesson) {
    setModalState({ mode: 'delete', lesson })
  }

  function handleCloseModal() {
    setModalState(null)
  }

  function handleLessonSaved() {
    setRefreshKey((prev) => prev + 1)
    handleLessonsSaved()
  }

  async function handleConfirmDelete() {
    if (modalState?.mode !== 'delete') return
    await handleDeleteLesson(modalState.lesson)
  }

  const isFormModalOpen = modalState?.mode === 'add' || modalState?.mode === 'edit'
  const editingLesson = useMemo(() => {
    if (modalState?.mode !== 'edit') return null
    return allLessons.find((lesson) => lesson.id === modalState.lesson.id) ?? modalState.lesson
  }, [modalState, allLessons])
  const deletingLesson = modalState?.mode === 'delete' ? modalState.lesson : null

  const moduleNameOptions = useMemo(
    () =>
      buildVideoLessonModuleOptions(allLessons, editingLesson?.moduleName),
    [allLessons, editingLesson?.moduleName],
  )

  return (
    <div className="flex flex-col gap-gutter">
      <VideosPageHeader
        onAddLesson={handleAddLesson}
        onEditSortOrder={handleOpenReorderModal}
      />

      <section className="rounded-xl border border-border-subtle bg-surface-white px-gutter py-gutter shadow-tier-1">
        {subjectsError ? (
          <TableErrorState message={subjectsError} onRetry={handleRetrySubjects} />
        ) : (
          <SelectField
            id="videos-subject-select"
            label="Select Subject"
            value={selectedSubjectId}
            options={subjectOptions}
            disabled={isLoadingSubjects}
            placeholder={
              isLoadingSubjects ? 'Loading subjects...' : 'Select a video subject'
            }
            onChange={handleSubjectChange}
          />
        )}
        {selectedSubject ? (
          <p className="mt-3 text-body-md text-on-surface-variant">
            Showing lessons for{' '}
            <span className="font-medium !text-black">
              {selectedSubject.subjectName || selectedSubject.id}
            </span>{' '}
            ({selectedSubject.totalLessons} total)
          </p>
        ) : null}
      </section>

      <VideosLessonsTable
        lessons={lessons}
        currentPage={currentPage}
        totalPages={totalPages}
        isLoading={isLoadingLessons}
        isInitialLoading={isLessonsInitialLoading}
        isPageLoading={isLessonsPageLoading}
        hasSubjectSelected={Boolean(selectedSubjectId)}
        error={lessonsError}
        errorIndexUrl={lessonsIndexUrl}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onRetry={handleRetryLessons}
        onEdit={handleEditLesson}
        onDelete={handleDeleteLessonClick}
      />

      <EditVideoLessonModal
        key={
          modalState === null
            ? 'closed'
            : modalState.mode === 'edit'
              ? `edit-${modalState.lesson.id}`
              : 'add'
        }
        isOpen={isFormModalOpen}
        lesson={editingLesson}
        subjectId={modalState?.mode === 'add' ? selectedSubjectId : undefined}
        moduleNameOptions={moduleNameOptions}
        onClose={handleCloseModal}
        onSaved={handleLessonSaved}
      />

      <ReorderVideoLessonsModal
        key={
          isReorderOpen
            ? `reorder-video-lessons-open-${selectedSubjectId}`
            : 'reorder-video-lessons-closed'
        }
        isOpen={isReorderOpen}
        subjectId={selectedSubjectId}
        subjectName={selectedSubject?.subjectName ?? ''}
        onClose={handleCloseReorderModal}
        onSaved={handleLessonSaved}
      />

      <DeleteVideoLessonModal
        isOpen={deletingLesson !== null}
        lesson={deletingLesson}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
