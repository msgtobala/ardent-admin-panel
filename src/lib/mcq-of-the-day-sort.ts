import type {
  McqOfTheDayPreviousSortField,
  ResolvedMcqOfTheDayQuestion,
} from '@/types/mcq-of-the-day'
import type { SortDirection } from '@/types/table'

function compareStrings(
  left: string,
  right: string,
  sortDirection: SortDirection,
): number {
  const result = left.localeCompare(right, undefined, { sensitivity: 'base' })
  return sortDirection === 'asc' ? result : -result
}

function compareDates(left: Date, right: Date, sortDirection: SortDirection): number {
  const result = left.getTime() - right.getTime()
  return sortDirection === 'asc' ? result : -result
}

export function sortMcqOfTheDayPreviousQuestions(
  questions: ResolvedMcqOfTheDayQuestion[],
  sortField: McqOfTheDayPreviousSortField,
  sortDirection: SortDirection,
): ResolvedMcqOfTheDayQuestion[] {
  const sorted = [...questions]

  sorted.sort((left, right) => {
    switch (sortField) {
      case 'subjectName':
        return compareStrings(left.subjectName, right.subjectName, sortDirection)
      case 'questionText':
        return compareStrings(left.questionText, right.questionText, sortDirection)
      case 'createdAt':
        return compareDates(left.createdAt, right.createdAt, sortDirection)
      default:
        return 0
    }
  })

  return sorted
}
