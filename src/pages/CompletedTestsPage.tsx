import { useState } from 'react'
import { CompletedGrandTestsPageHeader } from '@/components/grand-tests/CompletedGrandTestsPageHeader'
import { GrandTestsMonthSections } from '@/components/grand-tests/GrandTestsMonthSections'
import { ViewGrandTestLeaderboardModal } from '@/components/grand-tests/ViewGrandTestLeaderboardModal'
import { useCompletedGrandTests } from '@/hooks/useCompletedGrandTests'
import type { GrandTest } from '@/types/grand-test'

export default function CompletedTestsPage() {
  const { monthGroups, isLoading, error, handleRetry } = useCompletedGrandTests()
  const [selectedTest, setSelectedTest] = useState<GrandTest | null>(null)
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false)

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
      <GrandTestsMonthSections
        monthGroups={monthGroups}
        isLoading={isLoading}
        error={error}
        emptyMessage="No completed grand tests yet."
        monthEmptyMessage="No completed tests in this month."
        onRetry={handleRetry}
        showLeaderboard
        onViewLeaderboard={handleViewLeaderboard}
      />
      <ViewGrandTestLeaderboardModal
        isOpen={isLeaderboardOpen}
        test={selectedTest}
        onClose={handleCloseLeaderboard}
      />
    </div>
  )
}
