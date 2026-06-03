import { useState } from 'react'
import { DeleteFacultyModal } from '@/components/faculties/DeleteFacultyModal'
import { EditFacultyModal } from '@/components/faculties/EditFacultyModal'
import { FacultiesPageHeader } from '@/components/faculties/FacultiesPageHeader'
import { FacultiesTable } from '@/components/faculties/FacultiesTable'
import { useFaculties } from '@/hooks/useFaculties'
import type { Faculty } from '@/types/faculty'

type FacultyModalState =
  | { mode: 'add' }
  | { mode: 'edit'; faculty: Faculty }
  | { mode: 'delete'; faculty: Faculty }
  | null

export default function FacultiesPage() {
  const [modalState, setModalState] = useState<FacultyModalState>(null)
  const {
    faculties,
    currentPage,
    totalPages,
    isLoading,
    isInitialLoading,
    isPageLoading,
    error,
    hasNext,
    hasPrevious,
    sortField,
    sortDirection,
    handleSort,
    handleNext,
    handlePrevious,
    handleRetry,
    handleDelete,
    refreshFaculties,
  } = useFaculties()

  function handleNewFaculty() {
    setModalState({ mode: 'add' })
  }

  function handleEditFaculty(faculty: Faculty) {
    setModalState({ mode: 'edit', faculty })
  }

  function handleDeleteFaculty(faculty: Faculty) {
    setModalState({ mode: 'delete', faculty })
  }

  function handleCloseModal() {
    setModalState(null)
  }

  function handleFacultySaved() {
    refreshFaculties()
  }

  async function handleConfirmDelete() {
    if (modalState?.mode !== 'delete') return
    await handleDelete(modalState.faculty.id)
  }

  const isFormModalOpen =
    modalState?.mode === 'add' || modalState?.mode === 'edit'
  const editingFaculty =
    modalState?.mode === 'edit' ? modalState.faculty : null
  const deletingFaculty =
    modalState?.mode === 'delete' ? modalState.faculty : null

  return (
    <div className="flex flex-col gap-gutter">
      <FacultiesPageHeader onNewFaculty={handleNewFaculty} />
      <FacultiesTable
        faculties={faculties}
        currentPage={currentPage}
        totalPages={totalPages}
        isLoading={isLoading}
        isInitialLoading={isInitialLoading}
        isPageLoading={isPageLoading}
        error={error}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onRetry={handleRetry}
        onEdit={handleEditFaculty}
        onDelete={handleDeleteFaculty}
      />
      <EditFacultyModal
        key={
          modalState === null
            ? 'closed'
            : modalState.mode === 'edit'
              ? `edit-${modalState.faculty.id}`
              : modalState.mode === 'add'
                ? 'add'
                : 'closed'
        }
        isOpen={isFormModalOpen}
        faculty={editingFaculty}
        onClose={handleCloseModal}
        onSaved={handleFacultySaved}
      />
      <DeleteFacultyModal
        isOpen={deletingFaculty !== null}
        faculty={deletingFaculty}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
