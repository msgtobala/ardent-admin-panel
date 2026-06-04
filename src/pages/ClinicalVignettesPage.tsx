import { useState } from 'react'
import { ClinicalVignettesPageHeader } from '@/components/clinical-vignettes/ClinicalVignettesPageHeader'
import { DeleteClinicalVignetteModal } from '@/components/clinical-vignettes/DeleteClinicalVignetteModal'
import { ViewClinicalVignetteQuestionModal } from '@/components/clinical-vignettes/ViewClinicalVignetteQuestionModal'
import { PreviousClinicalVignettesTable } from '@/components/clinical-vignettes/PreviousClinicalVignettesTable'
import { TodaysClinicalVignetteCard } from '@/components/clinical-vignettes/TodaysClinicalVignetteCard'
import { deletePreviousClinicalVignetteQuestion } from '@/lib/clinical-vignettes'
import { useClinicalVignettes } from '@/hooks/useClinicalVignettes'
import type { ResolvedClinicalVignetteQuestion } from '@/types/clinical-vignette'

export default function ClinicalVignettesPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [deletingQuestion, setDeletingQuestion] =
    useState<ResolvedClinicalVignetteQuestion | null>(null)

  const {
    todaysQuestion,
    previousQuestions,
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
    sortField,
    sortDirection,
    handleSort,
  } = useClinicalVignettes(refreshKey)

  function handleRefresh() {
    setRefreshKey((prev) => prev + 1)
  }

  function handleOpenView() {
    setIsViewOpen(true)
  }

  function handleCloseView() {
    setIsViewOpen(false)
  }

  function handleDeleteQuestion(question: ResolvedClinicalVignetteQuestion) {
    setDeletingQuestion(question)
  }

  function handleCloseDelete() {
    setDeletingQuestion(null)
  }

  async function handleConfirmDelete() {
    if (!deletingQuestion) return
    await deletePreviousClinicalVignetteQuestion(deletingQuestion.id)
    handleRefresh()
  }

  return (
    <div className="flex flex-col gap-gutter">
      <ClinicalVignettesPageHeader />

      <TodaysClinicalVignetteCard
        question={todaysQuestion}
        isLoading={isLoading && !error}
        onView={handleOpenView}
      />

      <PreviousClinicalVignettesTable
        questions={previousQuestions}
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
        onDelete={handleDeleteQuestion}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
      />

      <ViewClinicalVignetteQuestionModal
        isOpen={isViewOpen}
        question={todaysQuestion}
        onClose={handleCloseView}
      />

      <DeleteClinicalVignetteModal
        isOpen={deletingQuestion !== null}
        question={deletingQuestion}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
