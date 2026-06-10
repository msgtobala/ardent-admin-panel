import { useCallback, useEffect, useState } from 'react'
import { getStudentsCount } from '@/lib/students'
import { getTotalVideoLessonsCount } from '@/lib/video-lessons'

export interface DashboardStats {
  totalStudents: number
  totalVideos: number
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalVideos: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | undefined>()

  const loadStats = useCallback(async () => {
    setIsLoading(true)
    setError(undefined)

    try {
      const [totalStudents, totalVideos] = await Promise.all([
        getStudentsCount(),
        getTotalVideoLessonsCount(),
      ])

      setStats({ totalStudents, totalVideos })
    } catch {
      setError('Failed to load dashboard stats. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadStats()
  }, [loadStats])

  return {
    stats,
    isLoading,
    error,
    handleRetry: loadStats,
  }
}
