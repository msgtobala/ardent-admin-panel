import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FirestorePlanType } from '@/config/plan-sections'
import { getFirestoreErrorDetails } from '@/lib/firestore-error'
import {
  PLANS_PAGE_SIZE,
  fetchPlansByType,
  updatePlanIsActive,
} from '@/lib/plans'
import { isFreePlan } from '@/lib/plan-utils'
import type { Plan } from '@/types/plan'

export function usePlanSection(planType: FirestorePlanType, refreshKey = 0) {
  const [allPlans, setAllPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | undefined>()
  const [indexUrl, setIndexUrl] = useState<string | undefined>()
  const [pageIndex, setPageIndex] = useState(0)
  const [actionError, setActionError] = useState<string | undefined>()

  const totalCount = allPlans.length
  const totalPages =
    totalCount === 0 ? 1 : Math.ceil(totalCount / PLANS_PAGE_SIZE)
  const hasPrevious = pageIndex > 0
  const hasNext = (pageIndex + 1) * PLANS_PAGE_SIZE < totalCount
  const currentPage = pageIndex + 1

  const plans = useMemo(() => {
    const start = pageIndex * PLANS_PAGE_SIZE
    return allPlans.slice(start, start + PLANS_PAGE_SIZE)
  }, [allPlans, pageIndex])

  const loadPlans = useCallback(async () => {
    setIsLoading(true)
    setError(undefined)
    setIndexUrl(undefined)

    try {
      const nextPlans = await fetchPlansByType(planType)
      setAllPlans(nextPlans)
      setPageIndex(0)
    } catch (loadError) {
      const details = getFirestoreErrorDetails(loadError)
      setError(details.message)
      setIndexUrl(details.indexUrl)
      setAllPlans([])
    } finally {
      setIsLoading(false)
    }
  }, [planType])

  useEffect(() => {
    loadPlans()
  }, [loadPlans, refreshKey])

  const handleNext = useCallback(() => {
    if (!hasNext || isLoading) return
    setPageIndex((prev) => prev + 1)
  }, [hasNext, isLoading])

  const handlePrevious = useCallback(() => {
    if (!hasPrevious || isLoading) return
    setPageIndex((prev) => prev - 1)
  }, [hasPrevious, isLoading])

  const handleRetry = useCallback(() => {
    loadPlans()
  }, [loadPlans])

  const handleToggleIsActive = useCallback(
    async (id: string, isActive: boolean) => {
      const targetPlan = allPlans.find((plan) => plan.id === id)
      if (targetPlan && isFreePlan(targetPlan)) return

      setActionError(undefined)
      const previousPlans = allPlans

      setAllPlans((prev) =>
        prev.map((plan) => (plan.id === id ? { ...plan, isActive } : plan)),
      )

      try {
        await updatePlanIsActive(id, isActive)
      } catch {
        setAllPlans(previousPlans)
        setActionError('Failed to update plan status. Please try again.')
      }
    },
    [allPlans],
  )

  const isInitialLoading = isLoading && allPlans.length === 0 && !error
  const isPageLoading = isLoading && allPlans.length > 0

  return {
    plans,
    currentPage,
    totalPages,
    isLoading,
    isInitialLoading,
    isPageLoading,
    error,
    indexUrl,
    actionError,
    hasNext,
    hasPrevious,
    handleNext,
    handlePrevious,
    handleRetry,
    handleToggleIsActive,
  }
}
