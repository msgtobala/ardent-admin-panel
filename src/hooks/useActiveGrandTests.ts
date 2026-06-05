import { useCallback, useEffect, useState } from 'react'
import { fetchActiveGrandTests, groupGrandTestsByMonth } from '@/lib/grand-tests'
import type { GrandTestMonthGroup } from '@/types/grand-test'

export function useActiveGrandTests() {
  const [monthGroups, setMonthGroups] = useState<GrandTestMonthGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | undefined>()

  const loadTests = useCallback(async () => {
    setIsLoading(true)
    setError(undefined)

    try {
      const tests = await fetchActiveGrandTests()
      setMonthGroups(groupGrandTestsByMonth(tests, (test) => test.testStart))
    } catch {
      setError('Failed to load active grand tests. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTests()
  }, [loadTests])

  return {
    monthGroups,
    isLoading,
    error,
    handleRetry: loadTests,
  }
}
