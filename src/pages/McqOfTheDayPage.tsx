import { useState } from 'react'
import { ViewClinicalVignetteQuestionModal } from '@/components/clinical-vignettes/ViewClinicalVignetteQuestionModal'
import { DeleteMcqModal } from '@/components/mcq-of-the-day/DeleteMcqModal'
import { McqOfTheDayPageHeader } from '@/components/mcq-of-the-day/McqOfTheDayPageHeader'
import { PreviousMcqTable } from '@/components/mcq-of-the-day/PreviousMcqTable'
import { TodaysMcqCard } from '@/components/mcq-of-the-day/TodaysMcqCard'
import { deletePreviousMcqQuestion } from '@/lib/mcq-of-the-day'
import { useMcqOfTheDay } from '@/hooks/useMcqOfTheDay'
import type { ResolvedMcqOfTheDayQuestion } from '@/types/mcq-of-the-day'

export default function McqOfTheDayPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [deletingQuestion, setDeletingQuestion] = useState<ResolvedMcqOfTheDayQuestion | null>(
    null,
  )

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
  } = useMcqOfTheDay(refreshKey)

  function handleRefresh() {
    setRefreshKey((prev) => prev + 1)
  }

  function handleOpenView() {
    setIsViewOpen(true)
  }

  function handleCloseView() {
    setIsViewOpen(false)
  }

  function handleDeleteQuestion(question: ResolvedMcqOfTheDayQuestion) {
    setDeletingQuestion(question)
  }

  function handleCloseDelete() {
    setDeletingQuestion(null)
  }

  async function handleConfirmDelete() {
    if (!deletingQuestion) return
    await deletePreviousMcqQuestion(deletingQuestion.id)
    handleRefresh()
  }

  return (
    <div className="flex flex-col gap-gutter">
      <McqOfTheDayPageHeader />

      <TodaysMcqCard
        question={todaysQuestion}
        isLoading={isLoading && !error}
        onView={handleOpenView}
      />

      <PreviousMcqTable
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

      <DeleteMcqModal
        isOpen={deletingQuestion !== null}
        question={deletingQuestion}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
