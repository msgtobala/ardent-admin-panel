import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { getFirestoreErrorDetails } from '@/lib/firestore-error'
import {
  QBANK_SUBJECTS_PAGE_SIZE,
  fetchQbankSubjects,
  updateQbankSubjectIsActive,
} from '@/lib/qbank-subjects'
import type { QbankSubject } from '@/types/qbank-subject'

export function useQbankSubjects(refreshKey = 0) {
  const { showSnackbar } = useSnackbar()
  const [allSubjects, setAllSubjects] = useState<QbankSubject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | undefined>()
  const [indexUrl, setIndexUrl] = useState<string | undefined>()
  const [pageIndex, setPageIndex] = useState(0)

  const totalCount = allSubjects.length
  const totalPages =
    totalCount === 0 ? 1 : Math.ceil(totalCount / QBANK_SUBJECTS_PAGE_SIZE)
  const hasPrevious = pageIndex > 0
  const hasNext = (pageIndex + 1) * QBANK_SUBJECTS_PAGE_SIZE < totalCount
  const currentPage = pageIndex + 1

  const subjects = useMemo(() => {
    const start = pageIndex * QBANK_SUBJECTS_PAGE_SIZE
    return allSubjects.slice(start, start + QBANK_SUBJECTS_PAGE_SIZE)
  }, [allSubjects, pageIndex])

  const loadSubjects = useCallback(async () => {
    setIsLoading(true)
    setError(undefined)
    setIndexUrl(undefined)

    try {
      const nextSubjects = await fetchQbankSubjects()
      setAllSubjects(nextSubjects)
      setPageIndex((prev) => {
        const maxPageIndex = Math.max(
          0,
          Math.ceil(nextSubjects.length / QBANK_SUBJECTS_PAGE_SIZE) - 1,
        )
        return Math.min(prev, maxPageIndex)
      })
    } catch (loadError) {
      const details = getFirestoreErrorDetails(loadError)
      setError(details.message)
      setIndexUrl(details.indexUrl)
      setAllSubjects([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSubjects()
  }, [loadSubjects, refreshKey])

  const handleNext = useCallback(() => {
    if (!hasNext || isLoading) return
    setPageIndex((prev) => prev + 1)
  }, [hasNext, isLoading])

  const handlePrevious = useCallback(() => {
    if (!hasPrevious || isLoading) return
    setPageIndex((prev) => prev - 1)
  }, [hasPrevious, isLoading])

  const handleRetry = useCallback(() => {
    loadSubjects()
  }, [loadSubjects])

  const handleToggleIsActive = useCallback(
    async (id: string, isActive: boolean) => {
      const previousSubjects = allSubjects

      setAllSubjects((prev) =>
        prev.map((subject) =>
          subject.id === id ? { ...subject, isActive } : subject,
        ),
      )

      try {
        await updateQbankSubjectIsActive(id, isActive)
        showSnackbar('Qbank subject status updated successfully')
      } catch {
        setAllSubjects(previousSubjects)
        showSnackbar('Failed to update qbank subject status. Please try again.')
      }
    },
    [allSubjects, showSnackbar],
  )

  const isInitialLoading = isLoading && allSubjects.length === 0 && !error
  const isPageLoading = isLoading && allSubjects.length > 0

  return {
    subjects,
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
    handleToggleIsActive,
    refreshSubjects: loadSubjects,
  }
}
