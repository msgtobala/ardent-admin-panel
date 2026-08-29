import { useNavigate } from 'react-router-dom'
import { ActiveGrandTestsPageHeader } from '@/components/grand-tests/ActiveGrandTestsPageHeader'
import { GrandTestsMonthSections } from '@/components/grand-tests/GrandTestsMonthSections'
import { useActiveGrandTests } from '@/hooks/useActiveGrandTests'
import { useGrandTestQuestionsExport } from '@/hooks/useGrandTestQuestionsExport'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import type { GrandTest } from '@/types/grand-test'

export default function ActiveTestsPage() {
  const navigate = useNavigate()
  const { monthGroups, isLoading, error, handleRetry } = useActiveGrandTests()
  const {
    exportingTestId,
    error: exportError,
    clearExportError,
    handleExportQuestions,
  } = useGrandTestQuestionsExport()

  function handleEditTest(test: GrandTest) {
    navigate(`/grand-tests/${test.id}/edit`)
  }

  return (
    <div className="flex flex-col gap-gutter">
      <ActiveGrandTestsPageHeader />
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
        emptyMessage="No active grand tests yet. Add a new test with the Add New Test button."
        monthEmptyMessage="No tests in this month."
        onRetry={handleRetry}
        showEdit
        onEdit={handleEditTest}
        showExport
        onExportQuestions={handleExportQuestions}
        exportingTestId={exportingTestId}
      />
    </div>
  )
}
