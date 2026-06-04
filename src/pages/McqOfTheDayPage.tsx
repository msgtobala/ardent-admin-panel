import { useState } from 'react'
import { ViewClinicalVignetteQuestionModal } from '@/components/clinical-vignettes/ViewClinicalVignetteQuestionModal'
import { McqOfTheDayPageHeader } from '@/components/mcq-of-the-day/McqOfTheDayPageHeader'
import { PreviousMcqTable } from '@/components/mcq-of-the-day/PreviousMcqTable'
import { TodaysMcqCard } from '@/components/mcq-of-the-day/TodaysMcqCard'
import { useMcqOfTheDay } from '@/hooks/useMcqOfTheDay'
import type { ResolvedMcqOfTheDayQuestion } from '@/types/mcq-of-the-day'

export default function McqOfTheDayPage() {
  const [viewingQuestion, setViewingQuestion] = useState<ResolvedMcqOfTheDayQuestion | null>(
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
  } = useMcqOfTheDay()

  function handleViewQuestion(question: ResolvedMcqOfTheDayQuestion) {
    setViewingQuestion(question)
  }

  function handleCloseView() {
    setViewingQuestion(null)
  }

  return (
    <div className="flex flex-col gap-gutter">
      <McqOfTheDayPageHeader />

      <TodaysMcqCard
        question={todaysQuestion}
        isLoading={isLoading && !error}
        onView={() => {
          if (todaysQuestion) handleViewQuestion(todaysQuestion)
        }}
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
        onView={handleViewQuestion}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
      />

      <ViewClinicalVignetteQuestionModal
        isOpen={viewingQuestion !== null}
        question={viewingQuestion}
        onClose={handleCloseView}
        showMcqAttendanceStats
        modalSubtitle="Complete qbank question for today's MCQ of the day"
      />
    </div>
  )
}
