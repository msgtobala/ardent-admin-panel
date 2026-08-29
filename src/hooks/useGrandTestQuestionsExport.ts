import { useCallback, useState } from 'react'

import { exportGrandTestQuestionsPdf } from '@/lib/export-grand-test-questions'
import { fetchGrandTestQuestionsForExport } from '@/lib/fetch-grand-test-questions'
import type { GrandTest } from '@/types/grand-test'

export function useGrandTestQuestionsExport() {
  const [exportingTestId, setExportingTestId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const clearExportError = useCallback(() => {
    setError(null)
  }, [])

  const handleExportQuestions = useCallback(async (test: GrandTest) => {
    setExportingTestId(test.id)
    setError(null)

    try {
      const questions = await fetchGrandTestQuestionsForExport(test.id)

      if (questions.length === 0) {
        throw new Error('This test has no questions to export')
      }

      await exportGrandTestQuestionsPdf(test, questions)
    } catch (exportError) {
      const message =
        exportError instanceof Error
          ? exportError.message
          : 'Failed to export test questions'
      setError(message)
    } finally {
      setExportingTestId(null)
    }
  }, [])

  return {
    exportingTestId,
    error,
    clearExportError,
    handleExportQuestions,
  }
}
