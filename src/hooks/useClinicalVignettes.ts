import { useCallback, useEffect, useMemo, useState } from 'react'
import { sortClinicalVignettePreviousQuestions } from '@/lib/clinical-vignette-sort'
import { getFirestoreErrorDetails } from '@/lib/firestore-error'
import {
  CLINICAL_VIGNETTE_PREVIOUS_PAGE_SIZE,
  fetchCurrentClinicalVignetteQuestion,
  fetchPreviousClinicalVignetteQuestions,
  resolveClinicalVignetteQuestion,
} from '@/lib/clinical-vignettes'
import type {
  ClinicalVignettePreviousSortField,
  ResolvedClinicalVignetteQuestion,
  SortDirection,
} from '@/types/clinical-vignette'

export function useClinicalVignettes(refreshKey = 0) {
  const [todaysQuestion, setTodaysQuestion] =
    useState<ResolvedClinicalVignetteQuestion | null>(null)
  const [allPreviousQuestions, setAllPreviousQuestions] = useState<
    ResolvedClinicalVignetteQuestion[]
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | undefined>()
  const [indexUrl, setIndexUrl] = useState<string | undefined>()
  const [pageIndex, setPageIndex] = useState(0)
  const [sortField, setSortField] =
    useState<ClinicalVignettePreviousSortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const sortedPreviousQuestions = useMemo(
    () =>
      sortClinicalVignettePreviousQuestions(
        allPreviousQuestions,
        sortField,
        sortDirection,
      ),
    [allPreviousQuestions, sortField, sortDirection],
  )

  const totalCount = sortedPreviousQuestions.length
  const totalPages =
    totalCount === 0 ? 1 : Math.ceil(totalCount / CLINICAL_VIGNETTE_PREVIOUS_PAGE_SIZE)
  const hasPrevious = pageIndex > 0
  const hasNext = (pageIndex + 1) * CLINICAL_VIGNETTE_PREVIOUS_PAGE_SIZE < totalCount
  const currentPage = pageIndex + 1

  const previousQuestions = useMemo(() => {
    const start = pageIndex * CLINICAL_VIGNETTE_PREVIOUS_PAGE_SIZE
    return sortedPreviousQuestions.slice(
      start,
      start + CLINICAL_VIGNETTE_PREVIOUS_PAGE_SIZE,
    )
  }, [sortedPreviousQuestions, pageIndex])

  const loadClinicalVignettes = useCallback(async () => {
    setIsLoading(true)
    setError(undefined)
    setIndexUrl(undefined)

    try {
      const [currentQuestion, previousQuestionsList] = await Promise.all([
        fetchCurrentClinicalVignetteQuestion(),
        fetchPreviousClinicalVignetteQuestions(),
      ])

      const resolvedCurrent = currentQuestion
        ? await resolveClinicalVignetteQuestion(currentQuestion)
        : null

      const resolvedPrevious = await Promise.all(
        previousQuestionsList.map((question) => resolveClinicalVignetteQuestion(question)),
      )

      setTodaysQuestion(resolvedCurrent)
      setAllPreviousQuestions(resolvedPrevious)
      setPageIndex((prev) => {
        const maxPageIndex = Math.max(
          0,
          Math.ceil(resolvedPrevious.length / CLINICAL_VIGNETTE_PREVIOUS_PAGE_SIZE) - 1,
        )
        return Math.min(prev, maxPageIndex)
      })
    } catch (loadError) {
      const details = getFirestoreErrorDetails(loadError)
      setError(details.message)
      setIndexUrl(details.indexUrl)
      setTodaysQuestion(null)
      setAllPreviousQuestions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadClinicalVignettes()
  }, [loadClinicalVignettes, refreshKey])

  const handleNext = useCallback(() => {
    if (!hasNext || isLoading) return
    setPageIndex((prev) => prev + 1)
  }, [hasNext, isLoading])

  const handlePrevious = useCallback(() => {
    if (!hasPrevious || isLoading) return
    setPageIndex((prev) => prev - 1)
  }, [hasPrevious, isLoading])

  const handleRetry = useCallback(() => {
    loadClinicalVignettes()
  }, [loadClinicalVignettes])

  const handleSort = useCallback(
    (field: ClinicalVignettePreviousSortField) => {
      setPageIndex(0)

      if (sortField === field) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
        return
      }

      setSortField(field)
      setSortDirection(field === 'createdAt' ? 'desc' : 'asc')
    },
    [sortField],
  )

  const isInitialLoading = isLoading && !todaysQuestion && allPreviousQuestions.length === 0 && !error
  const isPageLoading = isLoading && (todaysQuestion !== null || allPreviousQuestions.length > 0)

  return {
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
    refreshClinicalVignettes: loadClinicalVignettes,
  }
}
