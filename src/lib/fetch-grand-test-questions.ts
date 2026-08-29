import { collection, doc, getDocs, orderBy, query } from 'firebase/firestore'

import { db } from '@/lib/firebase'
import { GRAND_TESTS_COLLECTION } from '@/lib/grand-tests'

export interface GrandTestExportQuestion {
  order: number
  questionNumber: number
  question: string
  questionImageUrl: string | null
  options: string[]
  correctOptionIndex: number
  correctOptionLabel: string
  correctDescription: string
  correctAnswerImageUrls: string[]
}

function optionIndexToLabel(index: number): string {
  return String.fromCharCode(65 + index)
}

function readQuestionImage(value: unknown): string | null {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (!trimmed || trimmed === 'NULL') return null

  return trimmed
}

function readCorrectAnswerImages(correctOption: unknown): string[] {
  if (!correctOption || typeof correctOption !== 'object') return []

  const image = (correctOption as Record<string, unknown>).image

  if (Array.isArray(image)) {
    return image
      .filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
      .map((url) => url.trim())
  }

  if (typeof image === 'string' && image.trim()) {
    return [image.trim()]
  }

  return []
}

function readOptions(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  return value
    .map((option) => (typeof option === 'string' ? option.trim() : ''))
    .filter((option) => option.length > 0)
}

export async function fetchGrandTestQuestionsForExport(
  testId: string,
): Promise<GrandTestExportQuestion[]> {
  const testRef = doc(db, GRAND_TESTS_COLLECTION, testId)
  const questionsSnapshot = await getDocs(
    query(collection(testRef, 'questions'), orderBy('order', 'asc')),
  )

  return questionsSnapshot.docs.map((questionDoc, index) => {
    const data = questionDoc.data()
    const options = readOptions(data.options)
    const correctOption = data.correctOption
    const correctOptionRecord =
      correctOption && typeof correctOption === 'object'
        ? (correctOption as Record<string, unknown>)
        : null

    const correctOptionNumber =
      typeof correctOptionRecord?.option === 'number' ? correctOptionRecord.option : 1
    const correctIndex = Math.max(0, Math.min(options.length - 1, correctOptionNumber - 1))
    const correctDescription =
      typeof correctOptionRecord?.description === 'string'
        ? correctOptionRecord.description.trim()
        : ''

    return {
      order: typeof data.order === 'number' ? data.order : index,
      questionNumber: index + 1,
      question:
        typeof data.question === 'string' && data.question.trim()
          ? data.question.trim()
          : `Question ${index + 1}`,
      questionImageUrl: readQuestionImage(data.questionImage),
      options,
      correctOptionIndex: correctIndex,
      correctOptionLabel: optionIndexToLabel(correctIndex),
      correctDescription,
      correctAnswerImageUrls: readCorrectAnswerImages(correctOption),
    }
  })
}
