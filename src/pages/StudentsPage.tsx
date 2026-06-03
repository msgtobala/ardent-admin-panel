import { useState } from 'react'
import { EditStudentModal } from '@/components/students/EditStudentModal'
import { StudentsPageHeader } from '@/components/students/StudentsPageHeader'
import { StudentsTable } from '@/components/students/StudentsTable'
import { useStudents } from '@/hooks/useStudents'
import type { Student } from '@/types/student'

export default function StudentsPage() {
  const [editingStudentUid, setEditingStudentUid] = useState<string | null>(null)
  const {
    students,
    searchInput,
    appliedSearchQuery,
    handleSearchInputChange,
    handleSearchSubmit,
    handleSearchClear,
    isSearchActive,
    currentPage,
    totalPages,
    isLoading,
    isInitialLoading,
    isPageLoading,
    error,
    errorIndexUrl,
    hasNext,
    hasPrevious,
    sortField,
    sortDirection,
    handleSort,
    handleNext,
    handlePrevious,
    handleRetry,
    refreshStudents,
  } = useStudents()

  function handleEditStudent(student: Student) {
    setEditingStudentUid(student.uid)
  }

  function handleCloseEditModal() {
    setEditingStudentUid(null)
  }

  function handleStudentSaved() {
    refreshStudents()
  }

  function handleOpenStudentDetails(_student: Student) {
    // Student detail navigation will be implemented in a follow-up.
  }

  return (
    <div className="flex flex-col gap-gutter">
      <StudentsPageHeader
        searchInput={searchInput}
        appliedSearchQuery={appliedSearchQuery}
        onSearchInputChange={handleSearchInputChange}
        onSearchSubmit={handleSearchSubmit}
        onSearchClear={handleSearchClear}
        disabled={isInitialLoading}
        isSearching={isPageLoading && isSearchActive}
      />
      <StudentsTable
        students={students}
        currentPage={currentPage}
        totalPages={totalPages}
        isLoading={isLoading}
        isInitialLoading={isInitialLoading}
        isPageLoading={isPageLoading}
        error={error}
        errorIndexUrl={errorIndexUrl}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        sortField={sortField}
        sortDirection={sortDirection}
        isSortDisabled={isSearchActive}
        onSort={handleSort}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onRetry={handleRetry}
        onEdit={handleEditStudent}
        onOpenDetails={handleOpenStudentDetails}
      />
      <EditStudentModal
        key={editingStudentUid ? `edit-student-${editingStudentUid}` : 'edit-student-closed'}
        isOpen={editingStudentUid !== null}
        studentUid={editingStudentUid}
        onClose={handleCloseEditModal}
        onSaved={handleStudentSaved}
      />
    </div>
  )
}
