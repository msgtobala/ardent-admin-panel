import type { DocumentData } from 'firebase/firestore'
import type { GrandTestQuestionWrite } from '@/types/grand-test'

interface QbankAnswerOptionEntry {
  choice?: string
  text?: string
  optionText?: string
  answer?: string
  value?: string
  description?: string
}

interface QbankQuestionSource {
  id?: string
  question?: string
  questionImage?: string | null
  answerOptions?: Array<QbankAnswerOptionEntry | string> | Record<string, unknown>
  correctAnswer?: {
    option?: number
    description?: string
    image?: string | string[]
  }
  tags?: string[]
  microtopics?: string[]
}

function isPlaceholderImage(url: string | null | undefined): boolean {
  if (!url || url === 'NULL') return true
  return url.includes('app.mu3innovativesolutions.com')
}

function normalizeQuestionImage(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string' || url.trim() === '' || isPlaceholderImage(url)) {
    return null
  }
  return url
}

function normalizeExplanationImages(image: string | string[] | undefined): string[] {
  if (!image) return []
  if (Array.isArray(image)) {
    return image.filter((item) => typeof item === 'string' && item.trim() !== '')
  }
  if (typeof image === 'string' && image.trim() !== '') {
    return [image]
  }
  return []
}

function resolveSubject(data: QbankQuestionSource): string {
  const tag = data.tags?.find((item) => typeof item === 'string' && item.trim() !== '')
  if (tag) return tag.trim()

  const topic = data.microtopics?.find(
    (item) => typeof item === 'string' && item.trim() !== '',
  )
  if (topic) return topic.trim()

  return 'General'
}

function getAnswerOptionLabel(option: QbankAnswerOptionEntry): string {
  const fields = ['choice', 'text', 'optionText', 'answer', 'value', 'description'] as const

  for (const field of fields) {
    const value = option[field]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }

  return ''
}

function extractOptions(data: QbankQuestionSource): string[] {
  const rawOptions = data.answerOptions
  if (!rawOptions) return []

  if (Array.isArray(rawOptions)) {
    return rawOptions
      .map((entry) => {
        if (typeof entry === 'string' && entry.trim()) return entry.trim()
        if (!entry || typeof entry !== 'object') return ''
        return getAnswerOptionLabel(entry as QbankAnswerOptionEntry)
      })
      .filter((choice) => choice.length > 0)
  }

  if (typeof rawOptions === 'object') {
    return Object.values(rawOptions)
      .map((entry) => {
        if (typeof entry === 'string' && entry.trim()) return entry.trim()
        if (!entry || typeof entry !== 'object') return ''
        return getAnswerOptionLabel(entry as QbankAnswerOptionEntry)
      })
      .filter((choice) => choice.length > 0)
  }

  return []
}

/**
 * Map qbank question shape to grand_tests/{testId}/questions document fields.
 * correctOption.option is 1-based (matches backend evaluateAttempt / scoreAttempt).
 */
export function transformQbankToGrandTestQuestion(
  docId: string,
  data: DocumentData,
  order: number,
): GrandTestQuestionWrite {
  const source = data as QbankQuestionSource
  const questionText = typeof source.question === 'string' ? source.question.trim() : ''

  if (!questionText) {
    throw new Error(`Question ${docId} is missing question text`)
  }

  const options = extractOptions(source)
  if (options.length === 0) {
    throw new Error(`Question ${docId} is missing answer options`)
  }

  const rawCorrectOption = source.correctAnswer?.option
  const zeroBasedCorrect =
    typeof rawCorrectOption === 'number'
      ? rawCorrectOption
      : typeof rawCorrectOption === 'string'
        ? Number.parseInt(rawCorrectOption, 10)
        : 0

  if (
    Number.isNaN(zeroBasedCorrect) ||
    zeroBasedCorrect < 0 ||
    zeroBasedCorrect >= options.length
  ) {
    throw new Error(
      `Question ${docId} has an invalid correct answer index`,
    )
  }

  const description =
    typeof source.correctAnswer?.description === 'string'
      ? source.correctAnswer.description.trim()
      : ''

  return {
    id: typeof source.id === 'string' && source.id.trim() !== '' ? source.id.trim() : docId,
    question: questionText,
    questionImage: normalizeQuestionImage(source.questionImage),
    options,
    correctOption: {
      option: zeroBasedCorrect + 1,
      description,
      image: normalizeExplanationImages(source.correctAnswer?.image),
    },
    subject: resolveSubject(source),
    order,
  }
}
