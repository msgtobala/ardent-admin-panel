import { useState } from 'react'
import { ClinicalVignettesPageHeader } from '@/components/clinical-vignettes/ClinicalVignettesPageHeader'
import { ViewClinicalVignetteQuestionModal } from '@/components/clinical-vignettes/ViewClinicalVignetteQuestionModal'
import { PreviousClinicalVignettesTable } from '@/components/clinical-vignettes/PreviousClinicalVignettesTable'
import { TodaysClinicalVignetteCard } from '@/components/clinical-vignettes/TodaysClinicalVignetteCard'
import { useClinicalVignettes } from '@/hooks/useClinicalVignettes'
import type { ResolvedClinicalVignetteQuestion } from '@/types/clinical-vignette'

export default function ClinicalVignettesPage() {
  const [viewingQuestion, setViewingQuestion] =
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
  } = useClinicalVignettes()

  function handleViewQuestion(question: ResolvedClinicalVignetteQuestion) {
    setViewingQuestion(question)
  }

  function handleCloseView() {
    setViewingQuestion(null)
  }

  return (
    <div className="flex flex-col gap-gutter">
      <ClinicalVignettesPageHeader />

      <TodaysClinicalVignetteCard
        question={todaysQuestion}
        isLoading={isLoading && !error}
        onView={() => {
          if (todaysQuestion) handleViewQuestion(todaysQuestion)
        }}
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
        onView={handleViewQuestion}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
      />

      <ViewClinicalVignetteQuestionModal
        isOpen={viewingQuestion !== null}
        question={viewingQuestion}
        onClose={handleCloseView}
      />
    </div>
  )
}
