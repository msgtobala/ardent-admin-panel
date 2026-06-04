import { useState } from 'react'
import { EditVideoSubjectModal } from '@/components/video-subjects/EditVideoSubjectModal'
import { ReorderVideoSubjectsModal } from '@/components/video-subjects/ReorderVideoSubjectsModal'
import { VideoSubjectsPageHeader } from '@/components/video-subjects/VideoSubjectsPageHeader'
import { VideoSubjectsTable } from '@/components/video-subjects/VideoSubjectsTable'
import { useVideoSubjects } from '@/hooks/useVideoSubjects'
import type { VideoSubject } from '@/types/video-subject'

export default function VideoChaptersPage() {
  const [editingSubject, setEditingSubject] = useState<VideoSubject | null>(null)
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

  function handleEditSubject(subject: VideoSubject) {
    setEditingSubject(subject)
  }

  function handleCloseEditModal() {
    setEditingSubject(null)
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

  return (
    <div className="flex flex-col gap-gutter">
      <VideoSubjectsPageHeader onEditSortOrder={handleOpenReorderModal} />
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
        key={editingSubject ? `edit-video-subject-${editingSubject.id}` : 'edit-video-subject-closed'}
        isOpen={editingSubject !== null}
        subject={editingSubject}
        onClose={handleCloseEditModal}
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
