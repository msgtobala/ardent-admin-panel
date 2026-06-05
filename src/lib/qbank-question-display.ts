import type { QbankAnswerOption, QbankCorrectAnswer } from '@/types/qbank-question'

const CORRECT_ANSWER_SUMMARY_MAX_LENGTH = 60

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function resolveCorrectOptionKey(
  answerOptions: QbankAnswerOption[],
  rawOption: string,
): string {
  const normalizedKey = rawOption.trim()
  if (!normalizedKey || answerOptions.length === 0) return normalizedKey

  const directMatch = answerOptions.find(
    (answerOption) =>
      answerOption.option === normalizedKey ||
      answerOption.option.toLowerCase() === normalizedKey.toLowerCase(),
  )
  if (directMatch) return directMatch.option

  const optionIndex = Number(normalizedKey)
  if (!Number.isNaN(optionIndex) && optionIndex >= 0 && optionIndex < answerOptions.length) {
    return answerOptions[optionIndex].option
  }

  return normalizedKey
}

export function resolveCorrectAnswerChoice(
  answerOptions: QbankAnswerOption[],
  correctOptionKey: string,
): string {
  if (!correctOptionKey || answerOptions.length === 0) return ''

  const normalizedKey = correctOptionKey.trim()

  const directMatch = answerOptions.find(
    (answerOption) =>
      answerOption.option === normalizedKey ||
      answerOption.option.toLowerCase() === normalizedKey.toLowerCase(),
  )
  if (directMatch) return directMatch.choice

  const optionIndex = Number(normalizedKey)
  if (!Number.isNaN(optionIndex) && optionIndex >= 0 && optionIndex < answerOptions.length) {
    return answerOptions[optionIndex].choice
  }

  return ''
}

export function resolveCorrectAnswerDescription(
  description: string,
  correctOptionKey: string,
  choiceText: string,
): string {
  let cleaned = description.trim()
  if (!cleaned) return ''

  if (choiceText && cleaned === choiceText) return ''

  const patterns: RegExp[] = []

  if (correctOptionKey) {
    const key = escapeRegex(correctOptionKey)
    patterns.push(
      new RegExp(`^${key}\\s*[.):\\-–—]\\s*`, 'i'),
      new RegExp(`^option\\s*${key}\\s*[.):\\-–—]?\\s*`, 'i'),
    )
  }

  if (choiceText) {
    const choice = escapeRegex(choiceText)
    patterns.push(
      new RegExp(`^${choice}\\s*[.):\\-–—]?\\s*`, 'i'),
      new RegExp(`^${choice}$`, 'i'),
    )
  }

  for (const pattern of patterns) {
    cleaned = cleaned.replace(pattern, '').trim()
  }

  if (choiceText && cleaned.toLowerCase() === choiceText.toLowerCase()) return ''

  return cleaned
}

export function formatCorrectAnswerSummary(
  answerOptions: QbankAnswerOption[],
  correctAnswer: QbankCorrectAnswer | null,
): string {
  if (!correctAnswer) return ''

  const correctOptionKey = correctAnswer.option.trim()
  const choiceText = resolveCorrectAnswerChoice(answerOptions, correctOptionKey)
  const description = resolveCorrectAnswerDescription(
    correctAnswer.description,
    correctOptionKey,
    choiceText,
  )

  const parts: string[] = []
  if (correctOptionKey) parts.push(correctOptionKey)
  if (choiceText) parts.push(choiceText)
  if (description) {
    const truncated =
      description.length > CORRECT_ANSWER_SUMMARY_MAX_LENGTH
        ? `${description.slice(0, CORRECT_ANSWER_SUMMARY_MAX_LENGTH)}…`
        : description
    parts.push(truncated)
  }

  return parts.join(' · ')
}

export function isCorrectAnswerOption(
  answerOption: QbankAnswerOption,
  optionIndex: number,
  correctOptionKey: string,
): boolean {
  if (!correctOptionKey) return false

  if (
    answerOption.option === correctOptionKey ||
    answerOption.option.toLowerCase() === correctOptionKey.toLowerCase()
  ) {
    return true
  }

  const numericKey = Number(correctOptionKey)
  return !Number.isNaN(numericKey) && numericKey === optionIndex
}
