import { useCallback, useEffect, useState } from 'react'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { fetchCurrentTenMinsConcept, suggestTenMinsConcept } from '@/lib/ten-mins-concept'
import type { ResolvedTenMinsConcept } from '@/types/ten-mins-concept'

export function useTenMinsConcept() {
  const { showSnackbar } = useSnackbar()
  const [concept, setConcept] = useState<ResolvedTenMinsConcept | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const loadConcept = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setIsLoading(true)
    }
    setError(undefined)

    try {
      const nextConcept = await fetchCurrentTenMinsConcept()
      setConcept(nextConcept)
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load 10 mins concept. Please try again.'
      setError(message)
      setConcept(null)
    } finally {
      if (!options?.silent) {
        setIsLoading(false)
      }
    }
  }, [])

  const handleRetry = useCallback(() => {
    void loadConcept()
  }, [loadConcept])

  const handleSuggest = useCallback(async () => {
    setIsSuggesting(true)
    setError(undefined)

    try {
      await suggestTenMinsConcept()
      await loadConcept({ silent: true })
      showSnackbar('10 mins concept suggested successfully.')
    } catch (suggestError) {
      const message =
        suggestError instanceof Error
          ? suggestError.message
          : 'Failed to suggest 10 mins concept. Please try again.'
      setError(message)
      showSnackbar(message)
    } finally {
      setIsSuggesting(false)
    }
  }, [loadConcept, showSnackbar])

  useEffect(() => {
    void loadConcept()
  }, [loadConcept])

  return {
    concept,
    isLoading,
    isSuggesting,
    error,
    handleRetry,
    handleSuggest,
  }
}
