import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore'
import { useCallback, useEffect, useState } from 'react'
import { getFirestoreErrorDetails } from '@/lib/firestore-error'
import { searchStudents } from '@/lib/search-students'
import {
  STUDENTS_PAGE_SIZE,
  fetchStudentsPage,
  getStudentsCount,
  resolveStudentsDeviceDetails,
} from '@/lib/students'
import type { StudentSortField, SortDirection } from '@/types/student'

export function useStudents() {
  const [students, setStudents] = useState<Awaited<ReturnType<typeof fetchStudentsPage>>['students']>([])
  const [totalCount, setTotalCount] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('')
  const [pageIndex, setPageIndex] = useState(0)
  const [pageCursors, setPageCursors] = useState<
    (QueryDocumentSnapshot<DocumentData> | null)[]
  >([null])
  const [hasNext, setHasNext] = useState(false)
  const [hasPrevious, setHasPrevious] = useState(false)
  const [lastDocOnPage, setLastDocOnPage] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [sortField, setSortField] = useState<StudentSortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | undefined>()
  const [errorIndexUrl, setErrorIndexUrl] = useState<string | undefined>()

  const isSearchActive = appliedSearchQuery.trim().length > 0
  const currentPage = pageIndex + 1
  const totalPages = totalCount === 0 ? 1 : Math.ceil(totalCount / STUDENTS_PAGE_SIZE)

  const applySearch = useCallback((query: string) => {
    const trimmedQuery = query.trim()

    setAppliedSearchQuery((currentQuery) => {
      if (currentQuery === trimmedQuery) return currentQuery
      return trimmedQuery
    })

    setPageIndex(0)
    setPageCursors([null])
  }, [])

  const handleSearchInputChange = useCallback((value: string) => {
    setSearchInput(value)
  }, [])

  const handleSearchSubmit = useCallback(() => {
    applySearch(searchInput)
  }, [applySearch, searchInput])

  const handleSearchClear = useCallback(() => {
    setSearchInput('')
    applySearch('')
  }, [applySearch])

  const loadCurrentPage = useCallback(
    async (isActive: () => boolean) => {
      setIsLoading(true)
      setError(undefined)
      setErrorIndexUrl(undefined)

      try {
        if (isSearchActive) {
          const result = await searchStudents({
            query: appliedSearchQuery,
            page: pageIndex,
            pageSize: STUDENTS_PAGE_SIZE,
          })

          if (!isActive()) return

          const studentsWithDeviceDetails = await resolveStudentsDeviceDetails(
            result.students,
          )

          if (!isActive()) return

          setStudents(studentsWithDeviceDetails)
          setTotalCount(result.totalCount)
          setHasNext(result.hasNext)
          setHasPrevious(result.hasPrevious)
          return
        }

        const cursor = pageCursors[pageIndex] ?? null
        const shouldFetchCount = cursor === null
        const [pageResult, count] = await Promise.all([
          fetchStudentsPage({
            pageSize: STUDENTS_PAGE_SIZE,
            lastDoc: cursor,
            sortField,
            sortDirection,
            searchQuery: '',
          }),
          shouldFetchCount ? getStudentsCount() : Promise.resolve(undefined),
        ])

        if (!isActive()) return

        const studentsWithDeviceDetails = await resolveStudentsDeviceDetails(
          pageResult.students,
        )

        if (!isActive()) return

        setStudents(studentsWithDeviceDetails)
        if (count !== undefined) setTotalCount(count)
        setHasNext(pageResult.hasMore)
        setHasPrevious(pageIndex > 0)
        setLastDocOnPage(pageResult.lastDoc)
      } catch (loadError) {
        if (!isActive()) return

        if (isSearchActive) {
          const message =
            loadError instanceof Error
              ? loadError.message
              : 'Failed to search students. Please try again.'
          setError(message)
          setErrorIndexUrl(undefined)
        } else {
          const details = getFirestoreErrorDetails(
            loadError,
            'Failed to load students. Please try again.',
          )
          setError(details.message)
          setErrorIndexUrl(details.indexUrl)
        }

        setStudents([])
        setHasNext(false)
        setHasPrevious(false)
        setLastDocOnPage(null)
      } finally {
        if (isActive()) setIsLoading(false)
      }
    },
    [
      appliedSearchQuery,
      isSearchActive,
      pageCursors,
      pageIndex,
      sortDirection,
      sortField,
    ],
  )

  useEffect(() => {
    let active = true

    void (async () => {
      await Promise.resolve()
      if (!active) return
      await loadCurrentPage(() => active)
    })()

    return () => {
      active = false
    }
  }, [loadCurrentPage])

  const handleSort = useCallback(
    (field: StudentSortField) => {
      if (appliedSearchQuery.trim()) return

      setStudents([])
      setPageIndex(0)
      setPageCursors([null])

      if (sortField === field) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
        return
      }

      setSortField(field)
      setSortDirection('asc')
    },
    [appliedSearchQuery, sortField],
  )

  const handleNext = useCallback(() => {
    if (!hasNext || isLoading) return

    if (isSearchActive) {
      setPageIndex((prev) => prev + 1)
      return
    }

    if (!lastDocOnPage) return

    setPageCursors((prev) => {
      const next = [...prev]
      next[pageIndex + 1] = lastDocOnPage
      return next
    })
    setPageIndex((prev) => prev + 1)
  }, [hasNext, isLoading, isSearchActive, lastDocOnPage, pageIndex])

  const handlePrevious = useCallback(() => {
    if (!hasPrevious || isLoading) return
    setPageIndex((prev) => prev - 1)
  }, [hasPrevious, isLoading])

  const handleRetry = useCallback(() => {
    void loadCurrentPage(() => true)
  }, [loadCurrentPage])

  const refreshStudents = useCallback(() => {
    void loadCurrentPage(() => true)
  }, [loadCurrentPage])

  const isInitialLoading = isLoading && students.length === 0 && !error
  const isPageLoading = isLoading && students.length > 0

  return {
    students,
    searchInput,
    appliedSearchQuery,
    handleSearchInputChange,
    handleSearchSubmit,
    handleSearchClear,
    isSearchActive,
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
    handleSort,
    handleNext,
    handlePrevious,
    handleRetry,
    refreshStudents,
  }
}
