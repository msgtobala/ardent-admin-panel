import { useState } from 'react'
import { CompletedGrandTestsPageHeader } from '@/components/grand-tests/CompletedGrandTestsPageHeader'
import { GrandTestsMonthSections } from '@/components/grand-tests/GrandTestsMonthSections'
import { ViewGrandTestLeaderboardModal } from '@/components/grand-tests/ViewGrandTestLeaderboardModal'
import { useCompletedGrandTests } from '@/hooks/useCompletedGrandTests'
import { useGrandTestQuestionsExport } from '@/hooks/useGrandTestQuestionsExport'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import type { GrandTest } from '@/types/grand-test'

export default function CompletedTestsPage() {
  const { monthGroups, isLoading, error, handleRetry } = useCompletedGrandTests()
  const [selectedTest, setSelectedTest] = useState<GrandTest | null>(null)
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false)
  const {
    exportingTestId,
    error: exportError,
    clearExportError,
    handleExportQuestions,
  } = useGrandTestQuestionsExport()

  function handleViewLeaderboard(test: GrandTest) {
    setSelectedTest(test)
    setIsLeaderboardOpen(true)
  }

  function handleCloseLeaderboard() {
    setIsLeaderboardOpen(false)
    setSelectedTest(null)
  }

  return (
    <div className="flex flex-col gap-gutter">
      <CompletedGrandTestsPageHeader />
      {exportError ? (
        <div
          role="alert"
          className="flex items-start justify-between gap-4 rounded-xl border border-error/20 bg-error-bg px-4 py-3"
        >
          <p className="text-body-md text-error">{exportError}</p>
          <button
            type="button"
            aria-label="Dismiss export error"
            onClick={clearExportError}
            className="cursor-pointer rounded-lg p-1 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <MaterialIcon name="close" size={18} className="text-error" />
          </button>
        </div>
      ) : null}
      <GrandTestsMonthSections
        monthGroups={monthGroups}
        isLoading={isLoading}
        error={error}
        emptyMessage="No completed grand tests yet."
        monthEmptyMessage="No completed tests in this month."
        onRetry={handleRetry}
        showLeaderboard
        onViewLeaderboard={handleViewLeaderboard}
        showExport
        onExportQuestions={handleExportQuestions}
        exportingTestId={exportingTestId}
      />
      <ViewGrandTestLeaderboardModal
        isOpen={isLeaderboardOpen}
        test={selectedTest}
        onClose={handleCloseLeaderboard}
      />
    </div>
  )
}
