import { useState } from 'react'
import { AddStudentModal } from '@/components/students/AddStudentModal'
import { EditStudentModal } from '@/components/students/EditStudentModal'
import { ResetStudentDeviceModal } from '@/components/students/ResetStudentDeviceModal'
import { StudentsPageHeader } from '@/components/students/StudentsPageHeader'
import { StudentsTable } from '@/components/students/StudentsTable'
import { useStudents } from '@/hooks/useStudents'
import { resetStudentDeviceDetails } from '@/lib/students'
import type { Student } from '@/types/student'

export default function StudentsPage() {
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false)
  const [editingStudentUid, setEditingStudentUid] = useState<string | null>(null)
  const [resettingStudent, setResettingStudent] = useState<Student | null>(null)
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

  function handleAddStudent() {
    setIsAddStudentOpen(true)
  }

  function handleCloseAddModal() {
    setIsAddStudentOpen(false)
  }

  function handleEditStudent(student: Student) {
    setEditingStudentUid(student.uid)
  }

  function handleCloseEditModal() {
    setEditingStudentUid(null)
  }

  function handleStudentSaved() {
    refreshStudents()
  }

  function handleResetDevice(student: Student) {
    setResettingStudent(student)
  }

  function handleCloseResetModal() {
    setResettingStudent(null)
  }

  async function handleConfirmReset() {
    if (!resettingStudent) return
    await resetStudentDeviceDetails(resettingStudent.uid)
    refreshStudents()
  }

  return (
    <div className="flex flex-col gap-gutter">
      <StudentsPageHeader
        searchInput={searchInput}
        appliedSearchQuery={appliedSearchQuery}
        onSearchInputChange={handleSearchInputChange}
        onSearchSubmit={handleSearchSubmit}
        onSearchClear={handleSearchClear}
        onAddStudent={handleAddStudent}
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
        onResetDevice={handleResetDevice}
      />
      <AddStudentModal
        key={isAddStudentOpen ? 'add-student-open' : 'add-student-closed'}
        isOpen={isAddStudentOpen}
        onClose={handleCloseAddModal}
        onSaved={handleStudentSaved}
      />
      <EditStudentModal
        key={editingStudentUid ? `edit-student-${editingStudentUid}` : 'edit-student-closed'}
        isOpen={editingStudentUid !== null}
        studentUid={editingStudentUid}
        onClose={handleCloseEditModal}
        onSaved={handleStudentSaved}
      />
      <ResetStudentDeviceModal
        key={resettingStudent ? `reset-device-${resettingStudent.uid}` : 'reset-device-closed'}
        isOpen={resettingStudent !== null}
        student={resettingStudent}
        onClose={handleCloseResetModal}
        onConfirm={handleConfirmReset}
      />
    </div>
  )
}
