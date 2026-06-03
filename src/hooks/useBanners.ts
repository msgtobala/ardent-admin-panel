import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore'
import { useCallback, useEffect, useState } from 'react'
import {
  BANNERS_PAGE_SIZE,
  fetchBannersPage,
  getBannersCount,
  updateBannerIsActive,
} from '../lib/banners'
import type { Banner, BannerSortField, SortDirection } from '../types/banner'

export function useBanners() {
  const [banners, setBanners] = useState<Banner[]>([])
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
  const [toggleError, setToggleError] = useState<string | undefined>()
  const [sortField, setSortField] = useState<BannerSortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const hasPrevious = pageIndex > 0

  const showingFrom =
    totalCount === 0 || banners.length === 0
      ? 0
      : pageIndex * BANNERS_PAGE_SIZE + 1

  const loadPage = useCallback(
    async (cursor: QueryDocumentSnapshot<DocumentData> | null) => {
      setIsLoading(true)
      setError(undefined)

      try {
        const [pageResult, count] = await Promise.all([
          fetchBannersPage({
            pageSize: BANNERS_PAGE_SIZE,
            lastDoc: cursor,
            sortField,
            sortDirection,
          }),
          getBannersCount(),
        ])

        setBanners(pageResult.banners)
        setTotalCount(count)
        setHasNext(pageResult.hasMore)
        setLastDocOnPage(pageResult.lastDoc)
      } catch {
        setError('Failed to load banners. Please try again.')
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
    (field: BannerSortField) => {
      setPageIndex(0)
      setPageCursors([null])

      if (sortField === field) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
        return
      }

      setSortField(field)
      setSortDirection(field === 'createdAt' ? 'desc' : 'asc')
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

  const refreshBanners = useCallback(() => {
    setPageIndex(0)
    setPageCursors([null])
  }, [])

  const handleToggleIsActive = useCallback(
    async (id: string, isActive: boolean) => {
      setToggleError(undefined)
      const previousBanners = banners

      setBanners((prev) =>
        prev.map((banner) =>
          banner.id === id ? { ...banner, isActive } : banner,
        ),
      )

      try {
        await updateBannerIsActive(id, isActive)
      } catch {
        setBanners(previousBanners)
        setToggleError('Failed to update banner status. Please try again.')
      }
    },
    [banners],
  )

  return {
    banners,
    totalCount,
    showingFrom,
    isLoading,
    error,
    toggleError,
    hasNext,
    hasPrevious,
    sortField,
    sortDirection,
    handleSort,
    handleNext,
    handlePrevious,
    handleRetry,
    handleToggleIsActive,
    refreshBanners,
  }
}
