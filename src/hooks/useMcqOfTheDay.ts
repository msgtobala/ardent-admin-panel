import { useCallback, useEffect, useMemo, useState } from 'react'
import { getFirestoreErrorDetails } from '@/lib/firestore-error'
import { sortMcqOfTheDayPreviousQuestions } from '@/lib/mcq-of-the-day-sort'
import {
  MCQ_OF_THE_DAY_PREVIOUS_PAGE_SIZE,
  fetchPreviousMcqQuestions,
  fetchTodaysMcqQuestion,
  resolveMcqOfTheDayQuestion,
} from '@/lib/mcq-of-the-day'
import type {
  McqOfTheDayPreviousSortField,
  ResolvedMcqOfTheDayQuestion,
  SortDirection,
} from '@/types/mcq-of-the-day'

export function useMcqOfTheDay(refreshKey = 0) {
  const [todaysQuestion, setTodaysQuestion] = useState<ResolvedMcqOfTheDayQuestion | null>(null)
  const [allPreviousQuestions, setAllPreviousQuestions] = useState<
    ResolvedMcqOfTheDayQuestion[]
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | undefined>()
  const [indexUrl, setIndexUrl] = useState<string | undefined>()
  const [pageIndex, setPageIndex] = useState(0)
  const [sortField, setSortField] = useState<McqOfTheDayPreviousSortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const sortedPreviousQuestions = useMemo(
    () =>
      sortMcqOfTheDayPreviousQuestions(allPreviousQuestions, sortField, sortDirection),
    [allPreviousQuestions, sortField, sortDirection],
  )

  const totalCount = sortedPreviousQuestions.length
  const totalPages =
    totalCount === 0 ? 1 : Math.ceil(totalCount / MCQ_OF_THE_DAY_PREVIOUS_PAGE_SIZE)
  const hasPrevious = pageIndex > 0
  const hasNext = (pageIndex + 1) * MCQ_OF_THE_DAY_PREVIOUS_PAGE_SIZE < totalCount
  const currentPage = pageIndex + 1

  const previousQuestions = useMemo(() => {
    const start = pageIndex * MCQ_OF_THE_DAY_PREVIOUS_PAGE_SIZE
    return sortedPreviousQuestions.slice(start, start + MCQ_OF_THE_DAY_PREVIOUS_PAGE_SIZE)
  }, [sortedPreviousQuestions, pageIndex])

  const loadMcqOfTheDay = useCallback(async () => {
    setIsLoading(true)
    setError(undefined)
    setIndexUrl(undefined)

    try {
      const [todaysRecord, previousQuestionsList] = await Promise.all([
        fetchTodaysMcqQuestion(),
        fetchPreviousMcqQuestions(),
      ])

      const resolvedCurrent = todaysRecord
        ? await resolveMcqOfTheDayQuestion(todaysRecord.question, {
            correctAnswerCount: todaysRecord.correctAnswerCount,
            wrongAnswerCount: todaysRecord.wrongAnswerCount,
            studentsAttendedCount: todaysRecord.studentsAttendedCount,
          })
        : null

      const resolvedPrevious = await Promise.all(
        previousQuestionsList.map((question) => resolveMcqOfTheDayQuestion(question)),
      )

      setTodaysQuestion(resolvedCurrent)
      setAllPreviousQuestions(resolvedPrevious)
      setPageIndex((prev) => {
        const maxPageIndex = Math.max(
          0,
          Math.ceil(resolvedPrevious.length / MCQ_OF_THE_DAY_PREVIOUS_PAGE_SIZE) - 1,
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
    loadMcqOfTheDay()
  }, [loadMcqOfTheDay, refreshKey])

  const handleNext = useCallback(() => {
    if (!hasNext || isLoading) return
    setPageIndex((prev) => prev + 1)
  }, [hasNext, isLoading])

  const handlePrevious = useCallback(() => {
    if (!hasPrevious || isLoading) return
    setPageIndex((prev) => prev - 1)
  }, [hasPrevious, isLoading])

  const handleRetry = useCallback(() => {
    loadMcqOfTheDay()
  }, [loadMcqOfTheDay])

  const handleSort = useCallback(
    (field: McqOfTheDayPreviousSortField) => {
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
    refreshMcqOfTheDay: loadMcqOfTheDay,
  }
}
