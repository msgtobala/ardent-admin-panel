import { useCallback, useEffect, useState } from 'react'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { fetchSuggestedVideos, refreshSuggestedVideos } from '@/lib/suggested-videos'
import type { ResolvedSuggestedVideo } from '@/types/suggested-video'

export function useSuggestedVideos() {
  const { showSnackbar } = useSnackbar()
  const [videos, setVideos] = useState<ResolvedSuggestedVideo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const loadVideos = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setIsLoading(true)
    }
    setError(undefined)

    try {
      const nextVideos = await fetchSuggestedVideos()
      setVideos(nextVideos)
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load suggested videos. Please try again.'
      setError(message)
      setVideos([])
    } finally {
      if (!options?.silent) {
        setIsLoading(false)
      }
    }
  }, [])

  const handleRetry = useCallback(() => {
    void loadVideos()
  }, [loadVideos])

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true)
    setError(undefined)

    try {
      await refreshSuggestedVideos()
      await loadVideos({ silent: true })
      showSnackbar('Suggested videos generated successfully.')
    } catch (generateError) {
      const message =
        generateError instanceof Error
          ? generateError.message
          : 'Failed to generate suggested videos. Please try again.'
      setError(message)
      showSnackbar(message)
    } finally {
      setIsGenerating(false)
    }
  }, [loadVideos, showSnackbar])

  useEffect(() => {
    void loadVideos()
  }, [loadVideos])

  return {
    videos,
    isLoading,
    isGenerating,
    error,
    handleRetry,
    handleGenerate,
  }
}
