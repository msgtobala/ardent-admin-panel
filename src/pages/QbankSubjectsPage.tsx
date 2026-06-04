import { useState } from 'react'
import { EditQbankSubjectModal } from '@/components/qbank-subjects/EditQbankSubjectModal'
import { QbankSubjectsPageHeader } from '@/components/qbank-subjects/QbankSubjectsPageHeader'
import { QbankSubjectsTable } from '@/components/qbank-subjects/QbankSubjectsTable'
import { ReorderQbankSubjectsModal } from '@/components/qbank-subjects/ReorderQbankSubjectsModal'
import { useQbankSubjects } from '@/hooks/useQbankSubjects'
import type { QbankSubject } from '@/types/qbank-subject'

type QbankSubjectModalState =
  | { mode: 'add' }
  | { mode: 'edit'; subject: QbankSubject }
  | null

export default function QbankSubjectsPage() {
  const [modalState, setModalState] = useState<QbankSubjectModalState>(null)
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
  } = useQbankSubjects(refreshKey)

  function handleNewSubject() {
    setModalState({ mode: 'add' })
  }

  function handleEditSubject(subject: QbankSubject) {
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
      <QbankSubjectsPageHeader
        onNewSubject={handleNewSubject}
        onEditSortOrder={handleOpenReorderModal}
      />
      <QbankSubjectsTable
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
      <EditQbankSubjectModal
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
      <ReorderQbankSubjectsModal
        key={isReorderOpen ? 'reorder-qbank-subjects-open' : 'reorder-qbank-subjects-closed'}
        isOpen={isReorderOpen}
        onClose={handleCloseReorderModal}
        onSaved={handleSubjectsUpdated}
      />
    </div>
  )
}
