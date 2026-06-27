import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore'
import { useCallback, useEffect, useState } from 'react'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { getFirestoreErrorDetails } from '@/lib/firestore-error'
import { isUserQueryStatusFilter } from '@/lib/user-query-display'
import {
  USER_QUERIES_PAGE_SIZE,
  fetchUserQueriesPage,
  getUserQueriesCount,
  updateUserQueryStatus,
} from '@/lib/user-queries'
import type {
  SortDirection,
  UserQuery,
  UserQuerySortField,
  UserQueryStatus,
  UserQueryStatusFilter,
} from '@/types/user-query'

export type UserQueryStatusAction = 'resolve' | 'reject' | 'reopen'

export function useUserQueriesPage() {
  const { showSnackbar } = useSnackbar()
  const [queries, setQueries] = useState<UserQuery[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | undefined>()
  const [errorIndexUrl, setErrorIndexUrl] = useState<string | undefined>()
  const [pageIndex, setPageIndex] = useState(0)
  const [pageCursors, setPageCursors] = useState<
    (QueryDocumentSnapshot<DocumentData> | null)[]
  >([null])
  const [hasNext, setHasNext] = useState(false)
  const [lastDocOnPage, setLastDocOnPage] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [sortField, setSortField] = useState<UserQuerySortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [statusFilter, setStatusFilter] = useState<UserQueryStatusFilter>('all')
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)
  const [pendingStatusAction, setPendingStatusAction] =
    useState<UserQueryStatusAction | null>(null)

  const hasPrevious = pageIndex > 0
  const currentPage = pageIndex + 1
  const totalPages =
    totalCount === 0 ? 1 : Math.ceil(totalCount / USER_QUERIES_PAGE_SIZE)

  const resetPagination = useCallback(() => {
    setQueries([])
    setPageIndex(0)
    setPageCursors([null])
  }, [])

  const loadPage = useCallback(
    async (cursor: QueryDocumentSnapshot<DocumentData> | null) => {
      setIsLoading(true)
      setError(undefined)
      setErrorIndexUrl(undefined)

      try {
        const shouldFetchCount = cursor === null
        const [pageResult, count] = await Promise.all([
          fetchUserQueriesPage({
            pageSize: USER_QUERIES_PAGE_SIZE,
            lastDoc: cursor,
            sortField,
            sortDirection,
            statusFilter,
          }),
          shouldFetchCount
            ? getUserQueriesCount(statusFilter)
            : Promise.resolve(undefined),
        ])

        setQueries(pageResult.queries)
        if (count !== undefined) setTotalCount(count)
        setHasNext(pageResult.hasMore)
        setLastDocOnPage(pageResult.lastDoc)
      } catch (loadError) {
        const details = getFirestoreErrorDetails(
          loadError,
          'Failed to load user queries. Please try again.',
        )
        setError(details.message)
        setErrorIndexUrl(details.indexUrl)
      } finally {
        setIsLoading(false)
      }
    },
    [sortField, sortDirection, statusFilter],
  )

  useEffect(() => {
    loadPage(pageCursors[pageIndex] ?? null)
  }, [pageIndex, pageCursors, loadPage])

  const handleSort = useCallback(
    (field: UserQuerySortField) => {
      resetPagination()

      if (sortField === field) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
        return
      }

      setSortField(field)
      setSortDirection(field === 'createdAt' ? 'desc' : 'asc')
    },
    [resetPagination, sortField],
  )

  const handleStatusFilterChange = useCallback(
    (value: string) => {
      if (!isUserQueryStatusFilter(value) || value === statusFilter) return
      setStatusFilter(value)
      resetPagination()
    },
    [resetPagination, statusFilter],
  )

  const handleNext = useCallback(() => {
    if (!hasNext || isLoading || !lastDocOnPage) return

    setPageCursors((prev) => {
      const next = [...prev]
      next[pageIndex + 1] = lastDocOnPage
      return next
    })
    setPageIndex((prev) => prev + 1)
  }, [hasNext, isLoading, lastDocOnPage, pageIndex])

  const handlePrevious = useCallback(() => {
    if (!hasPrevious || isLoading) return
    setPageIndex((prev) => prev - 1)
  }, [hasPrevious, isLoading])

  const handleRetry = useCallback(() => {
    loadPage(pageCursors[pageIndex] ?? null)
  }, [loadPage, pageCursors, pageIndex])

  const refreshQueries = useCallback(() => {
    resetPagination()
  }, [resetPagination])

  const statusSuccessMessage: Record<UserQueryStatus, string> = {
    opened: 'Ticket reopened',
    resolved: 'Ticket marked as resolved',
    rejected: 'Ticket rejected',
  }

  const statusFailureMessage: Record<UserQueryStatus, string> = {
    opened: 'Failed to reopen ticket. Please try again.',
    resolved: 'Failed to resolve ticket. Please try again.',
    rejected: 'Failed to reject ticket. Please try again.',
  }

  const handleUpdateStatus = useCallback(
    async (
      id: string,
      status: UserQueryStatus,
      action: UserQueryStatusAction,
    ) => {
      setUpdatingStatusId(id)
      setPendingStatusAction(action)

      try {
        await updateUserQueryStatus(id, status)
        setQueries((prev) => {
          if (statusFilter !== 'all' && status !== statusFilter) {
            setTotalCount((count) => Math.max(0, count - 1))
            return prev.filter((query) => query.id !== id)
          }

          return prev.map((query) =>
            query.id === id ? { ...query, status } : query,
          )
        })
        showSnackbar(statusSuccessMessage[status])
      } catch {
        showSnackbar(statusFailureMessage[status])
      } finally {
        setUpdatingStatusId(null)
        setPendingStatusAction(null)
      }
    },
    [showSnackbar, statusFilter],
  )

  const handleResolve = useCallback(
    async (id: string) => handleUpdateStatus(id, 'resolved', 'resolve'),
    [handleUpdateStatus],
  )

  const handleReject = useCallback(
    async (id: string) => handleUpdateStatus(id, 'rejected', 'reject'),
    [handleUpdateStatus],
  )

  const handleReopen = useCallback(
    async (id: string) => handleUpdateStatus(id, 'opened', 'reopen'),
    [handleUpdateStatus],
  )

  const isInitialLoading = isLoading && queries.length === 0
  const isPageLoading = isLoading && queries.length > 0

  return {
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
    handleUpdateStatus,
    handleResolve,
    handleReject,
    handleReopen,
    refreshQueries,
  }
}
