import type { QbankAnswerOption } from '@/types/qbank-question'

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
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
