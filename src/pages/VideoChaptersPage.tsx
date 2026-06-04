import { useState } from 'react'
import { EditVideoSubjectModal } from '@/components/video-subjects/EditVideoSubjectModal'
import { ReorderVideoSubjectsModal } from '@/components/video-subjects/ReorderVideoSubjectsModal'
import { VideoSubjectsPageHeader } from '@/components/video-subjects/VideoSubjectsPageHeader'
import { VideoSubjectsTable } from '@/components/video-subjects/VideoSubjectsTable'
import { useVideoSubjects } from '@/hooks/useVideoSubjects'
import type { VideoSubject } from '@/types/video-subject'

type VideoSubjectModalState =
  | { mode: 'add' }
  | { mode: 'edit'; subject: VideoSubject }
  | null

export default function VideoChaptersPage() {
  const [modalState, setModalState] = useState<VideoSubjectModalState>(null)
  const [isReorderOpen, setIsReorderOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const {
    subjects,
    currentPage,
    totalPages,
    isLoading,
    isInitialLoading,
    isPageLoading,
    error,
    indexUrl,
    hasNext,
    hasPrevious,
    handleNext,
    handlePrevious,
    handleRetry,
    handleToggleIsActive,
  } = useVideoSubjects(refreshKey)

  function handleNewSubject() {
    setModalState({ mode: 'add' })
  }

  function handleEditSubject(subject: VideoSubject) {
    setModalState({ mode: 'edit', subject })
  }

  function handleCloseFormModal() {
    setModalState(null)
  }

  function handleOpenReorderModal() {
    setIsReorderOpen(true)
  }

  function handleCloseReorderModal() {
    setIsReorderOpen(false)
  }

  function handleSubjectsUpdated() {
    setRefreshKey((prev) => prev + 1)
  }

  const isFormModalOpen =
    modalState?.mode === 'add' || modalState?.mode === 'edit'
  const editingSubject =
    modalState?.mode === 'edit' ? modalState.subject : null

  return (
    <div className="flex flex-col gap-gutter">
      <VideoSubjectsPageHeader
        onNewSubject={handleNewSubject}
        onEditSortOrder={handleOpenReorderModal}
      />
      <VideoSubjectsTable
        subjects={subjects}
        currentPage={currentPage}
        totalPages={totalPages}
        isLoading={isLoading}
        isInitialLoading={isInitialLoading}
        isPageLoading={isPageLoading}
        error={error}
        errorIndexUrl={indexUrl}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onRetry={handleRetry}
        onToggleIsActive={handleToggleIsActive}
        onEdit={handleEditSubject}
      />
      <EditVideoSubjectModal
        key={
          modalState === null
            ? 'closed'
            : modalState.mode === 'edit'
              ? `edit-${modalState.subject.id}`
              : 'add'
        }
        isOpen={isFormModalOpen}
        subject={editingSubject}
        onClose={handleCloseFormModal}
        onSaved={handleSubjectsUpdated}
      />
      <ReorderVideoSubjectsModal
        key={isReorderOpen ? 'reorder-video-subjects-open' : 'reorder-video-subjects-closed'}
        isOpen={isReorderOpen}
        onClose={handleCloseReorderModal}
        onSaved={handleSubjectsUpdated}
      />
    </div>
  )
}
