import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore'
import { useCallback, useEffect, useState } from 'react'
import { useSnackbar } from '@/contexts/SnackbarContext'
import {
  ACTIVE_BANNER_DELETE_MESSAGE,
  BANNERS_PAGE_SIZE,
  deleteBanner,
  fetchBannersPage,
  getBannersCount,
  updateBannerIsActive,
} from '@/lib/banners'
import type { Banner, BannerSortField, SortDirection } from '@/types/banner'

export function useBanners() {
  const { showSnackbar } = useSnackbar()
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
  const [sortField, setSortField] = useState<BannerSortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const hasPrevious = pageIndex > 0

  const currentPage = pageIndex + 1
  const totalPages =
    totalCount === 0 ? 1 : Math.ceil(totalCount / BANNERS_PAGE_SIZE)

  const loadPage = useCallback(
    async (cursor: QueryDocumentSnapshot<DocumentData> | null) => {
      setIsLoading(true)
      setError(undefined)

      try {
        const shouldFetchCount = cursor === null
        const [pageResult, count] = await Promise.all([
          fetchBannersPage({
            pageSize: BANNERS_PAGE_SIZE,
            lastDoc: cursor,
            sortField,
            sortDirection,
          }),
          shouldFetchCount ? getBannersCount() : Promise.resolve(undefined),
        ])

        setBanners(pageResult.banners)
        if (count !== undefined) setTotalCount(count)
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
      setBanners([])
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

  const handleDelete = useCallback(
    async (id: string) => {
      const banner = banners.find((item) => item.id === id)
      if (banner?.isActive) {
        throw new Error(ACTIVE_BANNER_DELETE_MESSAGE)
      }

      try {
        await deleteBanner(id)
        refreshBanners()
      } catch {
        throw new Error('Failed to delete banner')
      }
    },
    [banners, refreshBanners],
  )

  const handleToggleIsActive = useCallback(
    async (id: string, isActive: boolean) => {
      const previousBanners = banners

      setBanners((prev) =>
        prev.map((banner) =>
          banner.id === id ? { ...banner, isActive } : banner,
        ),
      )

      try {
        await updateBannerIsActive(id, isActive)
        showSnackbar('Banner status updated successfully')
      } catch {
        setBanners(previousBanners)
        showSnackbar('Failed to update banner status. Please try again.')
      }
    },
    [banners, showSnackbar],
  )

  const isInitialLoading = isLoading && banners.length === 0
  const isPageLoading = isLoading && banners.length > 0

  return {
    banners,
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
    handleToggleIsActive,
    handleDelete,
    refreshBanners,
  }
}
