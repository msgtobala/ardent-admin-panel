import { useNavigate } from 'react-router-dom'
import { ActiveGrandTestsPageHeader } from '@/components/grand-tests/ActiveGrandTestsPageHeader'
import { GrandTestsMonthSections } from '@/components/grand-tests/GrandTestsMonthSections'
import { useActiveGrandTests } from '@/hooks/useActiveGrandTests'
import type { GrandTest } from '@/types/grand-test'

export default function ActiveTestsPage() {
  const navigate = useNavigate()
  const { monthGroups, isLoading, error, handleRetry } = useActiveGrandTests()

  function handleEditTest(test: GrandTest) {
    navigate(`/grand-tests/${test.id}/edit`)
  }

  return (
    <div className="flex flex-col gap-gutter">
      <ActiveGrandTestsPageHeader />
      <GrandTestsMonthSections
        monthGroups={monthGroups}
        isLoading={isLoading}
        error={error}
        emptyMessage="No active grand tests yet. Add a new test with the Add New Test button."
        monthEmptyMessage="No tests in this month."
        onRetry={handleRetry}
        showEdit
        onEdit={handleEditTest}
      />
    </div>
  )
}
