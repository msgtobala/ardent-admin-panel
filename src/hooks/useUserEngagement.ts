import { useCallback, useEffect, useState } from 'react'
import { fetchUserLoginEngagement } from '@/lib/user-engagement'
import type { UserEngagementData } from '@/types/user-engagement'

export function useUserEngagement(year: number) {
  const [data, setData] = useState<UserEngagementData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | undefined>()

  const loadEngagement = useCallback(async () => {
    setIsLoading(true)
    setError(undefined)

    try {
      const engagement = await fetchUserLoginEngagement(year)
      setData(engagement)
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load user engagement. Please try again.'
      setError(message)
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }, [year])

  useEffect(() => {
    void loadEngagement()
  }, [loadEngagement])

  return {
    data,
    isLoading,
    error,
    handleRetry: loadEngagement,
  }
}
