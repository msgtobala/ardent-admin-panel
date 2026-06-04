import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { getFirestoreErrorDetails } from '@/lib/firestore-error'
import {
  VIDEO_SUBJECTS_PAGE_SIZE,
  fetchVideoSubjects,
  updateVideoSubjectIsActive,
} from '@/lib/video-subjects'
import type { VideoSubject } from '@/types/video-subject'

export function useVideoSubjects(refreshKey = 0) {
  const { showSnackbar } = useSnackbar()
  const [allSubjects, setAllSubjects] = useState<VideoSubject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | undefined>()
  const [indexUrl, setIndexUrl] = useState<string | undefined>()
  const [pageIndex, setPageIndex] = useState(0)

  const totalCount = allSubjects.length
  const totalPages =
    totalCount === 0 ? 1 : Math.ceil(totalCount / VIDEO_SUBJECTS_PAGE_SIZE)
  const hasPrevious = pageIndex > 0
  const hasNext = (pageIndex + 1) * VIDEO_SUBJECTS_PAGE_SIZE < totalCount
  const currentPage = pageIndex + 1

  const subjects = useMemo(() => {
    const start = pageIndex * VIDEO_SUBJECTS_PAGE_SIZE
    return allSubjects.slice(start, start + VIDEO_SUBJECTS_PAGE_SIZE)
  }, [allSubjects, pageIndex])

  const loadSubjects = useCallback(async () => {
    setIsLoading(true)
    setError(undefined)
    setIndexUrl(undefined)

    try {
      const nextSubjects = await fetchVideoSubjects()
      setAllSubjects(nextSubjects)
      setPageIndex(0)
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
        await updateVideoSubjectIsActive(id, isActive)
        showSnackbar('Video subject status updated successfully')
      } catch {
        setAllSubjects(previousSubjects)
        showSnackbar('Failed to update video subject status. Please try again.')
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
