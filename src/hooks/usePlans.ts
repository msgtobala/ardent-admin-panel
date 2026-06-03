import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore'
import { useCallback, useEffect, useState } from 'react'
import {
  PLANS_PAGE_SIZE,
  fetchPlansPage,
  getPlansCount,
  updatePlanIsActive,
} from '@/lib/plans'
import type { Plan, PlanSortField, SortDirection } from '@/types/plan'

export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | undefined>()
  const [pageIndex, setPageIndex] = useState(0)
  const [pageCursors, setPageCursors] = useState<
    (QueryDocumentSnapshot<DocumentData> | null)[]
  >([null])
  const [hasNext, setHasNext] = useState(false)
  const [lastDocOnPage, setLastDocOnPage] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [sortField, setSortField] = useState<PlanSortField>('planName')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [actionError, setActionError] = useState<string | undefined>()

  const hasPrevious = pageIndex > 0

  const currentPage = pageIndex + 1
  const totalPages =
    totalCount === 0 ? 1 : Math.ceil(totalCount / PLANS_PAGE_SIZE)

  const loadPage = useCallback(
    async (cursor: QueryDocumentSnapshot<DocumentData> | null) => {
      setIsLoading(true)
      setError(undefined)

      try {
        const shouldFetchCount = cursor === null
        const [pageResult, count] = await Promise.all([
          fetchPlansPage({
            pageSize: PLANS_PAGE_SIZE,
            lastDoc: cursor,
            sortField,
            sortDirection,
          }),
          shouldFetchCount ? getPlansCount() : Promise.resolve(undefined),
        ])

        setPlans(pageResult.plans)
        if (count !== undefined) setTotalCount(count)
        setHasNext(pageResult.hasMore)
        setLastDocOnPage(pageResult.lastDoc)
      } catch {
        setError('Failed to load plans. Please try again.')
      } finally {
        setIsLoading(false)
      }
    },
    [sortField, sortDirection],
  )

  useEffect(() => {
    loadPage(pageCursors[pageIndex] ?? null)
  }, [pageIndex, pageCursors, loadPage])

  const handleSort = useCallback(
    (field: PlanSortField) => {
      setPlans([])
      setPageIndex(0)
      setPageCursors([null])

      if (sortField === field) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
        return
      }

      setSortField(field)
      setSortDirection('asc')
    },
    [sortField],
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

  const refreshPlans = useCallback(() => {
    setPageIndex(0)
    setPageCursors([null])
  }, [])

  const handleToggleIsActive = useCallback(
    async (id: string, isActive: boolean) => {
      setActionError(undefined)
      const previousPlans = plans

      setPlans((prev) =>
        prev.map((plan) => (plan.id === id ? { ...plan, isActive } : plan)),
      )

      try {
        await updatePlanIsActive(id, isActive)
      } catch {
        setPlans(previousPlans)
        setActionError('Failed to update plan status. Please try again.')
      }
    },
    [plans],
  )

  const isInitialLoading = isLoading && plans.length === 0
  const isPageLoading = isLoading && plans.length > 0

  return {
    plans,
    currentPage,
    totalPages,
    isLoading,
    isInitialLoading,
    isPageLoading,
    error,
    actionError,
    hasNext,
    hasPrevious,
    sortField,
    sortDirection,
    handleSort,
    handleNext,
    handlePrevious,
    handleRetry,
    handleToggleIsActive,
    refreshPlans,
  }
}
