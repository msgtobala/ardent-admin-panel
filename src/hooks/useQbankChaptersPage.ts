import { useCallback, useEffect, useMemo, useState } from 'react'

import { getFirestoreErrorDetails } from '@/lib/firestore-error'
import { sortQbankChapters } from '@/lib/qbank-chapter-sort'
import {
  QBANK_CHAPTERS_PAGE_SIZE,
  fetchQbankChapters,
} from '@/lib/qbank-chapters'
import { fetchQbankSubjects } from '@/lib/qbank-subjects'
import type {
  QbankChapter,
  QbankChapterSortField,
  SortDirection,
} from '@/types/qbank-chapter'
import type { QbankSubject } from '@/types/qbank-subject'

export function useQbankChaptersPage(refreshKey = 0) {
  const [subjects, setSubjects] = useState<QbankSubject[]>([])
  const [selectedSubjectId, setSelectedSubjectId] = useState('')

  const [allChapters, setAllChapters] = useState<QbankChapter[]>([])
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true)
  const [isLoadingChapters, setIsLoadingChapters] = useState(false)

  const [subjectsError, setSubjectsError] = useState<string | undefined>()
  const [chaptersError, setChaptersError] = useState<string | undefined>()
  const [chaptersIndexUrl, setChaptersIndexUrl] = useState<string | undefined>()

  const [pageIndex, setPageIndex] = useState(0)
  const [sortField, setSortField] = useState<QbankChapterSortField>('sortOrder')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.id === selectedSubjectId) ?? null,
    [subjects, selectedSubjectId],
  )

  const sortedChapters = useMemo(
    () => sortQbankChapters(allChapters, sortField, sortDirection),
    [allChapters, sortField, sortDirection],
  )

  const totalCount = sortedChapters.length
  const totalPages =
    totalCount === 0 ? 1 : Math.ceil(totalCount / QBANK_CHAPTERS_PAGE_SIZE)
  const hasPrevious = pageIndex > 0
  const hasNext = (pageIndex + 1) * QBANK_CHAPTERS_PAGE_SIZE < totalCount
  const currentPage = pageIndex + 1

  const chapters = useMemo(() => {
    const start = pageIndex * QBANK_CHAPTERS_PAGE_SIZE
    return sortedChapters.slice(start, start + QBANK_CHAPTERS_PAGE_SIZE)
  }, [sortedChapters, pageIndex])

  const loadSubjects = useCallback(async () => {
    setIsLoadingSubjects(true)
    setSubjectsError(undefined)

    try {
      const nextSubjects = await fetchQbankSubjects()
      setSubjects(nextSubjects)

      setSelectedSubjectId((prev) => {
        if (prev && nextSubjects.some((s) => s.id === prev)) return prev
        return nextSubjects[0]?.id ?? ''
      })
    } catch (loadError) {
      const details = getFirestoreErrorDetails(loadError)
      setSubjectsError(details.message)
      setSelectedSubjectId('')
      setSubjects([])
    } finally {
      setIsLoadingSubjects(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadSubjects()
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [loadSubjects, refreshKey])

  const loadChapters = useCallback(
    async (subjectId: string) => {
      if (!subjectId) {
        setAllChapters([])
        setChaptersError(undefined)
        setChaptersIndexUrl(undefined)
        return
      }

      setIsLoadingChapters(true)
      setChaptersError(undefined)
      setChaptersIndexUrl(undefined)

      try {
        const nextChapters = await fetchQbankChapters(subjectId)
        setAllChapters(nextChapters)
        setPageIndex((prev) => {
          const maxPageIndex = Math.max(
            0,
            Math.ceil(nextChapters.length / QBANK_CHAPTERS_PAGE_SIZE) - 1,
          )
          return Math.min(prev, maxPageIndex)
        })
      } catch (loadError) {
        const details = getFirestoreErrorDetails(loadError)
        setChaptersError(details.message)
        setChaptersIndexUrl(details.indexUrl)
        setAllChapters([])
      } finally {
        setIsLoadingChapters(false)
      }
    },
    [],
  )

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadChapters(selectedSubjectId)
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [loadChapters, selectedSubjectId, refreshKey])

  const handleSubjectChange = useCallback((subjectId: string) => {
    setSelectedSubjectId(subjectId)
    setPageIndex(0)
  }, [])

  const handleNext = useCallback(() => {
    if (!hasNext || isLoadingChapters) return
    setPageIndex((prev) => prev + 1)
  }, [hasNext, isLoadingChapters])

  const handlePrevious = useCallback(() => {
    if (!hasPrevious || isLoadingChapters) return
    setPageIndex((prev) => prev - 1)
  }, [hasPrevious, isLoadingChapters])

  const handleSort = useCallback(
    (field: QbankChapterSortField) => {
      setPageIndex(0)

      if (sortField === field) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
        return
      }

      setSortField(field)
      setSortDirection('asc')
    },
    [sortField],
  )

  const handleRetrySubjects = useCallback(() => {
    loadSubjects()
  }, [loadSubjects])

  const handleRetryChapters = useCallback(() => {
    if (!selectedSubjectId) return
    loadChapters(selectedSubjectId)
  }, [loadChapters, selectedSubjectId])

  const isSubjectsInitialLoading =
    isLoadingSubjects && subjects.length === 0 && !subjectsError
  const isChaptersInitialLoading =
    Boolean(selectedSubjectId) &&
    isLoadingChapters &&
    allChapters.length === 0 &&
    !chaptersError
  const isChaptersPageLoading = isLoadingChapters && allChapters.length > 0

  return {
    subjects,
    selectedSubjectId,
    selectedSubject,
    chapters,
    isLoadingSubjects,
    isLoadingChapters,
    isSubjectsInitialLoading,
    isChaptersInitialLoading,
    isChaptersPageLoading,
    subjectsError,
    chaptersError,
    chaptersIndexUrl,
    currentPage,
    totalPages,
    hasNext,
    hasPrevious,
    sortField,
    sortDirection,
    handleSubjectChange,
    handleNext,
    handlePrevious,
    handleSort,
    handleRetrySubjects,
    handleRetryChapters,
  }
}
