import { useCallback, useEffect, useMemo, useState } from 'react'
import { getFirestoreErrorDetails } from '@/lib/firestore-error'
import {
  VIDEO_LESSONS_PAGE_SIZE,
  deleteVideoLesson,
  fetchVideoLessons,
} from '@/lib/video-lessons'
import { fetchVideoSubjects } from '@/lib/video-subjects'
import type { VideoLesson } from '@/types/video-lesson'
import type { VideoSubject } from '@/types/video-subject'

export function useVideosPage(refreshKey = 0) {
  const [subjects, setSubjects] = useState<VideoSubject[]>([])
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [allLessons, setAllLessons] = useState<VideoLesson[]>([])
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true)
  const [isLoadingLessons, setIsLoadingLessons] = useState(false)
  const [subjectsError, setSubjectsError] = useState<string | undefined>()
  const [lessonsError, setLessonsError] = useState<string | undefined>()
  const [lessonsIndexUrl, setLessonsIndexUrl] = useState<string | undefined>()
  const [pageIndex, setPageIndex] = useState(0)

  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.id === selectedSubjectId) ?? null,
    [subjects, selectedSubjectId],
  )

  const totalCount = allLessons.length
  const totalPages = totalCount === 0 ? 1 : Math.ceil(totalCount / VIDEO_LESSONS_PAGE_SIZE)
  const hasPrevious = pageIndex > 0
  const hasNext = (pageIndex + 1) * VIDEO_LESSONS_PAGE_SIZE < totalCount
  const currentPage = pageIndex + 1

  const lessons = useMemo(() => {
    const start = pageIndex * VIDEO_LESSONS_PAGE_SIZE
    return allLessons.slice(start, start + VIDEO_LESSONS_PAGE_SIZE)
  }, [allLessons, pageIndex])

  const loadSubjects = useCallback(async () => {
    setIsLoadingSubjects(true)
    setSubjectsError(undefined)

    try {
      const nextSubjects = await fetchVideoSubjects()
      setSubjects(nextSubjects)
      setSelectedSubjectId((prev) => {
        if (prev && nextSubjects.some((subject) => subject.id === prev)) {
          return prev
        }
        return nextSubjects[0]?.id ?? ''
      })
    } catch (loadError) {
      const details = getFirestoreErrorDetails(loadError)
      setSubjectsError(details.message)
      setSubjects([])
      setSelectedSubjectId('')
    } finally {
      setIsLoadingSubjects(false)
    }
  }, [])

  const loadLessons = useCallback(async (subjectId: string) => {
    if (!subjectId) {
      setAllLessons([])
      setLessonsError(undefined)
      setLessonsIndexUrl(undefined)
      return
    }

    setIsLoadingLessons(true)
    setLessonsError(undefined)
    setLessonsIndexUrl(undefined)

    try {
      const nextLessons = await fetchVideoLessons(subjectId)
      setAllLessons(nextLessons)
      setPageIndex(0)
    } catch (loadError) {
      const details = getFirestoreErrorDetails(loadError)
      setLessonsError(details.message)
      setLessonsIndexUrl(details.indexUrl)
      setAllLessons([])
    } finally {
      setIsLoadingLessons(false)
    }
  }, [])

  useEffect(() => {
    loadSubjects()
  }, [loadSubjects, refreshKey])

  useEffect(() => {
    loadLessons(selectedSubjectId)
  }, [loadLessons, selectedSubjectId, refreshKey])

  const handleSubjectChange = useCallback((subjectId: string) => {
    setSelectedSubjectId(subjectId)
    setPageIndex(0)
  }, [])

  const handleNext = useCallback(() => {
    if (!hasNext || isLoadingLessons) return
    setPageIndex((prev) => prev + 1)
  }, [hasNext, isLoadingLessons])

  const handlePrevious = useCallback(() => {
    if (!hasPrevious || isLoadingLessons) return
    setPageIndex((prev) => prev - 1)
  }, [hasPrevious, isLoadingLessons])

  const handleRetrySubjects = useCallback(() => {
    loadSubjects()
  }, [loadSubjects])

  const handleRetryLessons = useCallback(() => {
    if (!selectedSubjectId) return
    loadLessons(selectedSubjectId)
  }, [loadLessons, selectedSubjectId])

  const handleDeleteLesson = useCallback(
    async (lesson: VideoLesson) => {
      if (!selectedSubjectId) return

      await deleteVideoLesson(selectedSubjectId, lesson.id)
      await loadLessons(selectedSubjectId)
      await loadSubjects()
    },
    [loadLessons, loadSubjects, selectedSubjectId],
  )

  const handleLessonsSaved = useCallback(async () => {
    if (!selectedSubjectId) return
    await loadLessons(selectedSubjectId)
  }, [loadLessons, selectedSubjectId])

  const isLessonsInitialLoading =
    Boolean(selectedSubjectId) &&
    isLoadingLessons &&
    allLessons.length === 0 &&
    !lessonsError
  const isLessonsPageLoading =
    isLoadingLessons && (allLessons.length > 0 || Boolean(lessonsError))

  return {
    subjects,
    selectedSubjectId,
    selectedSubject,
    lessons,
    isLoadingSubjects,
    isLoadingLessons,
    subjectsError,
    lessonsError,
    lessonsIndexUrl,
    currentPage,
    totalPages,
    hasNext,
    hasPrevious,
    handleSubjectChange,
    handleNext,
    handlePrevious,
    handleRetrySubjects,
    handleRetryLessons,
    handleDeleteLesson,
    handleLessonsSaved,
    isLessonsInitialLoading,
    isLessonsPageLoading,
  }
}
