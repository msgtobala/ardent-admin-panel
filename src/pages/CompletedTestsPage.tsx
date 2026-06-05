import { CompletedGrandTestsPageHeader } from '@/components/grand-tests/CompletedGrandTestsPageHeader'
import { GrandTestsMonthSections } from '@/components/grand-tests/GrandTestsMonthSections'
import { useCompletedGrandTests } from '@/hooks/useCompletedGrandTests'

export default function CompletedTestsPage() {
  const { monthGroups, isLoading, error, handleRetry } = useCompletedGrandTests()

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
      />
    </div>
  )
}
