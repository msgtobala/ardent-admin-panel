import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore'
import { useCallback, useEffect, useState } from 'react'
import {
  FACULTIES_PAGE_SIZE,
  deleteFaculty,
  fetchFacultiesPage,
  getFacultiesCount,
} from '@/lib/faculties'
import type { Faculty, FacultySortField, SortDirection } from '@/types/faculty'

export function useFaculties() {
  const [faculties, setFaculties] = useState<Faculty[]>([])
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
  const [sortField, setSortField] = useState<FacultySortField>('displayName')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const hasPrevious = pageIndex > 0

  const currentPage = pageIndex + 1
  const totalPages =
    totalCount === 0 ? 1 : Math.ceil(totalCount / FACULTIES_PAGE_SIZE)

  const loadPage = useCallback(
    async (cursor: QueryDocumentSnapshot<DocumentData> | null) => {
      setIsLoading(true)
      setError(undefined)

      try {
        const shouldFetchCount = cursor === null
        const [pageResult, count] = await Promise.all([
          fetchFacultiesPage({
            pageSize: FACULTIES_PAGE_SIZE,
            lastDoc: cursor,
            sortField,
            sortDirection,
          }),
          shouldFetchCount ? getFacultiesCount() : Promise.resolve(undefined),
        ])

        setFaculties(pageResult.faculties)
        if (count !== undefined) setTotalCount(count)
        setHasNext(pageResult.hasMore)
        setLastDocOnPage(pageResult.lastDoc)
      } catch {
        setError('Failed to load faculties. Please try again.')
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
    (field: FacultySortField) => {
      setFaculties([])
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

  const refreshFaculties = useCallback(() => {
    setPageIndex(0)
    setPageCursors([null])
  }, [])

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteFaculty(id)
        refreshFaculties()
      } catch {
        throw new Error('Failed to delete faculty')
      }
    },
    [refreshFaculties],
  )

  const isInitialLoading = isLoading && faculties.length === 0
  const isPageLoading = isLoading && faculties.length > 0

  return {
    faculties,
    currentPage,
    totalPages,
    isLoading,
    isInitialLoading,
    isPageLoading,
    error,
    hasNext,
    hasPrevious,
    sortField,
    sortDirection,
    handleSort,
    handleNext,
    handlePrevious,
    handleRetry,
    handleDelete,
    refreshFaculties,
  }
}
