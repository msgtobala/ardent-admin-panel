import { useState } from 'react'
import { UserQueriesPageHeader } from '@/components/user-queries/UserQueriesPageHeader'
import { UserQueriesTable } from '@/components/user-queries/UserQueriesTable'
import { ViewUserQueryModal } from '@/components/user-queries/ViewUserQueryModal'
import { useUserQueriesPage } from '@/hooks/useUserQueriesPage'
import type { UserQuery } from '@/types/user-query'

export default function UserQueriesPage() {
  const [viewingQuery, setViewingQuery] = useState<UserQuery | null>(null)
  const {
    queries,
    totalCount,
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
    statusFilter,
    updatingStatusId,
    pendingStatusAction,
    handleSort,
    handleStatusFilterChange,
    handleNext,
    handlePrevious,
    handleRetry,
    handleResolve,
    handleReject,
    handleReopen,
  } = useUserQueriesPage()

  const activeViewingQuery = viewingQuery
    ? (queries.find((query) => query.id === viewingQuery.id) ?? viewingQuery)
    : null

  function handleViewQuery(query: UserQuery) {
    setViewingQuery(query)
  }

  function handleCloseModal() {
    setViewingQuery(null)
  }

  return (
    <div className="flex flex-col gap-gutter">
      <UserQueriesPageHeader
        totalCount={totalCount}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        disabled={isInitialLoading}
      />
      <UserQueriesTable
        queries={queries}
        currentPage={currentPage}
        totalPages={totalPages}
        isLoading={isLoading}
        isInitialLoading={isInitialLoading}
        isPageLoading={isPageLoading}
        error={error}
        errorIndexUrl={errorIndexUrl}
        statusFilter={statusFilter}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        sortField={sortField}
        sortDirection={sortDirection}
        updatingStatusId={updatingStatusId}
        onSort={handleSort}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onRetry={handleRetry}
        onView={handleViewQuery}
        onResolve={handleResolve}
        onReject={handleReject}
        onReopen={handleReopen}
      />
      <ViewUserQueryModal
        isOpen={viewingQuery !== null}
        query={activeViewingQuery}
        isUpdatingStatus={updatingStatusId === viewingQuery?.id}
        pendingStatusAction={
          updatingStatusId === viewingQuery?.id ? pendingStatusAction : null
        }
        onClose={handleCloseModal}
        onResolve={handleResolve}
        onReject={handleReject}
        onReopen={handleReopen}
      />
    </div>
  )
}
